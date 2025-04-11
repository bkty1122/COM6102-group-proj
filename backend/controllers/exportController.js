const { getPool } = require('../db/dbService');
const { generateQuestionBankId, getCurrentTimestamp } = require('../utils/helpers');
const logger = require('../utils/logger');
const FormProcessingService = require('../models/form-processing-service');

// Export a form to the backend
exports.exportForm = async (req, res, next) => {
  try {
    const formData = req.body;
    const formService = new FormProcessingService();
    
    try {
      // Process the form using FormProcessingService
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
    const pool = getPool();
    
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
      WHERE qb.is_deleted = 0
      ORDER BY qb.updated_at DESC
    `;
    
    const result = await pool.query(query);
    const questionBanks = result.rows;
    
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
        // Add editor-specific transformations
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
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      // Check if the form exists
      const formResult = await client.query(
        'SELECT * FROM question_banks WHERE questionbank_id = $1',
        [id]
      );
      
      if (formResult.rows.length === 0) {
        client.release();
        return res.status(404).json({
          success: false,
          message: 'Form not found'
        });
      }
      
      // Start a transaction
      await client.query('BEGIN');
      
      try {
        // Get all pages for this form
        const pagesResult = await client.query(
          'SELECT id FROM question_bank_pages WHERE questionbank_id = $1',
          [id]
        );
        
        // For each page, delete its cards and contents
        for (const page of pagesResult.rows) {
          // Get cards for this page
          const cardsResult = await client.query(
            'SELECT id FROM cards WHERE page_id = $1',
            [page.id]
          );
          
          // For each card, delete its contents
          for (const card of cardsResult.rows) {
            // Delete from all content tables
            await client.query('DELETE FROM single_choice_questions WHERE card_id = $1', [card.id]);
            await client.query('DELETE FROM multiple_choice_questions WHERE card_id = $1', [card.id]);
            await client.query('DELETE FROM fill_in_blank_questions WHERE card_id = $1', [card.id]);
            await client.query('DELETE FROM matching_questions WHERE card_id = $1', [card.id]);
            await client.query('DELETE FROM long_text_questions WHERE card_id = $1', [card.id]);
            await client.query('DELETE FROM audio_response_questions WHERE card_id = $1', [card.id]);
            await client.query('DELETE FROM text_materials WHERE card_id = $1', [card.id]);
            await client.query('DELETE FROM multimedia_materials WHERE card_id = $1', [card.id]);
            await client.query('DELETE FROM llm_session_materials WHERE card_id = $1', [card.id]);
            await client.query('DELETE FROM llm_audio_response_questions WHERE card_id = $1', [card.id]);
          }
          
          // Delete cards
          await client.query('DELETE FROM cards WHERE page_id = $1', [page.id]);
        }
        
        // Delete pages
        await client.query('DELETE FROM question_bank_pages WHERE questionbank_id = $1', [id]);
        
        // Delete the form
        await client.query('DELETE FROM question_banks WHERE questionbank_id = $1', [id]);
        
        // Commit the transaction
        await client.query('COMMIT');
        
        res.status(200).json({
          success: true,
          message: 'Form deleted successfully'
        });
      } catch (error) {
        // Rollback on error
        await client.query('ROLLBACK');
        logger.error(`Error in delete transaction for form ${id}:`, error);
        throw error;
      }
    } finally {
      // Release the client back to the pool
      client.release();
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