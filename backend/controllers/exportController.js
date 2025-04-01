// controllers/exportController.js
const { getDb } = require('../db/dbService');
const { generateQuestionBankId, getCurrentTimestamp } = require('../utils/helpers');
const logger = require('../utils/logger');
const FormProcessingService = require('../models/form-processing-service');

// Export a form to the backend
exports.exportForm = async (req, res, next) => {
  try {
    const formData = req.body;
    const formService = new FormProcessingService();
    
    try {
      // Process the form using your FormProcessingService
      const result = await formService.processForm(formData);
      
      // Check if this was an update or a new form
      const statusCode = result.isUpdate ? 200 : 201;
      
      res.status(statusCode).json({
        success: true,
        message: result.isUpdate ? 'Form updated successfully' : 'Form exported successfully',
        data: {
          questionbank_id: result.questionbankId,
          form: {
            id: result.questionbankId
          }
        }
      });
    } catch (error) {
      logger.error('Error processing form:', error);
      
      // Send a more detailed error response
      res.status(500).json({
        success: false,
        message: error.message || 'Error processing form',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } finally {
      await formService.close();
    }
  } catch (error) {
    logger.error('Error exporting form:', error);
    next(error);
  }
};

// List all exported forms
exports.listForms = async (req, res, next) => {
  try {
    const db = await getDb();
    
    // Join with pages to get exam info for each bank
    const query = `
      SELECT qb.*, 
             qbp.exam_language, qbp.exam_type, qbp.component, qbp.category,
             (SELECT COUNT(*) FROM cards c 
              JOIN question_bank_pages qbp2 ON c.page_id = qbp2.id
              WHERE qbp2.questionbank_id = qb.questionbank_id
              AND c.card_type = 'question') as question_count
      FROM question_banks qb
      LEFT JOIN question_bank_pages qbp ON qb.questionbank_id = qbp.questionbank_id AND qbp.page_index = 1
      ORDER BY qb.updated_at DESC
    `;
    
    const questionBanks = await db.all(query);
    
    res.status(200).json({
      success: true,
      data: questionBanks
    });
  } catch (error) {
    logger.error('Error listing forms:', error);
    next(error);
  }
};

// Get a form by ID
exports.getFormById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const format = req.query.format || 'default';
    
    // Use the FormProcessingService to get the form
    const formService = new FormProcessingService();
    
    try {
      const formData = await formService.getQuestionBankById(id);
      
      if (!formData) {
        return res.status(404).json({
          success: false,
          message: 'Form not found'
        });
      }
      
      // For editor format, include any additional processing needed
      if (format === 'editor') {
        // Add any editor-specific transformations here if needed
        // For example, you might want to add some editor metadata
        formData.editorMode = true;
      }
      
      res.status(200).json({
        success: true,
        data: formData
      });
    } catch (error) {
      logger.error(`Error retrieving form ${id}:`, error);
      next(error);
    } finally {
      await formService.close();
    }
  } catch (error) {
    logger.error(`Error fetching form ${req.params.id}:`, error);
    next(error);
  }
};

// Delete a form
exports.deleteForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    
    // Check if the form exists
    const form = await db.get(
      'SELECT * FROM question_banks WHERE questionbank_id = ?',
      [id]
    );
    
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }
    
    // Start a transaction
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Get all pages for this form
      const pages = await db.all(
        'SELECT id FROM question_bank_pages WHERE questionbank_id = ?',
        [id]
      );
      
      // For each page, delete its cards and contents
      for (const page of pages) {
        // Get cards for this page
        const cards = await db.all(
          'SELECT id FROM cards WHERE page_id = ?',
          [page.id]
        );
        
        // For each card, delete its contents
        for (const card of cards) {
          // Delete from all content tables
          await db.run('DELETE FROM single_choice_questions WHERE card_id = ?', [card.id]);
          await db.run('DELETE FROM multiple_choice_questions WHERE card_id = ?', [card.id]);
          await db.run('DELETE FROM fill_in_blank_questions WHERE card_id = ?', [card.id]);
          await db.run('DELETE FROM matching_questions WHERE card_id = ?', [card.id]);
          await db.run('DELETE FROM long_text_questions WHERE card_id = ?', [card.id]);
          await db.run('DELETE FROM audio_response_questions WHERE card_id = ?', [card.id]);
          await db.run('DELETE FROM text_materials WHERE card_id = ?', [card.id]);
          await db.run('DELETE FROM multimedia_materials WHERE card_id = ?', [card.id]);
          await db.run('DELETE FROM llm_session_materials WHERE card_id = ?', [card.id]);
          await db.run('DELETE FROM llm_audio_response_questions WHERE card_id = ?', [card.id]);
        }
        
        // Delete cards
        await db.run('DELETE FROM cards WHERE page_id = ?', [page.id]);
      }
      
      // Delete pages
      await db.run('DELETE FROM question_bank_pages WHERE questionbank_id = ?', [id]);
      
      // Delete the form
      await db.run('DELETE FROM question_banks WHERE questionbank_id = ?', [id]);
      
      // Commit the transaction
      await db.run('COMMIT');
      
      res.status(200).json({
        success: true,
        message: 'Form deleted successfully'
      });
    } catch (error) {
      // Rollback on error
      await db.run('ROLLBACK');
      logger.error(`Error in delete transaction for form ${id}:`, error);
      next(error);
    }
  } catch (error) {
    logger.error(`Error deleting form ${req.params.id}:`, error);
    next(error);
  }
};

// Download a form (returns JSON file)
exports.downloadForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Use the FormProcessingService to get the form
    const formService = new FormProcessingService();
    
    try {
      const formData = await formService.getQuestionBankById(id);
      
      if (!formData) {
        return res.status(404).json({
          success: false,
          message: 'Form not found'
        });
      }
      
      // Set headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="form-export-${id}.json"`);
      res.setHeader('Content-Type', 'application/json');
      
      // Send the form data as JSON
      res.send(JSON.stringify(formData, null, 2));
    } catch (error) {
      logger.error(`Error downloading form ${id}:`, error);
      next(error);
    } finally {
      await formService.close();
    }
  } catch (error) {
    logger.error(`Error in download form handler for ${req.params.id}:`, error);
    next(error);
  }
};