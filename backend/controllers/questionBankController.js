const { getPool, getDb } = require('../db/dbService');
const { generateQuestionBankId, getCurrentTimestamp, serializeOptions, deserializeOptions } = require('../utils/helpers');
const logger = require('../utils/logger');

// Get all question banks
exports.getAllQuestionBanks = async (req, res, next) => {
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
      ORDER BY qb.updated_at DESC
    `;
    
    const result = await pool.query(query);
    const questionBanks = result.rows;
    
    res.status(200).json({
      success: true,
      data: questionBanks
    });
  } catch (error) {
    logger.error('Error fetching question banks:', error);
    next(error);
  }
};

// Get a single question bank by ID
exports.getQuestionBankById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    
    // First get the question bank
    const questionBankResult = await pool.query(
      'SELECT * FROM question_banks WHERE questionbank_id = $1',
      [id]
    );
    
    if (questionBankResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question bank not found'
      });
    }
    
    const questionBank = questionBankResult.rows[0];
    
    // Get all pages for this question bank
    const pagesResult = await pool.query(
      'SELECT id, page_index, exam_language, exam_type, component, category FROM question_bank_pages WHERE questionbank_id = $1 ORDER BY page_index',
      [id]
    );
    
    const pages = pagesResult.rows;
    
    // Prepare the response structure
    const result = {
      title: questionBank.title,
      description: questionBank.description,
      exportDate: questionBank.export_date,
      questionbank_id: questionBank.questionbank_id,
      pages: []
    };
    
    // For each page, get its cards and contents
    for (const page of pages) {
      const pageData = {
        page_index: page.page_index,
        exam_language: page.exam_language,
        exam_categories: {
          exam_type: page.exam_type,
          component: page.component,
          category: page.category
        },
        cards: []
      };
      
      // Get cards for this page
      const cardsResult = await pool.query(
        'SELECT id, card_type, position FROM cards WHERE page_id = $1 ORDER BY position',
        [page.id]
      );
      
      const cards = cardsResult.rows;
      
      // For each card, get its contents based on the card type
      for (const card of cards) {
        const cardData = {
          card_type: card.card_type,
          position: card.position,
          contents: []
        };
        
        // Get contents based on card type
        if (card.card_type === 'question') {
          // Get all question types for this card
          const singleChoiceResult = await pool.query(
            'SELECT * FROM single_choice_questions WHERE card_id = $1 ORDER BY order_id',
            [card.id]
          );
          
          const multipleChoiceResult = await pool.query(
            'SELECT * FROM multiple_choice_questions WHERE card_id = $1 ORDER BY order_id',
            [card.id]
          );
          
          const fillInBlankResult = await pool.query(
            'SELECT * FROM fill_in_blank_questions WHERE card_id = $1 ORDER BY order_id',
            [card.id]
          );
          
          const matchingResult = await pool.query(
            'SELECT * FROM matching_questions WHERE card_id = $1 ORDER BY order_id',
            [card.id]
          );
          
          const longTextResult = await pool.query(
            'SELECT * FROM long_text_questions WHERE card_id = $1 ORDER BY order_id',
            [card.id]
          );
          
          // Process single choice questions
          for (const q of singleChoiceResult.rows) {
            cardData.contents.push({
              id: q.content_id,
              type: 'single-choice',
              order_id: q.order_id,
              question: q.question,
              answer_id: q.answer_id,
              correctAnswer: q.correct_answer,
              instruction: q.instruction,
              difficulty: q.difficulty,
              marks: q.marks,
              options: q.options_data,
              question_image: q.media_data ? JSON.parse(q.media_data).question_image : null,
              question_audio: q.media_data ? JSON.parse(q.media_data).question_audio : null,
              question_video: q.media_data ? JSON.parse(q.media_data).question_video : null
            });
          }
          
          // Process multiple choice questions
          for (const q of multipleChoiceResult.rows) {
            cardData.contents.push({
              id: q.content_id,
              type: 'multiple-choice',
              order_id: q.order_id,
              question: q.question,
              answer_id: q.answer_id,
              instruction: q.instruction,
              difficulty: q.difficulty,
              marks: q.marks,
              options: q.options_data,
              correctAnswers: q.correct_answer,
              question_image: q.media_data ? JSON.parse(q.media_data).question_image : null,
              question_audio: q.media_data ? JSON.parse(q.media_data).question_audio : null,
              question_video: q.media_data ? JSON.parse(q.media_data).question_video : null
            });
          }
          
          // Process fill-in-the-blank questions
          for (const q of fillInBlankResult.rows) {
            cardData.contents.push({
              id: q.content_id,
              type: 'fill-in-the-blank',
              order_id: q.order_id,
              question: q.question,
              instruction: q.instruction,
              difficulty: q.difficulty,
              blanks: q.blanks_data,
              question_image: q.media_data ? JSON.parse(q.media_data).question_image : null,
              question_audio: q.media_data ? JSON.parse(q.media_data).question_audio : null,
              question_video: q.media_data ? JSON.parse(q.media_data).question_video : null
            });
          }
          
          // Process matching questions
          for (const q of matchingResult.rows) {
            cardData.contents.push({
              id: q.content_id,
              type: 'matching',
              order_id: q.order_id,
              question: q.question,
              instruction: q.instruction,
              difficulty: q.difficulty,
              blanks: q.options_data,
              options: q.options_data,
              question_image: q.media_data ? JSON.parse(q.media_data).question_image : null,
              question_audio: q.media_data ? JSON.parse(q.media_data).question_audio : null,
              question_video: q.media_data ? JSON.parse(q.media_data).question_video : null
            });
          }
          
          // Process long text questions
          for (const q of longTextResult.rows) {
            cardData.contents.push({
              id: q.content_id,
              type: 'long-text',
              order_id: q.order_id,
              question: q.question,
              instruction: q.instruction,
              difficulty: q.difficulty,
              placeholder: q.placeholder,
              rows: q.rows,
              suggestedAnswer: q.suggested_answer,
              marks: q.marks,
              question_image: q.media_data ? JSON.parse(q.media_data).question_image : null,
              question_audio: q.media_data ? JSON.parse(q.media_data).question_audio : null,
              question_video: q.media_data ? JSON.parse(q.media_data).question_video : null
            });
          }
          
        } else if (card.card_type === 'material') {
          // Get text materials
          const textMaterialsResult = await pool.query(
            'SELECT * FROM text_materials WHERE card_id = $1 ORDER BY order_id',
            [card.id]
          );
          
          // Get multimedia materials
          const multimediaMaterialsResult = await pool.query(
            'SELECT * FROM multimedia_materials WHERE card_id = $1 ORDER BY order_id',
            [card.id]
          );
          
          // Process text materials
          for (const m of textMaterialsResult.rows) {
            cardData.contents.push({
              id: m.content_id,
              type: 'text-material',
              order_id: m.order_id,
              title: m.title,
              content: m.content,
              showTitle: m.show_title === 1,
              titleStyle: m.title_style,
              isRichText: m.is_rich_text === 1
            });
          }
          
          // Process multimedia materials
          for (const m of multimediaMaterialsResult.rows) {
            cardData.contents.push({
              id: m.content_id,
              type: 'multimedia-material',
              order_id: m.order_id,
              title: m.title,
              showTitle: m.show_title === 1,
              titleStyle: m.title_style,
              mediaType: m.media_type,
              media: m.media_data,
              settings: m.settings_data
            });
          }
        }
        
        pageData.cards.push(cardData);
      }
      
      result.pages.push(pageData);
    }
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Error fetching question bank ${req.params.id}:`, error);
    next(error);
  }
};

// Create a new question bank
exports.createQuestionBank = async (req, res, next) => {
  try {
    const { title, description, pages } = req.body;
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      // Generate a new question bank ID
      const questionbank_id = generateQuestionBankId();
      const export_date = getCurrentTimestamp();
      
      // Start a transaction
      await client.query('BEGIN');
      
      // Insert the question bank
      await client.query(
        'INSERT INTO question_banks (questionbank_id, title, description, export_date, status) VALUES ($1, $2, $3, $4, $5)',
        [questionbank_id, title, description, export_date, 'draft']
      );
      
      // Process each page
      if (pages && Array.isArray(pages)) {
        for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
          const page = pages[pageIndex];
          const { exam_language, exam_categories, cards } = page;
          
          // Insert the page
          const pageResult = await client.query(
            'INSERT INTO question_bank_pages (questionbank_id, page_index, exam_language, exam_type, component, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [
              questionbank_id,
              pageIndex + 1,
              exam_language,
              exam_categories?.exam_type || null,
              exam_categories?.component || null,
              exam_categories?.category || null
            ]
          );
          
          const page_id = pageResult.rows[0].id;
          
          // Process each card
          if (cards && Array.isArray(cards)) {
            for (let cardIndex = 0; cardIndex < cards.length; cardIndex++) {
              const card = cards[cardIndex];
              const { card_type, contents } = card;
              
              // Insert the card
              const cardResult = await client.query(
                'INSERT INTO cards (page_id, card_type, position) VALUES ($1, $2, $3) RETURNING id',
                [page_id, card_type, cardIndex]
              );
              
              const card_id = cardResult.rows[0].id;
              
              // Process card contents based on type
              if (contents && Array.isArray(contents)) {
                for (let contentIndex = 0; contentIndex < contents.length; contentIndex++) {
                  const content = contents[contentIndex];
                  const { type } = content;
                  
                  // Process based on content type
                  switch (type) {
                    case 'single-choice':
                      await processSingleChoiceQuestion(client, content, card_id);
                      break;
                    case 'multiple-choice':
                      await processMultipleChoiceQuestion(client, content, card_id);
                      break;
                    case 'fill-in-the-blank':
                      await processFillInBlankQuestion(client, content, card_id);
                      break;
                    case 'matching':
                      await processMatchingQuestion(client, content, card_id);
                      break;
                    case 'long-text':
                      await processLongTextQuestion(client, content, card_id);
                      break;
                    case 'text-material':
                      await processTextMaterial(client, content, card_id);
                      break;
                    case 'multimedia-material':
                      await processMultimediaMaterial(client, content, card_id);
                      break;
                    default:
                      logger.warn(`Unknown content type: ${type}`);
                  }
                }
              }
            }
          }
        }
      }
      
      // Commit the transaction
      await client.query('COMMIT');
      
      res.status(201).json({
        success: true,
        message: 'Question bank created successfully',
        data: {
          questionbank_id
        }
      });
    } catch (error) {
      // Rollback if there's an error
      await client.query('ROLLBACK');
      logger.error('Error creating question bank:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error creating question bank:', error);
    next(error);
  }
};

// Update an existing question bank
exports.updateQuestionBank = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, pages } = req.body;
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      // Check if the question bank exists
      const existingBankResult = await client.query(
        'SELECT * FROM question_banks WHERE questionbank_id = $1',
        [id]
      );
      
      if (existingBankResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Question bank not found'
        });
      }
      
      // Start a transaction
      await client.query('BEGIN');
      
      // Update the question bank
      await client.query(
        'UPDATE question_banks SET title = $1, description = $2, updated_at = $3 WHERE questionbank_id = $4',
        [title, description, getCurrentTimestamp(), id]
      );
      
      // Get existing pages
      const existingPagesResult = await client.query(
        'SELECT id, page_index FROM question_bank_pages WHERE questionbank_id = $1',
        [id]
      );
      
      const existingPages = existingPagesResult.rows;
      
      // Process each page - we'll replace all content
      if (pages && Array.isArray(pages)) {
        // Delete existing pages and their cards
        for (const page of existingPages) {
          // Get card IDs for this page
          const cardIdsResult = await client.query(
            'SELECT id FROM cards WHERE page_id = $1',
            [page.id]
          );
          
          // Delete all content from these cards
          for (const card of cardIdsResult.rows) {
            await deleteCardContents(client, card.id);
          }
          
          // Delete the cards
          await client.query('DELETE FROM cards WHERE page_id = $1', [page.id]);
        }
        
        // Delete the pages
        await client.query('DELETE FROM question_bank_pages WHERE questionbank_id = $1', [id]);
        
        // Now insert the new pages
        for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
          const page = pages[pageIndex];
          const { exam_language, exam_categories, cards } = page;
          
          // Insert the page
          const pageResult = await client.query(
            'INSERT INTO question_bank_pages (questionbank_id, page_index, exam_language, exam_type, component, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [
              id,
              pageIndex + 1,
              exam_language,
              exam_categories?.exam_type || null,
              exam_categories?.component || null,
              exam_categories?.category || null
            ]
          );
          
          const page_id = pageResult.rows[0].id;
          
          // Process each card
          if (cards && Array.isArray(cards)) {
            for (let cardIndex = 0; cardIndex < cards.length; cardIndex++) {
              const card = cards[cardIndex];
              const { card_type, contents } = card;
              
              // Insert the card
              const cardResult = await client.query(
                'INSERT INTO cards (page_id, card_type, position) VALUES ($1, $2, $3) RETURNING id',
                [page_id, card_type, cardIndex]
              );
              
              const card_id = cardResult.rows[0].id;
              
              // Process card contents based on type
              if (contents && Array.isArray(contents)) {
                for (let contentIndex = 0; contentIndex < contents.length; contentIndex++) {
                  const content = contents[contentIndex];
                  const { type } = content;
                  
                  // Process based on content type (same as create)
                  switch (type) {
                    case 'single-choice':
                      await processSingleChoiceQuestion(client, content, card_id);
                      break;
                    case 'multiple-choice':
                      await processMultipleChoiceQuestion(client, content, card_id);
                      break;
                    case 'fill-in-the-blank':
                      await processFillInBlankQuestion(client, content, card_id);
                      break;
                    case 'matching':
                      await processMatchingQuestion(client, content, card_id);
                      break;
                    case 'long-text':
                      await processLongTextQuestion(client, content, card_id);
                      break;
                    case 'text-material':
                      await processTextMaterial(client, content, card_id);
                      break;
                    case 'multimedia-material':
                      await processMultimediaMaterial(client, content, card_id);
                      break;
                    default:
                      logger.warn(`Unknown content type: ${type}`);
                  }
                }
              }
            }
          }
        }
      }
      
      // Increment version
      await client.query(
        'UPDATE question_banks SET version = version + 1 WHERE questionbank_id = $1',
        [id]
      );
      
      // Commit the transaction
      await client.query('COMMIT');
      
      res.status(200).json({
        success: true,
        message: 'Question bank updated successfully',
        data: {
          questionbank_id: id
        }
      });
    } catch (error) {
      // Rollback if there's an error
      await client.query('ROLLBACK');
      logger.error(`Error updating question bank ${id}:`, error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error(`Error updating question bank ${req.params.id}:`, error);
    next(error);
  }
};

// Delete a question bank
exports.deleteQuestionBank = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      // Check if the question bank exists
      const existingBankResult = await client.query(
        'SELECT * FROM question_banks WHERE questionbank_id = $1',
        [id]
      );
      
      if (existingBankResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Question bank not found'
        });
      }
      
      // Start a transaction
      await client.query('BEGIN');
      
      // Get all pages
      const pagesResult = await client.query(
        'SELECT id FROM question_bank_pages WHERE questionbank_id = $1',
        [id]
      );
      
      // For each page, delete all cards and their contents
      for (const page of pagesResult.rows) {
        // Get card IDs for this page
        const cardIdsResult = await client.query(
          'SELECT id FROM cards WHERE page_id = $1',
          [page.id]
        );
        
        // Delete all content from these cards
        for (const card of cardIdsResult.rows) {
          await deleteCardContents(client, card.id);
        }
        
        // Delete the cards
        await client.query('DELETE FROM cards WHERE page_id = $1', [page.id]);
      }
      
      // Delete the pages
      await client.query('DELETE FROM question_bank_pages WHERE questionbank_id = $1', [id]);
      
      // Delete the question bank
      await client.query('DELETE FROM question_banks WHERE questionbank_id = $1', [id]);
      
      // Commit the transaction
      await client.query('COMMIT');
      
      res.status(200).json({
        success: true,
        message: 'Question bank deleted successfully'
      });
    } catch (error) {
      // Rollback if there's an error
      await client.query('ROLLBACK');
      logger.error(`Error deleting question bank ${id}:`, error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error(`Error deleting question bank ${req.params.id}:`, error);
    next(error);
  }
};

// Helper function to delete all content for a card
async function deleteCardContents(client, cardId) {
  await client.query('DELETE FROM single_choice_questions WHERE card_id = $1', [cardId]);
  await client.query('DELETE FROM multiple_choice_questions WHERE card_id = $1', [cardId]);
  await client.query('DELETE FROM fill_in_blank_questions WHERE card_id = $1', [cardId]);
  await client.query('DELETE FROM matching_questions WHERE card_id = $1', [cardId]);
  await client.query('DELETE FROM long_text_questions WHERE card_id = $1', [cardId]);
  await client.query('DELETE FROM audio_response_questions WHERE card_id = $1', [cardId]);
  await client.query('DELETE FROM text_materials WHERE card_id = $1', [cardId]);
  await client.query('DELETE FROM multimedia_materials WHERE card_id = $1', [cardId]);
  await client.query('DELETE FROM llm_session_materials WHERE card_id = $1', [cardId]);
  await client.query('DELETE FROM llm_audio_response_questions WHERE card_id = $1', [cardId]);
}

// Helper functions to process different content types
async function processSingleChoiceQuestion(client, content, cardId) {
  const { id, order_id, question, answer_id, correctAnswer, instruction, difficulty, marks, options } = content;
  const media_data = JSON.stringify({
    question_image: content.question_image || null,
    question_audio: content.question_audio || null,
    question_video: content.question_video || null
  });
  
  await client.query(
    `INSERT INTO single_choice_questions 
     (content_id, card_id, order_id, question, answer_id, correct_answer, instruction, difficulty, marks, options_data, media_data) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id || `single-choice-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      cardId,
      order_id || 0,
      question,
      answer_id,
      correctAnswer,
      instruction,
      difficulty,
      marks || 1,
      options,
      media_data
    ]
  );
}

async function processMultipleChoiceQuestion(client, content, cardId) {
  const { id, order_id, question, answer_id, instruction, difficulty, marks, options, correctAnswers } = content;
  const media_data = JSON.stringify({
    question_image: content.question_image || null,
    question_audio: content.question_audio || null,
    question_video: content.question_video || null
  });
  
  await client.query(
    `INSERT INTO multiple_choice_questions 
     (content_id, card_id, order_id, question, answer_id, instruction, difficulty, marks, options_data, correct_answer, media_data) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id || `multiple-choice-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      cardId,
      order_id || 0,
      question,
      answer_id,
      instruction,
      difficulty,
      marks || 1,
      options,
      correctAnswers,
      media_data
    ]
  );
}

async function processFillInBlankQuestion(client, content, cardId) {
  const { id, order_id, question, instruction, difficulty, blanks } = content;
  const media_data = JSON.stringify({
    question_image: content.question_image || null,
    question_audio: content.question_audio || null,
    question_video: content.question_video || null
  });
  
  await client.query(
    `INSERT INTO fill_in_blank_questions 
     (content_id, card_id, order_id, question, instruction, difficulty, blanks_data, media_data) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      id || `fill-in-the-blank-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      cardId,
      order_id || 0,
      question,
      instruction,
      difficulty,
      blanks,
      media_data
    ]
  );
}

async function processMatchingQuestion(client, content, cardId) {
  const { id, order_id, question, instruction, difficulty, options } = content;
  const media_data = JSON.stringify({
    question_image: content.question_image || null,
    question_audio: content.question_audio || null,
    question_video: content.question_video || null
  });
  
  await client.query(
    `INSERT INTO matching_questions 
     (content_id, card_id, order_id, question, instruction, difficulty, options_data, media_data) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      id || `matching-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      cardId,
      order_id || 0,
      question,
      instruction,
      difficulty,
      options,
      media_data
    ]
  );
}

async function processLongTextQuestion(client, content, cardId) {
  const { id, order_id, question, instruction, difficulty, placeholder, rows, suggestedAnswer, marks } = content;
  const media_data = JSON.stringify({
    question_image: content.question_image || null,
    question_audio: content.question_audio || null,
    question_video: content.question_video || null
  });
  
  await client.query(
    `INSERT INTO long_text_questions 
     (content_id, card_id, order_id, question, instruction, difficulty, placeholder, rows, suggested_answer, marks, media_data) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id || `long-text-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      cardId,
      order_id || 0,
      question,
      instruction,
      difficulty,
      placeholder,
      rows || 4,
      suggestedAnswer,
      marks || 1,
      media_data
    ]
  );
}

async function processTextMaterial(client, content, cardId) {
  const { id, order_id, title, content: textContent, showTitle, titleStyle, isRichText } = content;
  
  await client.query(
    `INSERT INTO text_materials 
     (content_id, card_id, order_id, title, content, show_title, title_style, is_rich_text) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      id || `text-material-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      cardId,
      order_id || 0,
      title,
      textContent,
      showTitle ? 1 : 0,
      titleStyle || 'h2',
      isRichText ? 1 : 0
    ]
  );
}

async function processMultimediaMaterial(client, content, cardId) {
  const { id, order_id, title, showTitle, titleStyle, mediaType, media, settings } = content;
  
  await client.query(
    `INSERT INTO multimedia_materials 
     (content_id, card_id, order_id, title, show_title, title_style, media_type, media_data, settings_data) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      id || `multimedia-material-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      cardId,
      order_id || 0,
      title,
      showTitle ? 1 : 0,
      titleStyle || 'h2',
      mediaType,
      media,
      settings
    ]
  );
}