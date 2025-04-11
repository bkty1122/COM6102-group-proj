const { v4: uuidv4 } = require('uuid');
const path = require('path');
const config = require('../config');
const { Pool } = require('pg');
const fs = require('fs');

// Import our service components
const DatabaseService = require('../services/db-service');
const DebugService = require('../services/debug-service');
const ContentProcessor = require('../services/content-processor');
const ContentRetriever = require('../services/content-retriever');
const QuestionBankService = require('../services/question-bank-service');

class FormProcessingService {
  constructor(dbConfig = null) {
    // Use config's dbConfig if not explicitly provided
    const dbConfiguration = dbConfig || config.dbConfig;
    
    // Initialize database service
    this.dbService = new DatabaseService(dbConfiguration);
    
    // Connect to the database using PostgreSQL
    this.pool = new Pool(dbConfiguration);
    
    // Set up error handling for the pool
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
    
    console.log(`Connected to PostgreSQL database at ${dbConfiguration.host}/${dbConfiguration.database}`);
    
    // Set up the db service with the connected pool
    this.dbService.pool = this.pool;
    
    // Initialize debug service
    this.debugService = new DebugService(
      process.env.DEBUG_FORM_SERVICE === 'true',
      path.join(__dirname, '../logs/form-service')
    );
    
    // Initialize other services
    this.contentProcessor = new ContentProcessor(this.dbService);
    this.contentRetriever = new ContentRetriever(this.dbService);
    this.questionBankService = new QuestionBankService(this.dbService);
  }
  
  /**
   * Process and save a form using the delete and recreate approach
   * @param {Object} formData - The form data to process
   * @returns {Promise<Object>} - Result of form processing
   */
  async processForm(formData) {
    if (!formData) {
      throw new Error('Form data is required');
    }
    
    const questionbankId = formData.questionbank_id || uuidv4();
    
    // Log form structure for debugging
    this.logFormStructure(formData, questionbankId);
    
    // Validate formData structure
    this.validateFormData(formData);
    
    // Debug export original data if debug is enabled
    await this.debugService.debugExport(formData, 'input-form', questionbankId);
    
    // Get a client from the pool for transaction
    const client = await this.pool.connect();
    
    try {
      // Start a transaction
      await client.query('BEGIN');
      
      // Check if this form already exists
      const existingResult = await client.query(
        'SELECT questionbank_id FROM question_banks WHERE questionbank_id = $1',
        [questionbankId]
      );
      
      const existingForm = existingResult.rows.length > 0 ? existingResult.rows[0] : null;
      
      // If the form exists, completely remove it first
      if (existingForm) {
        console.log(`Deleting existing form with ID: ${questionbankId} before recreation`);
        await this.deleteQuestionBank(questionbankId, client);
      }
      
      // Create the form from scratch
      await this.createQuestionBank(formData, questionbankId, client);
      
      // Commit the transaction
      await client.query('COMMIT');
      
      // Debug export success result if debug is enabled
      await this.debugService.debugExport(
        { success: true, questionbankId, isUpdate: !!existingForm }, 
        'result-form', 
        questionbankId
      );
      
      return { success: true, questionbankId, isUpdate: !!existingForm };
      
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      console.error("Transaction failed:", error);
      
      // Debug export error if debug is enabled
      await this.debugService.debugExport(
        { success: false, error: error.message, stack: error.stack }, 
        'error-form', 
        questionbankId
      );
      
      throw error;
    } finally {
      // Release the client back to the pool
      client.release();
    }
  }
  
  /**
   * Log form structure for debugging
   * @param {Object} formData - The form data to log
   * @param {string} questionbankId - The ID of the question bank
   */
  logFormStructure(formData, questionbankId) {
    console.log('Processing form with structure:');
    console.log(`- Title: ${formData.title || 'Untitled'}`);
    console.log(`- QuestionbankId: ${questionbankId}`);
    console.log(`- Pages count: ${Array.isArray(formData.pages) ? formData.pages.length : 0}`);
    
    // Add detailed form structure logging
    console.log('Detailed form structure:');
    if (Array.isArray(formData.pages)) {
      formData.pages.forEach((page, pageIndex) => {
        console.log(`Page ${pageIndex}:`, {
          page_index: page.page_index !== undefined ? page.page_index : pageIndex,
          card_count: Array.isArray(page.cards) ? page.cards.length : 0
        });
        
        if (Array.isArray(page.cards)) {
          page.cards.forEach((card, cardIndex) => {
            let cardType = typeof card === 'string' ? card : (card.card_type || 'unknown');
            console.log(`  Card ${cardIndex} type: ${cardType}`);
          });
        }
      });
    }
  }
  
  /**
   * Validate form data structure
   * @param {Object} formData - The form data to validate
   * @throws {Error} - If form data is invalid
   */
  validateFormData(formData) {
    if (!Array.isArray(formData.pages)) {
      throw new Error('Form data must contain an array of pages');
    }
    
    // Validate pages
    formData.pages.forEach((page, index) => {
      if (!page) {
        throw new Error(`Page at index ${index} is null or undefined`);
      }
      
      // Validate cards if they exist
      if (page.cards !== undefined && !Array.isArray(page.cards)) {
        throw new Error(`Cards for page at index ${index} must be an array`);
      }
    });
  }
  
  /**
   * Delete a question bank and all related data
   * @param {string} questionbankId - Question bank ID
   * @param {Object} client - PostgreSQL client for transaction
   */
  async deleteQuestionBank(questionbankId, client) {
    console.log(`Deleting question bank ${questionbankId} and all related data`);
    
    try {
      // With CASCADE constraints, we can simply delete the question bank
      // and all related pages, cards, and content will be deleted automatically
      await client.query(
        'DELETE FROM question_banks WHERE questionbank_id = $1',
        [questionbankId]
      );
      
      console.log(`Successfully deleted question bank ${questionbankId}`);
    } catch (error) {
      console.error(`Error deleting question bank ${questionbankId}:`, error);
      throw new Error(`Failed to delete question bank ${questionbankId}: ${error.message}`);
    }
  }
  
  /**
   * Create a new question bank from scratch
   * @param {Object} formData - Form data
   * @param {string} questionbankId - Question bank ID
   * @param {Object} client - PostgreSQL client for transaction
   */
  async createQuestionBank(formData, questionbankId, client) {
    console.log(`Creating question bank with ID: ${questionbankId}`);
    
    try {
      // 1. Create the main form record
      await client.query(
        `INSERT INTO question_banks 
         (questionbank_id, title, export_date, description, status) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          questionbankId,
          formData.title || 'Untitled Question Bank',
          formData.exportDate || new Date().toISOString(),
          formData.description || '',
          formData.status || 'draft'
        ]
      );
      
      // 2. Create pages and cards
      if (Array.isArray(formData.pages)) {
        for (let pageIndex = 0; pageIndex < formData.pages.length; pageIndex++) {
          const page = formData.pages[pageIndex];
          
          // Use array index as page_index if not explicitly set
          const finalPageIndex = page.page_index !== undefined ? page.page_index : pageIndex;
          
          console.log(`Creating page with index ${finalPageIndex}`);
          
          // Insert the page
          const pageResult = await client.query(
            `INSERT INTO question_bank_pages 
             (questionbank_id, page_index, exam_language, exam_type, component, category) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [
              questionbankId,
              finalPageIndex,
              page.exam_language || (page.exam_categories?.exam_language) || 'en',
              page.exam_type || (page.exam_categories?.exam_type) || '',
              page.component || (page.exam_categories?.component) || '',
              page.category || (page.exam_categories?.category) || ''
            ]
          );
          
          const pageId = pageResult.rows[0].id;
          console.log(`Created page with ID ${pageId} and index ${finalPageIndex}`);
          
          // Process cards for this page
          if (Array.isArray(page.cards)) {
            for (let cardIndex = 0; cardIndex < page.cards.length; cardIndex++) {
              let card = page.cards[cardIndex];
              
              // Convert string cards to objects
              if (typeof card === 'string') {
                card = {
                  card_type: card,
                  position: cardIndex,
                  contents: []
                };
              } else if (typeof card === 'object' && card !== null) {
                // Ensure card has the required properties
                card.card_type = card.card_type || 'question';
                card.position = card.position !== undefined ? card.position : cardIndex;
                card.contents = Array.isArray(card.contents) ? card.contents : [];
              } else {
                console.warn(`Skipping invalid card at index ${cardIndex}`);
                continue;
              }
              
              console.log(`Creating card of type ${card.card_type} at position ${card.position}`);
              
              // Insert the card
              const cardResult = await client.query(
                'INSERT INTO cards (page_id, card_type, position) VALUES ($1, $2, $3) RETURNING id',
                [pageId, card.card_type, card.position]
              );
              
              const cardId = cardResult.rows[0].id;
              
              // Process card contents
              if (Array.isArray(card.contents)) {
                for (let contentIndex = 0; contentIndex < card.contents.length; contentIndex++) {
                  const content = card.contents[contentIndex];
                  
                  // Skip if content is null or undefined
                  if (!content) continue;
                  
                  // Handle case where content might be a string
                  const contentToProcess = typeof content === 'string' 
                    ? { type: 'text-material', content: content } 
                    : content;
                  
                  // Validate content before processing
                  if (!contentToProcess.type) {
                    console.warn(`Skipping invalid content item - missing type`);
                    continue;
                  }
                  
                  // Set order_id for the content
                  contentToProcess.order_id = contentIndex;
                  
                  try {
                    await this.contentProcessor.processContent(cardId, contentToProcess, card.card_type, client);
                  } catch (contentError) {
                    console.error(`Error processing content item:`, {
                      contentType: contentToProcess.type,
                      error: contentError.message
                    });
                    // Continue with other content items
                  }
                }
              }
            }
          }
        }
      }
      
      console.log(`Successfully created question bank ${questionbankId}`);
    } catch (error) {
      console.error(`Error creating question bank ${questionbankId}:`, error);
      throw new Error(`Failed to create question bank ${questionbankId}: ${error.message}`);
    }
  }
  
  /**
   * Get question bank by ID
   * @param {string} questionbankId - Question bank ID
   * @returns {Promise<Object>} - Question bank data
   */
  async getQuestionBankById(questionbankId) {
    console.log(`Requesting question bank with ID: ${questionbankId}`);
    return await this.questionBankService.getQuestionBankById(questionbankId, this.contentRetriever);
  }
  
  /**
   * Get first page for a bank
   * @param {string} questionbankId - Question bank ID
   * @returns {Promise<Object>} - First page data
   */
  async getFirstPageForBank(questionbankId) {
    return await this.questionBankService.getFirstPageForBank(questionbankId);
  }
  
  /**
   * Get question count for a bank
   * @param {string} questionbankId - Question bank ID
   * @returns {Promise<number>} - Question count
   */
  async getQuestionCountForBank(questionbankId) {
    return await this.questionBankService.getQuestionCountForBank(questionbankId);
  }
  
  /**
   * Close database connection
   * @returns {Promise<void>}
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('Database connection pool closed');
    }
  }
}

module.exports = FormProcessingService;