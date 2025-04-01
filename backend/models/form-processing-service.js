


// models/form-processing-service.js
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const config = require('../config');


// Add this near the top of the file
const fs = require('fs');
const debug = process.env.DEBUG_FORM_SERVICE === 'true';
const debugDir = path.join(__dirname, '../logs/form-service');


class FormProcessingService {

// Add this as a method in the FormProcessingService class
async debugExport(data, operation, id) {
  if (!debug) return;
  
  try {
    // Create debug directory if it doesn't exist
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
    const filename = path.join(debugDir, `${operation}-${id || 'unknown'}-${timestamp}.json`);
    
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`[DEBUG] Exported ${operation} data to ${filename}`);
  } catch (error) {
    console.error('Error exporting debug data:', error);
  }
}


  constructor(dbPath = null) {
    // Use config's dbPath if not explicitly provided
    const dbFilePath = dbPath || path.resolve(config.dbPath);
    
    this.db = new sqlite3.Database(dbFilePath, (err) => {
      if (err) {
        console.error('Could not connect to database:', err);
      } else {
        console.log(`Processing service connected to database at ${dbFilePath}`);
        
        // Enable foreign keys for data integrity
        this.db.run('PRAGMA foreign_keys = ON');
        
        // Configure for optimal performance
        this.db.run('PRAGMA journal_mode = WAL');  // Write-Ahead Logging for better concurrency
        this.db.run('PRAGMA synchronous = NORMAL'); // Moderate durability/performance balance
        this.db.run('PRAGMA cache_size = 10000');  // Increase cache size for better performance
      }
    });
  }
  
  // Helper for running SQL queries as promises
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Error running SQL:', err);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }
  
  // Helper for getting a single row
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, result) => {
        if (err) {
          console.error('Error running SQL:', err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
  
  // Helper for getting multiple rows
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Error running SQL:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
  
  // Execute multiple SQL statements
  exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          console.error('Error executing SQL:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // New method: Prepare statement for repeated use
  prepareStatement(sql) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(sql, (err) => {
        if (err) {
          console.error('Error preparing statement:', err);
          reject(err);
        } else {
          resolve(stmt);
        }
      });
    });
  }

  // New method: Run batch operations
  async batchRun(sql, paramsList) {
    try {
      const stmt = await this.prepareStatement(sql);
      
      for (const params of paramsList) {
        await new Promise((resolve, reject) => {
          stmt.run(params, function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ id: this.lastID, changes: this.changes });
            }
          });
        });
      }
      
      await new Promise((resolve, reject) => {
        stmt.finalize(err => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      return true;
    } catch (error) {
      console.error('Error in batch operation:', error);
      throw error;
    }
  }

  async getFirstPageForBank(questionbankId) {
    try {
      return await this.get(
        `SELECT * FROM question_bank_pages 
         WHERE questionbank_id = ? 
         ORDER BY page_index ASC 
         LIMIT 1`,
        [questionbankId]
      );
    } catch (error) {
      console.error('Error getting first page for bank:', error);
      throw error;
    }
  }
  
  async getQuestionCountForBank(questionbankId) {
    try {
      // More accurate question count query using cards table
      const result = await this.get(
        `SELECT COUNT(*) as count FROM cards c
         JOIN question_bank_pages p ON c.page_id = p.id
         WHERE p.questionbank_id = ? AND c.card_type = 'question'`,
        [questionbankId]
      );
      
      return result ? result.count : 0;
    } catch (error) {
      console.error('Error counting questions for bank:', error);
      return 0;
    }
  }
  
// Process the form data according to the hybrid model
async processForm(formData) {
  const questionbankId = formData.questionbank_id || uuidv4();
  
  // Debug export original data if debug is enabled
  if (typeof this.debugExport === 'function') {
    await this.debugExport(formData, 'input-form', questionbankId);
  }
  
  // Start a transaction
  await this.run('BEGIN TRANSACTION');
  
  try {
    // Check if this form already exists
    const existingForm = await this.get(
      'SELECT questionbank_id FROM question_banks WHERE questionbank_id = ?',
      [questionbankId]
    );
    
    if (existingForm) {
      // This is an update to an existing form
      console.log(`Updating existing form with ID: ${questionbankId}`);
      
      // First, delete all associated data
      
      // 1. Delete all content items from all content tables for this form
      // We'll do this by finding all cards associated with this form's pages and deleting their content
      
      // Get all cards for pages in this form
      const cards = await this.all(
        `SELECT c.id, c.card_type 
         FROM cards c
         JOIN question_bank_pages p ON c.page_id = p.id
         WHERE p.questionbank_id = ?`,
        [questionbankId]
      );
      
      // Delete all content for each card
      for (const card of cards) {
        if (card.card_type === 'question') {
          await this.run('DELETE FROM single_choice_questions WHERE card_id = ?', [card.id]);
          await this.run('DELETE FROM multiple_choice_questions WHERE card_id = ?', [card.id]);
          await this.run('DELETE FROM fill_in_blank_questions WHERE card_id = ?', [card.id]);
          await this.run('DELETE FROM matching_questions WHERE card_id = ?', [card.id]);
          await this.run('DELETE FROM long_text_questions WHERE card_id = ?', [card.id]);
          await this.run('DELETE FROM audio_response_questions WHERE card_id = ?', [card.id]);
          await this.run('DELETE FROM llm_audio_response_questions WHERE card_id = ?', [card.id]);
        } else if (card.card_type === 'material') {
          await this.run('DELETE FROM text_materials WHERE card_id = ?', [card.id]);
          await this.run('DELETE FROM multimedia_materials WHERE card_id = ?', [card.id]);
          await this.run('DELETE FROM llm_session_materials WHERE card_id = ?', [card.id]);
        }
      }
      
      // 2. Delete all cards for this form
      await this.run(
        `DELETE FROM cards 
         WHERE page_id IN (
           SELECT id FROM question_bank_pages WHERE questionbank_id = ?
         )`,
        [questionbankId]
      );
      
      // 3. Delete all pages for this form
      await this.run(
        'DELETE FROM question_bank_pages WHERE questionbank_id = ?',
        [questionbankId]
      );
      
      // 4. Update the form metadata
      await this.run(
        `UPDATE question_banks SET 
         title = ?, 
         export_date = ?, 
         description = ?, 
         status = ?,
         updated_at = CURRENT_TIMESTAMP 
         WHERE questionbank_id = ?`,
        [
          formData.title || 'Untitled Question Bank',
          formData.exportDate || new Date().toISOString(),
          formData.description || '',
          formData.status || 'draft',
          questionbankId
        ]
      );
    } else {
      // This is a new form
      console.log(`Creating new form with ID: ${questionbankId}`);
      
      // Insert main question bank record
      await this.run(
        `INSERT INTO question_banks (questionbank_id, title, export_date, description, status) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          questionbankId,
          formData.title || 'Untitled Question Bank',
          formData.exportDate || new Date().toISOString(),
          formData.description || '',
          formData.status || 'draft'
        ]
      );
    }
    
    // Now insert all the new data
    
    // Process each page
    if (Array.isArray(formData.pages)) {
      // Validate page_index values
      const pageIndexes = new Set();
      
      // First, ensure all pages have valid and unique indexes
      formData.pages.forEach((page, idx) => {
        // If page_index isn't specified or is already used, assign a new one
        if (!page.page_index || pageIndexes.has(page.page_index)) {
          page.page_index = idx + 1;
        }
        
        pageIndexes.add(page.page_index);
      });
      
      // Now insert the pages
      for (const page of formData.pages) {
        // Insert page metadata
        const pageResult = await this.run(
          `INSERT INTO question_bank_pages 
           (questionbank_id, page_index, exam_language, exam_type, component, category) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            questionbankId,
            page.page_index,  // Now guaranteed to be unique
            page.exam_categories?.exam_language || page.exam_language || 'en',
            page.exam_categories?.exam_type || '',
            page.exam_categories?.component || '',
            page.exam_categories?.category || ''
          ]
        );
        
        const pageId = pageResult.id;
        
        // Process each card on the page
        if (Array.isArray(page.cards)) {
          for (const card of page.cards) {
            // Insert card
            const cardResult = await this.run(
              `INSERT INTO cards (page_id, card_type, position) VALUES (?, ?, ?)`,
              [pageId, card.card_type, card.position || 0]
            );
            
            const cardId = cardResult.id;
            
            // Process each content item in the card
            if (Array.isArray(card.contents)) {
              for (const content of card.contents) {
                await this.processContent(cardId, content, card.card_type);
              }
            }
          }
        }
      }
    }
    
    // Commit the transaction
    await this.run('COMMIT');
    
    // Debug export success result if debug is enabled
    if (typeof this.debugExport === 'function') {
      await this.debugExport(
        { success: true, questionbankId, isUpdate: !!existingForm }, 
        'result-form', 
        questionbankId
      );
    }
    
    return { success: true, questionbankId, isUpdate: !!existingForm };
    
  } catch (error) {
    // Rollback on error
    await this.run('ROLLBACK');
    console.error("Transaction failed:", error);
    
    // Debug export error if debug is enabled
    if (typeof this.debugExport === 'function') {
      await this.debugExport(
        { success: false, error: error.message, stack: error.stack }, 
        'error-form', 
        questionbankId
      );
    }
    
    throw error;
  }
}
  
  // Optimized process content method
  async processContent(cardId, content, cardType) {
    const contentType = content.type;
    
    try {
      switch (contentType) {
        case 'single-choice':
          return await this.processSingleChoiceQuestion(cardId, content);
        
        case 'multiple-choice':
          return await this.processMultipleChoiceQuestion(cardId, content);
        
        case 'fill-in-the-blank':
          return await this.processFillInBlankQuestion(cardId, content);
        
        case 'matching':
          return await this.processMatchingQuestion(cardId, content);
        
        case 'long-text':
          return await this.processLongTextQuestion(cardId, content);
        
        case 'audio':
          return await this.processAudioResponseQuestion(cardId, content);
        
        case 'text-material':
          return await this.processTextMaterial(cardId, content);
        
        case 'multimedia-material':
          return await this.processMultimediaMaterial(cardId, content);
        
        case 'llm-session-material':
          return await this.processLlmSessionMaterial(cardId, content);
        
        case 'llm-audio-response':
          return await this.processLlmAudioResponseQuestion(cardId, content);
        
        default:
          console.warn(`Unknown content type: ${contentType}`);
          return null;
      }
    } catch (error) {
      console.error(`Error processing content type ${contentType}:`, error);
      throw error;
    }
  }
  
  // Optimize all process methods by adding try/catch
  
  async processSingleChoiceQuestion(cardId, content) {
    try {
      // Store question media
      const mediaData = JSON.stringify({
        question_image: content.question_image,
        question_audio: content.question_audio,
        question_video: content.question_video
      });
      
      // Store options with their media
      const optionsData = JSON.stringify(content.options || []);
      
      return await this.run(
        `INSERT INTO single_choice_questions 
         (content_id, card_id, order_id, question, answer_id, correct_answer, 
          instruction, difficulty, marks, options_data, media_data) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          content.id || `single-choice-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          cardId,
          content.order_id || 0,
          content.question || '',
          content.answer_id,
          content.correctAnswer || '',
          content.instruction || '',
          content.difficulty || 'medium',
          content.marks || 1,
          optionsData,
          mediaData
        ]
      );
    } catch (error) {
      console.error('Error processing single choice question:', error);
      throw error;
    }
  }
  
  async processMultipleChoiceQuestion(cardId, content) {
    try {
      const mediaData = JSON.stringify({
        question_image: content.question_image,
        question_audio: content.question_audio,
        question_video: content.question_video
      });
      
      const optionsData = JSON.stringify(content.options || []);
      const correctAnswersData = JSON.stringify(content.correctAnswers || []);
      
      return await this.run(
        `INSERT INTO multiple_choice_questions 
         (content_id, card_id, order_id, question, answer_id, 
          instruction, difficulty, marks, options_data, correct_answers, media_data) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          content.id || `multiple-choice-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          cardId,
          content.order_id || 0,
          content.question || '',
          content.answer_id,
          content.instruction || '',
          content.difficulty || 'medium',
          content.marks || 1,
          optionsData,
          correctAnswersData,
          mediaData
        ]
      );
    } catch (error) {
      console.error('Error processing multiple choice question:', error);
      throw error;
    }
  }
  
  async processFillInBlankQuestion(cardId, content) {
    try {
      const mediaData = JSON.stringify({
        question_image: content.question_image,
        question_audio: content.question_audio,
        question_video: content.question_video
      });
      
      const blanksData = JSON.stringify(content.blanks || []);
      
      return await this.run(
        `INSERT INTO fill_in_blank_questions 
         (content_id, card_id, order_id, question, instruction, difficulty, blanks_data, media_data) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          content.id || `fill-in-blank-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          cardId,
          content.order_id || 0,
          content.question || '',
          content.instruction || '',
          content.difficulty || 'medium',
          blanksData,
          mediaData
        ]
      );
    } catch (error) {
      console.error('Error processing fill in blank question:', error);
      throw error;
    }
  }
  
  async processMatchingQuestion(cardId, content) {
    try {
      const mediaData = JSON.stringify({
        question_image: content.question_image,
        question_audio: content.question_audio,
        question_video: content.question_video
      });
      
      // Standardize: Use blanks but store as options_data
      const optionsData = JSON.stringify(content.blanks || content.options || []);
      
      return await this.run(
        `INSERT INTO matching_questions 
         (content_id, card_id, order_id, question, instruction, difficulty, options_data, media_data) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          content.id || `matching-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          cardId,
          content.order_id || 0,
          content.question || '',
          content.instruction || '',
          content.difficulty || 'medium',
          optionsData,
          mediaData
        ]
      );
    } catch (error) {
      console.error('Error processing matching question:', error);
      throw error;
    }
  }
  
  async processLongTextQuestion(cardId, content) {
    try {
      const mediaData = JSON.stringify({
        question_image: content.question_image,
        question_audio: content.question_audio,
        question_video: content.question_video
      });
      
      return await this.run(
        `INSERT INTO long_text_questions 
         (content_id, card_id, order_id, question, instruction, difficulty, 
          placeholder, rows, suggested_answer, marks, media_data) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          content.id || `long-text-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          cardId,
          content.order_id || 0,
          content.question || '',
          content.instruction || '',
          content.difficulty || 'medium',
          content.placeholder || '',
          content.rows || 4,
          content.suggestedAnswer || '',
          content.marks || 1,
          mediaData
        ]
      );
    } catch (error) {
      console.error('Error processing long text question:', error);
      throw error;
    }
  }
  
  async processAudioResponseQuestion(cardId, content) {
    try {
      const mediaData = JSON.stringify({
        question_image: content.question_image,
        question_audio: content.question_audio,
        question_video: content.question_video
      });
      
      return await this.run(
        `INSERT INTO audio_response_questions 
         (content_id, card_id, order_id, question, instruction, difficulty, 
          max_seconds, marks, allow_rerecording, allow_pause, show_timer, media_data) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          content.id || `audio-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          cardId,
          content.order_id || 0,
          content.question || '',
          content.instruction || '',
          content.difficulty || 'medium',
          content.maxSeconds || 60,
          content.marks || 1,
          content.allowRerecording ? 1 : 0,
          content.allowPause ? 1 : 0,
          content.showTimer ? 1 : 0,
          mediaData
        ]
      );
    } catch (error) {
      console.error('Error processing audio response question:', error);
      throw error;
    }
  }
  
  async processTextMaterial(cardId, content) {
    try {
      return await this.run(
        `INSERT INTO text_materials 
         (content_id, card_id, order_id, title, content, show_title, title_style, is_rich_text) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          content.id || `text-material-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          cardId,
          content.order_id || 0,
          content.title || '',
          content.content || '',
          content.showTitle ? 1 : 0,
          content.titleStyle || 'h2',
          content.isRichText ? 1 : 0
        ]
      );
    } catch (error) {
      console.error('Error processing text material:', error);
      throw error;
    }
  }
  
  async processMultimediaMaterial(cardId, content) {
    try {
      // Store the full media object
      const mediaData = JSON.stringify(content.media || {});
      
      // Store the full settings object
      const settingsData = JSON.stringify(content.settings || {});
      
      return await this.run(
        `INSERT INTO multimedia_materials 
         (content_id, card_id, order_id, title, show_title, title_style, media_type, media_data, settings_data) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          content.id || `multimedia-material-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          cardId,
          content.order_id || 0,
          content.title || '',
          content.showTitle ? 1 : 0,
          content.titleStyle || 'h2',
          content.mediaType || 'image',
          mediaData,
          settingsData
        ]
      );
    } catch (error) {
      console.error('Error processing multimedia material:', error);
      throw error;
    }
  }
  
  async processLlmSessionMaterial(cardId, content) {
    try {
      return await this.run(
        `INSERT INTO llm_session_materials 
         (content_id, card_id, order_id, title, show_title, title_style, session_settings) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          content.id || `llm-session-material-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          cardId,
          content.order_id || 0,
          content.title || '',
          content.showTitle ? 1 : 0,
          content.titleStyle || 'h2',
          JSON.stringify(content.sessionSettings || {})
        ]
      );
    } catch (error) {
      console.error('Error processing LLM session material:', error);
      throw error;
    }
  }
  
  async processLlmAudioResponseQuestion(cardId, content) {
    try {
      const mediaData = JSON.stringify({
        question_image: content.question_image,
        question_audio: content.question_audio,
        question_video: content.question_video
      });
      
      const questionSettings = JSON.stringify(content.questionSpecificSettings || {});
      
      return await this.run(
        `INSERT INTO llm_audio_response_questions 
         (content_id, card_id, order_id, question, instruction, difficulty, 
          max_seconds, marks, allow_rerecording, allow_pause, show_timer,
          number_of_questions, llm_session_type, linked_llm_session_id,
          question_specific_settings, media_data) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          content.id || `llm-audio-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          cardId,
          content.order_id || 0,
          content.question || '',
          content.instruction || '',
          content.difficulty || 'medium',
          content.maxSeconds || 60,
          content.marks || 1,
          content.allowRerecording ? 1 : 0,
          content.allowPause ? 1 : 0,
          content.showTimer ? 1 : 0,
          content.numberOfQuestions || 1,
          content.llmSessionType || '',
          content.linkedLlmSessionId || '',
          questionSettings,
          mediaData
        ]
      );
    } catch (error) {
      console.error('Error processing LLM audio response question:', error);
      throw error;
    }
  }
  
  // Optimized method to retrieve question bank by ID
  async getQuestionBankById(questionbankId) {
    try {
      // Get the main question bank record
      const questionBank = await this.get(
        'SELECT * FROM question_banks WHERE questionbank_id = ?',
        [questionbankId]
      );
      
      if (!questionBank) {
        return null;
      }
      
      // Get all pages for this question bank with all metadata
      const pages = await this.all(
        `SELECT id, page_index, exam_language, exam_type, component, category, 
         created_at, updated_at 
         FROM question_bank_pages 
         WHERE questionbank_id = ? 
         ORDER BY page_index`,
        [questionbankId]
      );
      
      // Process all pages in parallel for better performance
      const processedPages = await Promise.all(
        pages.map(async (page) => {
          // Get cards for this page
          const cards = await this.all(
            'SELECT id, card_type, position FROM cards WHERE page_id = ? ORDER BY position',
            [page.id]
          );
          
          // Process all cards in parallel
          const processedCards = await Promise.all(
            cards.map(async (card) => {
              const contents = await this.getCardContents(card.id, card.card_type);
              
              return {
                card_type: card.card_type,
                position: card.position,
                contents
              };
            })
          );
          
          return {
            page_index: page.page_index,
            exam_categories: {
              exam_language: page.exam_language,
              exam_type: page.exam_type,
              component: page.component,
              category: page.category
            },
            exam_language: page.exam_language,
            cards: processedCards
          };
        })
      );
      
      // Build the complete response with additional metadata
      return {
        title: questionBank.title,
        description: questionBank.description,
        exportDate: questionBank.export_date,
        questionbank_id: questionBank.questionbank_id,
        status: questionBank.status,
        created_at: questionBank.created_at,
        updated_at: questionBank.updated_at,
        version: questionBank.version,
        pages: processedPages
      };
    } catch (error) {
      console.error("Error getting question bank:", error);
      throw error;
    }
  }
  
  // Optimized method to get card contents
  async getCardContents(cardId, cardType) {
    try {
      let contentPromises = [];
      
      if (cardType === 'question') {
        // Process question content tables in parallel
        contentPromises = [
          this.getContentByType('single_choice_questions', this.reconstructSingleChoiceQuestion.bind(this), cardId),
          this.getContentByType('multiple_choice_questions', this.reconstructMultipleChoiceQuestion.bind(this), cardId),
          this.getContentByType('fill_in_blank_questions', this.reconstructFillInBlankQuestion.bind(this), cardId),
          this.getContentByType('matching_questions', this.reconstructMatchingQuestion.bind(this), cardId),
          this.getContentByType('long_text_questions', this.reconstructLongTextQuestion.bind(this), cardId),
          this.getContentByType('audio_response_questions', this.reconstructAudioQuestion.bind(this), cardId),
          this.getContentByType('llm_audio_response_questions', this.reconstructLlmAudioQuestion.bind(this), cardId)
        ];
      } else if (cardType === 'material') {
        // Process material content tables in parallel
        contentPromises = [
          this.getContentByType('text_materials', this.reconstructTextMaterial.bind(this), cardId),
          this.getContentByType('multimedia_materials', this.reconstructMultimediaMaterial.bind(this), cardId),
          this.getContentByType('llm_session_materials', this.reconstructLlmSessionMaterial.bind(this), cardId)
        ];
      }
      
      // Resolve all promises and flatten the results
      const contentArrays = await Promise.all(contentPromises);
      const contents = contentArrays.flat();
      
      // Sort by order_id
      contents.sort((a, b) => a.order_id - b.order_id);
      
      return contents;
    } catch (error) {
      console.error("Error getting card contents:", error);
      throw error;
    }
  }
  
  // Helper to get content by type
  async getContentByType(tableName, reconstructFn, cardId) {
    try {
      const records = await this.all(
        `SELECT * FROM ${tableName} WHERE card_id = ? ORDER BY order_id`,
        [cardId]
      );
      
      return records.map(record => reconstructFn(record));
    } catch (error) {
      console.error(`Error getting content from ${tableName}:`, error);
      return [];
    }
  }
  
  // Safe JSON parsing helper
  safeParseJson(jsonString, defaultValue = {}) {
    try {
      return jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return defaultValue;
    }
  }
  
  // Reconstruction functions with safe JSON parsing
  reconstructSingleChoiceQuestion(record) {
    const media = this.safeParseJson(record.media_data, {});
    const options = this.safeParseJson(record.options_data, []);
    
    return {
      id: record.content_id,
      type: 'single-choice',
      order_id: record.order_id,
      question: record.question,
      answer_id: record.answer_id,
      correctAnswer: record.correct_answer,
      instruction: record.instruction,
      difficulty: record.difficulty,
      marks: record.marks,
      options: options,
      question_image: media.question_image,
      question_audio: media.question_audio,
      question_video: media.question_video
    };
  }
  
  reconstructMultipleChoiceQuestion(record) {
    const media = this.safeParseJson(record.media_data, {});
    const options = this.safeParseJson(record.options_data, []);
    const correctAnswers = this.safeParseJson(record.correct_answers, []);
    
    return {
      id: record.content_id,
      type: 'multiple-choice',
      order_id: record.order_id,
      question: record.question,
      answer_id: record.answer_id,
      instruction: record.instruction,
      difficulty: record.difficulty,
      marks: record.marks,
      options: options,
      correctAnswers: correctAnswers,
      question_image: media.question_image,
      question_audio: media.question_audio,
      question_video: media.question_video
    };
  }
  
  reconstructFillInBlankQuestion(record) {
    const media = this.safeParseJson(record.media_data, {});
    const blanks = this.safeParseJson(record.blanks_data, []);
    
    return {
      id: record.content_id,
      type: 'fill-in-the-blank',
      order_id: record.order_id,
      question: record.question,
      instruction: record.instruction,
      difficulty: record.difficulty,
      blanks: blanks,
      question_image: media.question_image,
      question_audio: media.question_audio,
      question_video: media.question_video
    };
  }
  
  reconstructMatchingQuestion(record) {
    const media = this.safeParseJson(record.media_data, {});
    const options = this.safeParseJson(record.options_data, []);
    
    return {
      id: record.content_id,
      type: 'matching',
      order_id: record.order_id,
      question: record.question,
      instruction: record.instruction,
      difficulty: record.difficulty,
      // Return both blanks and options for compatibility
      blanks: options,
      options: options,
      question_image: media.question_image,
      question_audio: media.question_audio,
      question_video: media.question_video
    };
  }
  
  reconstructLongTextQuestion(record) {
    const media = this.safeParseJson(record.media_data, {});
    
    return {
      id: record.content_id,
      type: 'long-text',
      order_id: record.order_id,
      question: record.question,
      instruction: record.instruction,
      difficulty: record.difficulty,
      placeholder: record.placeholder,
      rows: record.rows,
      suggestedAnswer: record.suggested_answer,
      marks: record.marks,
      question_image: media.question_image,
      question_audio: media.question_audio,
      question_video: media.question_video
    };
  }
  
  reconstructAudioQuestion(record) {
    const media = this.safeParseJson(record.media_data, {});
    
    return {
      id: record.content_id,
      type: 'audio',
      order_id: record.order_id,
      question: record.question,
      instruction: record.instruction,
      difficulty: record.difficulty,
      maxSeconds: record.max_seconds,
      marks: record.marks,
      allowRerecording: record.allow_rerecording === 1,
      allowPause: record.allow_pause === 1,
      showTimer: record.show_timer === 1,
      question_image: media.question_image,
      question_audio: media.question_audio,
      question_video: media.question_video
    };
  }
  
  reconstructLlmAudioQuestion(record) {
    const media = this.safeParseJson(record.media_data, {});
    const questionSettings = this.safeParseJson(record.question_specific_settings, {});
    
    return {
      id: record.content_id,
      type: 'llm-audio-response',
      order_id: record.order_id,
      question: record.question,
      instruction: record.instruction,
      difficulty: record.difficulty,
      maxSeconds: record.max_seconds,
      marks: record.marks,
      allowRerecording: record.allow_rerecording === 1,
      allowPause: record.allow_pause === 1,
      showTimer: record.show_timer === 1,
      numberOfQuestions: record.number_of_questions,
      llmSessionType: record.llm_session_type,
      linkedLlmSessionId: record.linked_llm_session_id,
      questionSpecificSettings: questionSettings,
      question_image: media.question_image,
      question_audio: media.question_audio,
      question_video: media.question_video
    };
  }
  
  reconstructTextMaterial(record) {
    return {
      id: record.content_id,
      type: 'text-material',
      order_id: record.order_id,
      title: record.title,
      content: record.content,
      showTitle: record.show_title === 1,
      titleStyle: record.title_style,
      isRichText: record.is_rich_text === 1
    };
  }
  
  reconstructMultimediaMaterial(record) {
    const media = this.safeParseJson(record.media_data, {});
    const settings = this.safeParseJson(record.settings_data, {});
    
    return {
      id: record.content_id,
      type: 'multimedia-material',
      order_id: record.order_id,
      title: record.title,
      showTitle: record.show_title === 1,
      titleStyle: record.title_style,
      mediaType: record.media_type,
      media: media,
      settings: settings
    };
  }
  
  reconstructLlmSessionMaterial(record) {
    const sessionSettings = this.safeParseJson(record.session_settings, {});
    
    return {
      id: record.content_id,
      type: 'llm-session-material',
      order_id: record.order_id,
      title: record.title,
      showTitle: record.show_title === 1,
      titleStyle: record.title_style,
      sessionSettings: sessionSettings
    };
  }
  
  // Enhanced close method
  async close() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(); // Already closed or never opened
        return;
      }
      
      this.db.close(err => {
        if (err) {
          console.error('Error closing database:', err);
          reject(err);
        } else {
          console.log('Database connection closed');
          this.db = null; // Clear the reference
          resolve();
        }
      });
    });
  }
}

module.exports = FormProcessingService;