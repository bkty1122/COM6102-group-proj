// questionBankExporter.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class QuestionBankExporter {
  constructor(dbPath) {
    this.dbPath = dbPath || path.join(__dirname, 'production_questionbank.db');
    this.db = null;
  }

  /**
   * Connect to the database
   */
  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(new Error(`Failed to connect to database: ${err.message}`));
          return;
        }
        resolve();
      });
    });
  }

  /**
   * Close the database connection
   */
  close() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }
      
      this.db.close((err) => {
        if (err) {
          reject(new Error(`Failed to close database: ${err.message}`));
          return;
        }
        this.db = null;
        resolve();
      });
    });
  }

  /**
   * Run a database query
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} - Query results
   */
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(new Error(`Query failed: ${err.message} - SQL: ${sql}`));
          return;
        }
        resolve(rows);
      });
    });
  }

  /**
   * Get a single row from a query
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} - Query result
   */
  getSingle(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(new Error(`Query failed: ${err.message} - SQL: ${sql}`));
          return;
        }
        resolve(row);
      });
    });
  }

  /**
   * Parse JSON fields in an object
   * @param {Object} obj - Object with potential JSON fields
   * @returns {Object} - Object with parsed JSON fields
   */
  parseJsonFields(obj) {
    if (!obj) return obj;
    
    const result = { ...obj };
    const jsonFields = [
      'options_data', 
      'media_data', 
      'blanks_data', 
      'correct_answers', 
      'settings_data', 
      'session_settings', 
      'question_specific_settings'
    ];
    
    jsonFields.forEach(field => {
      if (result[field] && typeof result[field] === 'string') {
        try {
          result[field] = JSON.parse(result[field]);
        } catch (e) {
          console.warn(`Failed to parse JSON in ${field}: ${e.message}`);
        }
      }
    });
    
    return result;
  }

  /**
   * Get question bank metadata
   * @param {string} questionbankId - Question bank ID
   * @returns {Promise<Object>} - Question bank metadata
   */
  async getQuestionBankMetadata(questionbankId) {
    const sql = `
      SELECT * FROM question_banks 
      WHERE questionbank_id = ?
    `;
    
    const bank = await this.getSingle(sql, [questionbankId]);
    if (!bank) {
      throw new Error(`Question bank not found with ID: ${questionbankId}`);
    }
    
    return this.parseJsonFields(bank);
  }

  /**
   * Get pages for a question bank
   * @param {string} questionbankId - Question bank ID
   * @returns {Promise<Array>} - Array of pages
   */
  async getPages(questionbankId) {
    const sql = `
      SELECT * FROM question_bank_pages 
      WHERE questionbank_id = ? 
      ORDER BY page_index
    `;
    
    const pages = await this.query(sql, [questionbankId]);
    return pages.map(page => this.parseJsonFields(page));
  }

  /**
   * Get cards for a page
   * @param {number} pageId - Page ID
   * @returns {Promise<Array>} - Array of cards
   */
  async getCards(pageId) {
    const sql = `
      SELECT * FROM cards 
      WHERE page_id = ? 
      ORDER BY position
    `;
    
    const cards = await this.query(sql, [pageId]);
    return cards.map(card => this.parseJsonFields(card));
  }

  /**
   * Get content for a card
   * @param {number} cardId - Card ID
   * @param {string} cardType - Card type
   * @returns {Promise<Array>} - Array of content items
   */
  async getCardContent(cardId, cardType) {
    let tableName;
    
    if (cardType === 'question') {
      // For question cards, we need to check multiple tables
      const contentTypes = [
        'single_choice_questions',
        'multiple_choice_questions',
        'fill_in_blank_questions',
        'matching_questions',
        'long_text_questions',
        'audio_response_questions',
        'llm_audio_response_questions'
      ];
      
      for (const type of contentTypes) {
        const sql = `SELECT COUNT(*) as count FROM ${type} WHERE card_id = ?`;
        const result = await this.getSingle(sql, [cardId]);
        
        if (result && result.count > 0) {
          tableName = type;
          break;
        }
      }
      
      if (!tableName) {
        console.warn(`No content found for question card ID: ${cardId}`);
        return [];
      }
    } else if (cardType === 'material') {
      // For material cards, check material tables
      const materialTypes = [
        'text_materials',
        'multimedia_materials',
        'llm_session_materials'
      ];
      
      for (const type of materialTypes) {
        const sql = `SELECT COUNT(*) as count FROM ${type} WHERE card_id = ?`;
        const result = await this.getSingle(sql, [cardId]);
        
        if (result && result.count > 0) {
          tableName = type;
          break;
        }
      }
      
      if (!tableName) {
        console.warn(`No content found for material card ID: ${cardId}`);
        return [];
      }
    } else {
      throw new Error(`Unknown card type: ${cardType}`);
    }
    
    // Query the content from the identified table
    const sql = `
      SELECT * FROM ${tableName} 
      WHERE card_id = ? 
      ORDER BY order_id
    `;
    
    const content = await this.query(sql, [cardId]);
    const parsedContent = content.map(item => {
      const parsed = this.parseJsonFields(item);
      parsed.content_type = tableName; // Add content_type for frontend to differentiate
      return parsed;
    });
    
    return parsedContent;
  }

  /**
   * Export a complete question bank by ID
   * @param {string} questionbankId - Question bank ID
   * @returns {Promise<Object>} - Complete question bank data
   */
  async exportQuestionBank(questionbankId) {
    try {
      // Connect to database if not already connected
      if (!this.db) {
        await this.connect();
      }
      
      // Get question bank metadata
      const bankMetadata = await this.getQuestionBankMetadata(questionbankId);
      
      // Get pages
      const pages = await this.getPages(questionbankId);
      
      // Create result structure
      const result = {
        id: bankMetadata.questionbank_id,
        title: bankMetadata.title,
        description: bankMetadata.description || '',
        export_date: bankMetadata.export_date,
        status: bankMetadata.status,
        version: bankMetadata.version,
        author_id: bankMetadata.author_id,
        created_at: bankMetadata.created_at,
        updated_at: bankMetadata.updated_at,
        pages: []
      };
      
      // Process each page
      for (const page of pages) {
        const pageData = {
          id: page.id,
          page_index: page.page_index,
          exam_language: page.exam_language,
          exam_type: page.exam_type,
          component: page.component,
          category: page.category,
          cards: []
        };
        
        // Get cards for this page
        const cards = await this.getCards(page.id);
        
        // Process each card
        for (const card of cards) {
          const cardData = {
            id: card.id,
            position: card.position,
            card_type: card.card_type,
            content: []
          };
          
          // Get content for this card
          const content = await this.getCardContent(card.id, card.card_type);
          cardData.content = content;
          
          // Add card to page
          pageData.cards.push(cardData);
        }
        
        // Add page to result
        result.pages.push(pageData);
      }
      
      return result;
    } catch (error) {
      throw error;
    } finally {
      // Ensure the connection is closed
      await this.close();
    }
  }
}

module.exports = QuestionBankExporter;