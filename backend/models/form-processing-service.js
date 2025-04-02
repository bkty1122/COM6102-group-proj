// models/form-processing-service.js
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const config = require('../config');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Import our service components
const DatabaseService = require('../services/db-service');
const DebugService = require('../services/debug-service');
const ContentProcessor = require('../services/content-processor');
const ContentRetriever = require('../services/content-retriever');
const QuestionBankService = require('../services/question-bank-service');

class FormProcessingService {
  constructor(dbPath = null) {
    // Use config's dbPath if not explicitly provided
    const dbFilePath = dbPath || path.resolve(config.dbPath);
    
    // Initialize database service
    this.dbService = new DatabaseService(dbFilePath);
    
    // Connect to the database synchronously using the SQLite API directly
    this.db = new sqlite3.Database(dbFilePath, (err) => {
      if (err) {
        console.error('Could not connect to database:', err);
      } else {
        console.log(`Connected to database at ${dbFilePath}`);
        
        // Enable foreign keys for data integrity
        this.db.run('PRAGMA foreign_keys = ON');
        this.db.run('PRAGMA journal_mode = WAL');
        this.db.run('PRAGMA synchronous = NORMAL');
        this.db.run('PRAGMA cache_size = 10000');
      }
    });
    
    // Set up the db service with the connected db
    this.dbService.db = this.db;
    
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
    
    // Start a transaction
    await this.dbService.run('BEGIN TRANSACTION');
    
    try {
      // Check if this form already exists
      const existingForm = await this.dbService.get(
        'SELECT questionbank_id FROM question_banks WHERE questionbank_id = ?',
        [questionbankId]
      );
      
      // If the form exists, completely remove it first
      if (existingForm) {
        console.log(`Deleting existing form with ID: ${questionbankId} before recreation`);
        await this.deleteQuestionBank(questionbankId);
      }
      
      // Create the form from scratch
      await this.createQuestionBank(formData, questionbankId);
      
      // Commit the transaction
      await this.dbService.run('COMMIT');
      
      // Debug export success result if debug is enabled
      await this.debugService.debugExport(
        { success: true, questionbankId, isUpdate: !!existingForm }, 
        'result-form', 
        questionbankId
      );
      
      return { success: true, questionbankId, isUpdate: !!existingForm };
      
    } catch (error) {
      // Rollback on error
      await this.dbService.run('ROLLBACK');
      console.error("Transaction failed:", error);
      
      // Debug export error if debug is enabled
      await this.debugService.debugExport(
        { success: false, error: error.message, stack: error.stack }, 
        'error-form', 
        questionbankId
      );
      
      throw error;
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
   */
  async deleteQuestionBank(questionbankId) {
    console.log(`Deleting question bank ${questionbankId} and all related data`);
    
    try {
      // With CASCADE constraints, we can simply delete the question bank
      // and all related pages, cards, and content will be deleted automatically
      await this.dbService.run(
        'DELETE FROM question_banks WHERE questionbank_id = ?',
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
   */
  async createQuestionBank(formData, questionbankId) {
    console.log(`Creating question bank with ID: ${questionbankId}`);
    
    try {
      // 1. Create the main form record
      await this.dbService.run(
        `INSERT INTO question_banks 
         (questionbank_id, title, export_date, description, status) 
         VALUES (?, ?, ?, ?, ?)`,
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
          const pageResult = await this.dbService.run(
            `INSERT INTO question_bank_pages 
             (questionbank_id, page_index, exam_language, exam_type, component, category) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              questionbankId,
              finalPageIndex,
              page.exam_language || (page.exam_categories?.exam_language) || 'en',
              page.exam_type || (page.exam_categories?.exam_type) || '',
              page.component || (page.exam_categories?.component) || '',
              page.category || (page.exam_categories?.category) || ''
            ]
          );
          
          // Get the ID of the newly created page
          const newPage = await this.dbService.get(
            'SELECT id FROM question_bank_pages WHERE questionbank_id = ? AND page_index = ?',
            [questionbankId, finalPageIndex]
          );
          
          if (!newPage) {
            throw new Error(`Failed to retrieve ID for newly created page with index ${finalPageIndex}`);
          }
          
          const pageId = newPage.id;
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
              const cardResult = await this.dbService.run(
                'INSERT INTO cards (page_id, card_type, position) VALUES (?, ?, ?)',
                [pageId, card.card_type, card.position]
              );
              
              // Get the ID of the newly created card
              const newCard = await this.dbService.get(
                'SELECT id FROM cards WHERE page_id = ? AND position = ? ORDER BY id DESC LIMIT 1',
                [pageId, card.position]
              );
              
              if (!newCard) {
                throw new Error(`Failed to retrieve ID for newly created card at position ${card.position}`);
              }
              
              const cardId = newCard.id;
              
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
                    await this.contentProcessor.processContent(cardId, contentToProcess, card.card_type);
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
    return await this.dbService.close();
  }
}

module.exports = FormProcessingService;