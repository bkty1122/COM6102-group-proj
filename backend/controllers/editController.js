// controllers/editController.js
const { getDb } = require('../db/dbService');
const logger = require('../utils/logger');
const FormProcessingService = require('../models/form-processing-service');
const { v4: uuidv4 } = require('uuid');

/**
 * Get a form for editing
 * Returns the full form data needed for the editor
 */
exports.getFormForEdit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const formService = new FormProcessingService();
    
    try {
      const formData = await formService.getQuestionBankById(id, true); // true for editor mode
      
      if (!formData) {
        return res.status(404).json({
          success: false,
          message: 'Form not found'
        });
      }
      
      // Add editor-specific metadata
      formData.editorMode = true;
      formData.lastEdited = new Date().toISOString();
      
      res.status(200).json({
        success: true,
        data: formData
      });
    } catch (error) {
      logger.error(`Error retrieving form ${id} for editing:`, error);
      next(error);
    } finally {
      await formService.close();
    }
  } catch (error) {
    logger.error(`Error in edit form handler for ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Update form metadata (title, description, etc)
 * Does not modify page or content structure
 */
exports.updateFormMetadata = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;
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
    
    // Update metadata
    await db.run(
      `UPDATE question_banks SET 
       title = ?, 
       description = ?, 
       status = ?,
       updated_at = CURRENT_TIMESTAMP 
       WHERE questionbank_id = ?`,
      [
        title || form.title,
        description !== undefined ? description : form.description,
        status || form.status,
        id
      ]
    );
    
    res.status(200).json({
      success: true,
      message: 'Form metadata updated successfully',
      data: {
        questionbank_id: id,
        title,
        description,
        status
      }
    });
  } catch (error) {
    logger.error(`Error updating form metadata for ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Update page metadata (exam_language, exam_type, etc)
 */
exports.updatePageMetadata = async (req, res, next) => {
  try {
    const { id, pageIndex } = req.params;
    const { exam_language, exam_type, component, category } = req.body;
    const db = await getDb();
    
    // Check if the page exists
    const page = await db.get(
      'SELECT * FROM question_bank_pages WHERE questionbank_id = ? AND page_index = ?',
      [id, pageIndex]
    );
    
    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }
    
    // Update page metadata
    await db.run(
      `UPDATE question_bank_pages SET 
       exam_language = ?, 
       exam_type = ?, 
       component = ?,
       category = ?,
       updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        exam_language || page.exam_language,
        exam_type || page.exam_type,
        component || page.component,
        category || page.category,
        page.id
      ]
    );
    
    res.status(200).json({
      success: true,
      message: 'Page metadata updated successfully',
      data: {
        questionbank_id: id,
        page_index: parseInt(pageIndex),
        exam_language,
        exam_type,
        component,
        category
      }
    });
  } catch (error) {
    logger.error(`Error updating page metadata for form ${req.params.id}, page ${req.params.pageIndex}:`, error);
    next(error);
  }
};

/**
 * Add a new page to an existing form
 */
exports.addPage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { exam_language, exam_type, component, category } = req.body;
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
    
    // Find the highest page_index
    const maxPageResult = await db.get(
      'SELECT MAX(page_index) as max_index FROM question_bank_pages WHERE questionbank_id = ?',
      [id]
    );
    
    const newPageIndex = (maxPageResult.max_index || 0) + 1;
    
    // Insert new page
    const pageResult = await db.run(
      `INSERT INTO question_bank_pages 
       (questionbank_id, page_index, exam_language, exam_type, component, category) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        newPageIndex,
        exam_language || 'en',
        exam_type || '',
        component || '',
        category || ''
      ]
    );
    
    // Update form's updated_at timestamp
    await db.run(
      'UPDATE question_banks SET updated_at = CURRENT_TIMESTAMP WHERE questionbank_id = ?',
      [id]
    );
    
    res.status(201).json({
      success: true,
      message: 'Page added successfully',
      data: {
        questionbank_id: id,
        page_id: pageResult.lastID,
        page_index: newPageIndex,
        exam_language: exam_language || 'en',
        exam_type: exam_type || '',
        component: component || '',
        category: category || ''
      }
    });
  } catch (error) {
    logger.error(`Error adding page to form ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Delete a page from an existing form
 */
exports.deletePage = async (req, res, next) => {
  try {
    const { id, pageIndex } = req.params;
    const db = await getDb();
    
    // Start a transaction
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Check if the page exists
      const page = await db.get(
        'SELECT * FROM question_bank_pages WHERE questionbank_id = ? AND page_index = ?',
        [id, pageIndex]
      );
      
      if (!page) {
        await db.run('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Page not found'
        });
      }
      
      // Check if this is the only page (should not allow deletion of the only page)
      const pageCount = await db.get(
        'SELECT COUNT(*) as count FROM question_bank_pages WHERE questionbank_id = ?',
        [id]
      );
      
      if (pageCount.count <= 1) {
        await db.run('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the only page of the form'
        });
      }
      
      // Get all cards for this page
      const cards = await db.all(
        'SELECT id, card_type FROM cards WHERE page_id = ?',
        [page.id]
      );
      
      // Delete content items for each card
      for (const card of cards) {
        if (card.card_type === 'question') {
          await db.run('DELETE FROM single_choice_questions WHERE card_id = ?', [card.id]);
          await db.run('DELETE FROM multiple_choice_questions WHERE card_id = ?', [card.id]);
          await db.run('DELETE FROM fill_in_blank_questions WHERE card_id = ?', [card.id]);
          await db.run('DELETE FROM matching_questions WHERE card_id = ?', [card.id]);
          await db.run('DELETE FROM long_text_questions WHERE card_id = ?', [card.id]);
          await db.run('DELETE FROM audio_response_questions WHERE card_id = ?', [card.id]);
          await db.run('DELETE FROM llm_audio_response_questions WHERE card_id = ?', [card.id]);
        } else if (card.card_type === 'material') {
          await db.run('DELETE FROM text_materials WHERE card_id = ?', [card.id]);
          await db.run('DELETE FROM multimedia_materials WHERE card_id = ?', [card.id]);
          await db.run('DELETE FROM llm_session_materials WHERE card_id = ?', [card.id]);
        }
      }
      
      // Delete all cards for this page
      await db.run('DELETE FROM cards WHERE page_id = ?', [page.id]);
      
      // Delete the page itself
      await db.run('DELETE FROM question_bank_pages WHERE id = ?', [page.id]);
      
      // Reindex the remaining pages
      const remainingPages = await db.all(
        'SELECT id, page_index FROM question_bank_pages WHERE questionbank_id = ? ORDER BY page_index',
        [id]
      );
      
      for (let i = 0; i < remainingPages.length; i++) {
        await db.run(
          'UPDATE question_bank_pages SET page_index = ? WHERE id = ?',
          [i + 1, remainingPages[i].id]
        );
      }
      
      // Update form's updated_at timestamp
      await db.run(
        'UPDATE question_banks SET updated_at = CURRENT_TIMESTAMP WHERE questionbank_id = ?',
        [id]
      );
      
      // Commit the transaction
      await db.run('COMMIT');
      
      res.status(200).json({
        success: true,
        message: 'Page deleted successfully',
        data: {
          questionbank_id: id,
          deleted_page_index: parseInt(pageIndex)
        }
      });
    } catch (error) {
      // Rollback on error
      await db.run('ROLLBACK');
      logger.error(`Error in delete page transaction for form ${id}, page ${pageIndex}:`, error);
      throw error;
    }
  } catch (error) {
    logger.error(`Error deleting page from form ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Add a new card to an existing page
 */
exports.addCard = async (req, res, next) => {
  try {
    const { id, pageIndex } = req.params;
    const { card_type, position } = req.body;
    const db = await getDb();
    
    // Validate card type
    if (card_type !== 'material' && card_type !== 'question') {
      return res.status(400).json({
        success: false,
        message: 'Invalid card type. Must be "material" or "question"'
      });
    }
    
    // Get the page
    const page = await db.get(
      'SELECT * FROM question_bank_pages WHERE questionbank_id = ? AND page_index = ?',
      [id, pageIndex]
    );
    
    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }
    
    // Start a transaction
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Find the highest position for this page if not specified
      let newPosition = position;
      if (newPosition === undefined) {
        const maxPositionResult = await db.get(
          'SELECT MAX(position) as max_position FROM cards WHERE page_id = ?',
          [page.id]
        );
        newPosition = (maxPositionResult.max_position || -1) + 1;
      }
      
      // If the position already exists, shift all cards at and after this position
      const existingCard = await db.get(
        'SELECT * FROM cards WHERE page_id = ? AND position = ?',
        [page.id, newPosition]
      );
      
      if (existingCard) {
        await db.run(
          'UPDATE cards SET position = position + 1 WHERE page_id = ? AND position >= ?',
          [page.id, newPosition]
        );
      }
      
      // Insert the new card
      const cardResult = await db.run(
        'INSERT INTO cards (page_id, card_type, position) VALUES (?, ?, ?)',
        [page.id, card_type, newPosition]
      );
      
      // Update form's updated_at timestamp
      await db.run(
        'UPDATE question_banks SET updated_at = CURRENT_TIMESTAMP WHERE questionbank_id = ?',
        [id]
      );
      
      // Commit the transaction
      await db.run('COMMIT');
      
      res.status(201).json({
        success: true,
        message: 'Card added successfully',
        data: {
          questionbank_id: id,
          page_index: parseInt(pageIndex),
          card_id: cardResult.lastID,
          card_type,
          position: newPosition
        }
      });
    } catch (error) {
      // Rollback on error
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    logger.error(`Error adding card to form ${req.params.id}, page ${req.params.pageIndex}:`, error);
    next(error);
  }
};

/**
 * Delete a card from a page
 */
exports.deleteCard = async (req, res, next) => {
  try {
    const { id, pageIndex, cardPosition } = req.params;
    const db = await getDb();
    
    // Start a transaction
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Get the page
      const page = await db.get(
        'SELECT * FROM question_bank_pages WHERE questionbank_id = ? AND page_index = ?',
        [id, pageIndex]
      );
      
      if (!page) {
        await db.run('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Page not found'
        });
      }
      
      // Get the card
      const card = await db.get(
        'SELECT * FROM cards WHERE page_id = ? AND position = ?',
        [page.id, cardPosition]
      );
      
      if (!card) {
        await db.run('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Card not found'
        });
      }
      
      // Delete content items based on card type
      if (card.card_type === 'question') {
        await db.run('DELETE FROM single_choice_questions WHERE card_id = ?', [card.id]);
        await db.run('DELETE FROM multiple_choice_questions WHERE card_id = ?', [card.id]);
        await db.run('DELETE FROM fill_in_blank_questions WHERE card_id = ?', [card.id]);
        await db.run('DELETE FROM matching_questions WHERE card_id = ?', [card.id]);
        await db.run('DELETE FROM long_text_questions WHERE card_id = ?', [card.id]);
        await db.run('DELETE FROM audio_response_questions WHERE card_id = ?', [card.id]);
        await db.run('DELETE FROM llm_audio_response_questions WHERE card_id = ?', [card.id]);
      } else if (card.card_type === 'material') {
        await db.run('DELETE FROM text_materials WHERE card_id = ?', [card.id]);
        await db.run('DELETE FROM multimedia_materials WHERE card_id = ?', [card.id]);
        await db.run('DELETE FROM llm_session_materials WHERE card_id = ?', [card.id]);
      }
      
      // Delete the card
      await db.run('DELETE FROM cards WHERE id = ?', [card.id]);
      
      // Reindex the remaining cards
      await db.run(
        'UPDATE cards SET position = position - 1 WHERE page_id = ? AND position > ?',
        [page.id, cardPosition]
      );
      
      // Update form's updated_at timestamp
      await db.run(
        'UPDATE question_banks SET updated_at = CURRENT_TIMESTAMP WHERE questionbank_id = ?',
        [id]
      );
      
      // Commit the transaction
      await db.run('COMMIT');
      
      res.status(200).json({
        success: true,
        message: 'Card deleted successfully',
        data: {
          questionbank_id: id,
          page_index: parseInt(pageIndex),
          deleted_card_position: parseInt(cardPosition)
        }
      });
    } catch (error) {
      // Rollback on error
      await db.run('ROLLBACK');
      logger.error(`Error in delete card transaction for form ${id}, page ${pageIndex}, card ${cardPosition}:`, error);
      throw error;
    }
  } catch (error) {
    logger.error(`Error deleting card from form ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Add content to a card
 */
exports.addCardContent = async (req, res, next) => {
  try {
    const { id, pageIndex, cardPosition } = req.params;
    const contentData = req.body;
    
    // Validate content data
    if (!contentData || !contentData.type) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content data. "type" is required.'
      });
    }
    
    const formService = new FormProcessingService();
    
    try {
      // Start a transaction
      await formService.run('BEGIN TRANSACTION');
      
      // Get the page
      const page = await formService.get(
        'SELECT * FROM question_bank_pages WHERE questionbank_id = ? AND page_index = ?',
        [id, pageIndex]
      );
      
      if (!page) {
        await formService.run('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Page not found'
        });
      }
      
      // Get the card
      const card = await formService.get(
        'SELECT * FROM cards WHERE page_id = ? AND position = ?',
        [page.id, cardPosition]
      );
      
      if (!card) {
        await formService.run('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Card not found'
        });
      }
      
      // Ensure content type matches card type
      const questionTypes = ['single-choice', 'multiple-choice', 'fill-in-the-blank', 
                            'matching', 'long-text', 'audio', 'llm-audio-response'];
      const materialTypes = ['text-material', 'multimedia-material', 'llm-session-material'];
      
      const isQuestionContent = questionTypes.includes(contentData.type);
      const isMaterialContent = materialTypes.includes(contentData.type);
      
      if ((card.card_type === 'question' && !isQuestionContent) || 
          (card.card_type === 'material' && !isMaterialContent)) {
        await formService.run('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Content type "${contentData.type}" does not match card type "${card.card_type}"`
        });
      }
      
      // Find the highest order_id for this card
      const maxOrderResult = await formService.get(
        `SELECT MAX(order_id) as max_order FROM 
         (SELECT order_id FROM single_choice_questions WHERE card_id = ? UNION ALL
          SELECT order_id FROM multiple_choice_questions WHERE card_id = ? UNION ALL
          SELECT order_id FROM fill_in_blank_questions WHERE card_id = ? UNION ALL
          SELECT order_id FROM matching_questions WHERE card_id = ? UNION ALL
          SELECT order_id FROM long_text_questions WHERE card_id = ? UNION ALL
          SELECT order_id FROM audio_response_questions WHERE card_id = ? UNION ALL
          SELECT order_id FROM text_materials WHERE card_id = ? UNION ALL
          SELECT order_id FROM multimedia_materials WHERE card_id = ? UNION ALL
          SELECT order_id FROM llm_session_materials WHERE card_id = ? UNION ALL
          SELECT order_id FROM llm_audio_response_questions WHERE card_id = ?)`,
        [card.id, card.id, card.id, card.id, card.id, card.id, card.id, card.id, card.id, card.id]
      );
      
      const newOrderId = (maxOrderResult?.max_order || -1) + 1;
      
      // Ensure content has a unique ID
      if (!contentData.id) {
        contentData.id = `${contentData.type}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      }
      
      // Set the order ID
      contentData.order_id = newOrderId;
      
      // Process the content using the FormProcessingService
      await formService.processContent(card.id, contentData, card.card_type);
      
      // Update form's updated_at timestamp
      await formService.run(
        'UPDATE question_banks SET updated_at = CURRENT_TIMESTAMP WHERE questionbank_id = ?',
        [id]
      );
      
      // Commit the transaction
      await formService.run('COMMIT');
      
      res.status(201).json({
        success: true,
        message: 'Content added successfully',
        data: {
          questionbank_id: id,
          page_index: parseInt(pageIndex),
          card_position: parseInt(cardPosition),
          content_id: contentData.id,
          content_type: contentData.type,
          order_id: newOrderId
        }
      });
    } catch (error) {
      // Rollback on error
      await formService.run('ROLLBACK');
      logger.error(`Error adding content to card for form ${id}:`, error);
      next(error);
    } finally {
      await formService.close();
    }
  } catch (error) {
    logger.error(`Error in add card content handler for form ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Update card content
 */
exports.updateCardContent = async (req, res, next) => {
  try {
    const { id, contentId } = req.params;
    const contentData = req.body;
    
    // Validate content data
    if (!contentData || !contentData.type) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content data. "type" is required.'
      });
    }
    
    const formService = new FormProcessingService();
    
    try {
      // Start a transaction
      await formService.run('BEGIN TRANSACTION');
      
      // First, find the content and its associated card
      let card;
      const contentType = contentData.type;
      
      // Different tables to look in based on content type
      switch (contentType) {
        case 'single-choice':
          card = await formService.get(
            `SELECT c.* FROM cards c
             JOIN single_choice_questions q ON c.id = q.card_id
             WHERE q.content_id = ?`,
            [contentId]
          );
          await formService.run('DELETE FROM single_choice_questions WHERE content_id = ?', [contentId]);
          break;
        case 'multiple-choice':
          card = await formService.get(
            `SELECT c.* FROM cards c
             JOIN multiple_choice_questions q ON c.id = q.card_id
             WHERE q.content_id = ?`,
            [contentId]
          );
          await formService.run('DELETE FROM multiple_choice_questions WHERE content_id = ?', [contentId]);
          break;
        case 'fill-in-the-blank':
          card = await formService.get(
            `SELECT c.* FROM cards c
             JOIN fill_in_blank_questions q ON c.id = q.card_id
             WHERE q.content_id = ?`,
            [contentId]
          );
          await formService.run('DELETE FROM fill_in_blank_questions WHERE content_id = ?', [contentId]);
          break;
        case 'matching':
          card = await formService.get(
            `SELECT c.* FROM cards c
             JOIN matching_questions q ON c.id = q.card_id
             WHERE q.content_id = ?`,
            [contentId]
          );
          await formService.run('DELETE FROM matching_questions WHERE content_id = ?', [contentId]);
          break;
        case 'long-text':
          card = await formService.get(
            `SELECT c.* FROM cards c
             JOIN long_text_questions q ON c.id = q.card_id
             WHERE q.content_id = ?`,
            [contentId]
          );
          await formService.run('DELETE FROM long_text_questions WHERE content_id = ?', [contentId]);
          break;
        case 'audio':
          card = await formService.get(
            `SELECT c.* FROM cards c
             JOIN audio_response_questions q ON c.id = q.card_id
             WHERE q.content_id = ?`,
            [contentId]
          );
          await formService.run('DELETE FROM audio_response_questions WHERE content_id = ?', [contentId]);
          break;
        case 'llm-audio-response':
          card = await formService.get(
            `SELECT c.* FROM cards c
             JOIN llm_audio_response_questions q ON c.id = q.card_id
             WHERE q.content_id = ?`,
            [contentId]
          );
          await formService.run('DELETE FROM llm_audio_response_questions WHERE content_id = ?', [contentId]);
          break;
        case 'text-material':
          card = await formService.get(
            `SELECT c.* FROM cards c
             JOIN text_materials m ON c.id = m.card_id
             WHERE m.content_id = ?`,
            [contentId]
          );
          await formService.run('DELETE FROM text_materials WHERE content_id = ?', [contentId]);
          break;
        case 'multimedia-material':
          card = await formService.get(
            `SELECT c.* FROM cards c
             JOIN multimedia_materials m ON c.id = m.card_id
             WHERE m.content_id = ?`,
            [contentId]
          );
          await formService.run('DELETE FROM multimedia_materials WHERE content_id = ?', [contentId]);
          break;
        case 'llm-session-material':
          card = await formService.get(
            `SELECT c.* FROM cards c
             JOIN llm_session_materials m ON c.id = m.card_id
             WHERE m.content_id = ?`,
            [contentId]
          );
          await formService.run('DELETE FROM llm_session_materials WHERE content_id = ?', [contentId]);
          break;
        default:
          await formService.run('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: `Unsupported content type: ${contentType}`
          });
      }
      
      if (!card) {
        await formService.run('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Content not found'
        });
      }
      
      // Check if the card belongs to the correct form
      const page = await formService.get(
        `SELECT * FROM question_bank_pages WHERE id = ? AND questionbank_id = ?`,
        [card.page_id, id]
      );
      
      if (!page) {
        await formService.run('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Content does not belong to this form'
        });
      }
      
      // Preserve the original content_id
      contentData.id = contentId;
      
      // Insert the updated content
      await formService.processContent(card.id, contentData, card.card_type);
      
      // Update form's updated_at timestamp
      await formService.run(
        'UPDATE question_banks SET updated_at = CURRENT_TIMESTAMP WHERE questionbank_id = ?',
        [id]
      );
      
      // Commit the transaction
      await formService.run('COMMIT');
      
      res.status(200).json({
        success: true,
        message: 'Content updated successfully',
        data: {
          questionbank_id: id,
          content_id: contentId,
          content_type: contentType
        }
      });
    } catch (error) {
      // Rollback on error
      await formService.run('ROLLBACK');
      logger.error(`Error updating content for form ${id}:`, error);
      next(error);
    } finally {
      await formService.close();
    }
  } catch (error) {
    logger.error(`Error in update card content handler for form ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Delete card content
 */
exports.deleteCardContent = async (req, res, next) => {
  try {
    const { id, contentId } = req.params;
    const contentType = req.query.type;
    
    if (!contentType) {
      return res.status(400).json({
        success: false,
        message: 'Content type is required as a query parameter'
      });
    }
    
    const formService = new FormProcessingService();
    
    try {
      // Start a transaction
      await formService.run('BEGIN TRANSACTION');
      
      // First, find the content and its associated card and page
      let contentInfo;
      
      // Different tables to look in based on content type
      switch (contentType) {
        case 'single-choice':
          contentInfo = await formService.get(
            `SELECT q.*, c.page_id, p.questionbank_id
             FROM single_choice_questions q
             JOIN cards c ON q.card_id = c.id
             JOIN question_bank_pages p ON c.page_id = p.id
             WHERE q.content_id = ?`,
            [contentId]
          );
          break;
        case 'multiple-choice':
          contentInfo = await formService.get(
            `SELECT q.*, c.page_id, p.questionbank_id
             FROM multiple_choice_questions q
             JOIN cards c ON q.card_id = c.id
             JOIN question_bank_pages p ON c.page_id = p.id
             WHERE q.content_id = ?`,
            [contentId]
          );
          break;
        case 'fill-in-the-blank':
          contentInfo = await formService.get(
            `SELECT q.*, c.page_id, p.questionbank_id
             FROM fill_in_blank_questions q
             JOIN cards c ON q.card_id = c.id
             JOIN question_bank_pages p ON c.page_id = p.id
             WHERE q.content_id = ?`,
            [contentId]
          );
          break;
        case 'matching':
          contentInfo = await formService.get(
            `SELECT q.*, c.page_id, p.questionbank_id
             FROM matching_questions q
             JOIN cards c ON q.card_id = c.id
             JOIN question_bank_pages p ON c.page_id = p.id
             WHERE q.content_id = ?`,
            [contentId]
          );
          break;
        case 'long-text':
          contentInfo = await formService.get(
            `SELECT q.*, c.page_id, p.questionbank_id
             FROM long_text_questions q
             JOIN cards c ON q.card_id = c.id
             JOIN question_bank_pages p ON c.page_id = p.id
             WHERE q.content_id = ?`,
            [contentId]
          );
          break;
        case 'audio':
          contentInfo = await formService.get(
            `SELECT q.*, c.page_id, p.questionbank_id
             FROM audio_response_questions q
             JOIN cards c ON q.card_id = c.id
             JOIN question_bank_pages p ON c.page_id = p.id
             WHERE q.content_id = ?`,
            [contentId]
          );
          break;
        case 'llm-audio-response':
          contentInfo = await formService.get(
            `SELECT q.*, c.page_id, p.questionbank_id
             FROM llm_audio_response_questions q
             JOIN cards c ON q.card_id = c.id
             JOIN question_bank_pages p ON c.page_id = p.id
             WHERE q.content_id = ?`,
            [contentId]
          );
          break;
        case 'text-material':
          contentInfo = await formService.get(
            `SELECT m.*, c.page_id, p.questionbank_id
             FROM text_materials m
             JOIN cards c ON m.card_id = c.id
             JOIN question_bank_pages p ON c.page_id = p.id
             WHERE m.content_id = ?`,
            [contentId]
          );
          break;
        case 'multimedia-material':
          contentInfo = await formService.get(
            `SELECT m.*, c.page_id, p.questionbank_id
             FROM multimedia_materials m
             JOIN cards c ON m.card_id = c.id
             JOIN question_bank_pages p ON c.page_id = p.id
             WHERE m.content_id = ?`,
            [contentId]
          );
          break;
        case 'llm-session-material':
          contentInfo = await formService.get(
            `SELECT m.*, c.page_id, p.questionbank_id
             FROM llm_session_materials m
             JOIN cards c ON m.card_id = c.id
             JOIN question_bank_pages p ON c.page_id = p.id
             WHERE m.content_id = ?`,
            [contentId]
          );
          break;
        default:
          await formService.run('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: `Unsupported content type: ${contentType}`
          });
      }
      
      if (!contentInfo) {
        await formService.run('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Content not found'
        });
      }
      
      // Verify that this content belongs to the specified form
      if (contentInfo.questionbank_id !== id) {
        await formService.run('ROLLBACK');
        return res.status(403).json({
          success: false,
          message: 'Content does not belong to this form'
        });
      }
      
      // Delete the content based on type
      switch (contentType) {
        case 'single-choice':
          await formService.run('DELETE FROM single_choice_questions WHERE content_id = ?', [contentId]);
          break;
        case 'multiple-choice':
          await formService.run('DELETE FROM multiple_choice_questions WHERE content_id = ?', [contentId]);
          break;
        case 'fill-in-the-blank':
          await formService.run('DELETE FROM fill_in_blank_questions WHERE content_id = ?', [contentId]);
          break;
        case 'matching':
          await formService.run('DELETE FROM matching_questions WHERE content_id = ?', [contentId]);
          break;
        case 'long-text':
          await formService.run('DELETE FROM long_text_questions WHERE content_id = ?', [contentId]);
          break;
        case 'audio':
          await formService.run('DELETE FROM audio_response_questions WHERE content_id = ?', [contentId]);
          break;
        case 'llm-audio-response':
          await formService.run('DELETE FROM llm_audio_response_questions WHERE content_id = ?', [contentId]);
          break;
        case 'text-material':
          await formService.run('DELETE FROM text_materials WHERE content_id = ?', [contentId]);
          break;
        case 'multimedia-material':
          await formService.run('DELETE FROM multimedia_materials WHERE content_id = ?', [contentId]);
          break;
        case 'llm-session-material':
          await formService.run('DELETE FROM llm_session_materials WHERE content_id = ?', [contentId]);
          break;
      }
      
      // Check if the card has any other content
      const contentCount = await formService.get(
        `SELECT COUNT(*) as count FROM 
         (SELECT content_id FROM single_choice_questions WHERE card_id = ? UNION ALL
          SELECT content_id FROM multiple_choice_questions WHERE card_id = ? UNION ALL
          SELECT content_id FROM fill_in_blank_questions WHERE card_id = ? UNION ALL
          SELECT content_id FROM matching_questions WHERE card_id = ? UNION ALL
          SELECT content_id FROM long_text_questions WHERE card_id = ? UNION ALL
          SELECT content_id FROM audio_response_questions WHERE card_id = ? UNION ALL
          SELECT content_id FROM text_materials WHERE card_id = ? UNION ALL
          SELECT content_id FROM multimedia_materials WHERE card_id = ? UNION ALL
          SELECT content_id FROM llm_session_materials WHERE card_id = ? UNION ALL
          SELECT content_id FROM llm_audio_response_questions WHERE card_id = ?)`,
        [
          contentInfo.card_id, contentInfo.card_id, contentInfo.card_id, contentInfo.card_id, 
          contentInfo.card_id, contentInfo.card_id, contentInfo.card_id, contentInfo.card_id,
          contentInfo.card_id, contentInfo.card_id
        ]
      );
      
      // If this was the last content in the card, delete the card too
      if (contentCount.count === 0) {
        // Get the card position for the response
        const card = await formService.get(
          'SELECT position FROM cards WHERE id = ?',
          [contentInfo.card_id]
        );
        
        await formService.run('DELETE FROM cards WHERE id = ?', [contentInfo.card_id]);
        
        // Reindex the remaining cards
        await formService.run(
          'UPDATE cards SET position = position - 1 WHERE page_id = ? AND position > ?',
          [contentInfo.page_id, card.position]
        );
      }
      
      // Update form's updated_at timestamp
      await formService.run(
        'UPDATE question_banks SET updated_at = CURRENT_TIMESTAMP WHERE questionbank_id = ?',
        [id]
      );
      
      // Commit the transaction
      await formService.run('COMMIT');
      
      res.status(200).json({
        success: true,
        message: 'Content deleted successfully',
        data: {
          questionbank_id: id,
          content_id: contentId,
          content_type: contentType,
          card_removed: contentCount.count === 0
        }
      });
    } catch (error) {
      // Rollback on error
      await formService.run('ROLLBACK');
      logger.error(`Error deleting content for form ${id}:`, error);
      next(error);
    } finally {
      await formService.close();
    }
  } catch (error) {
    logger.error(`Error in delete content handler for form ${req.params.id}:`, error);
    next(error);
  }
};