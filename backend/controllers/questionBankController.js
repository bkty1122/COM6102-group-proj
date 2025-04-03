// controllers/questionBankController.js
const { getDb } = require('../db/dbService');
const { generateQuestionBankId, getCurrentTimestamp, serializeOptions, deserializeOptions } = require('../utils/helpers');
const logger = require('../utils/logger');

// Get all question banks
exports.getAllQuestionBanks = async (req, res, next) => {
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
    logger.error('Error fetching question banks:', error);
    next(error);
  }
};

// Get a single question bank by ID
exports.getQuestionBankById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    
    // First get the question bank
    const questionBank = await db.get(
      'SELECT * FROM question_banks WHERE questionbank_id = ?',
      [id]
    );
    
    if (!questionBank) {
      return res.status(404).json({
        success: false,
        message: 'Question bank not found'
      });
    }
    
    // Get all pages for this question bank
    const pages = await db.all(
      'SELECT id, page_index, exam_language, exam_type, component, category FROM question_bank_pages WHERE questionbank_id = ? ORDER BY page_index',
      [id]
    );
    
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
      const cards = await db.all(
        'SELECT id, card_type, position FROM cards WHERE page_id = ? ORDER BY position',
        [page.id]
      );
      
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
          const singleChoiceQuestions = await db.all(
            'SELECT * FROM single_choice_questions WHERE card_id = ? ORDER BY order_id',
            [card.id]
          );
          
          const multipleChoiceQuestions = await db.all(
            'SELECT * FROM multiple_choice_questions WHERE card_id = ? ORDER BY order_id',
            [card.id]
          );
          
          const fillInBlankQuestions = await db.all(
            'SELECT * FROM fill_in_blank_questions WHERE card_id = ? ORDER BY order_id',
            [card.id]
          );
          
          const matchingQuestions = await db.all(
            'SELECT * FROM matching_questions WHERE card_id = ? ORDER BY order_id',
            [card.id]
          );
          
          const longTextQuestions = await db.all(
            'SELECT * FROM long_text_questions WHERE card_id = ? ORDER BY order_id',
            [card.id]
          );
          
          // Process single choice questions
          for (const q of singleChoiceQuestions) {
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
          for (const q of multipleChoiceQuestions) {
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
              correctAnswers: q.correct_answers,
              question_image: q.media_data ? JSON.parse(q.media_data).question_image : null,
              question_audio: q.media_data ? JSON.parse(q.media_data).question_audio : null,
              question_video: q.media_data ? JSON.parse(q.media_data).question_video : null
            });
          }
          
          // Process fill-in-the-blank questions
          for (const q of fillInBlankQuestions) {
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
          for (const q of matchingQuestions) {
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
          for (const q of longTextQuestions) {
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
          const textMaterials = await db.all(
            'SELECT * FROM text_materials WHERE card_id = ? ORDER BY order_id',
            [card.id]
          );
          
          // Get multimedia materials
          const multimediaMaterials = await db.all(
            'SELECT * FROM multimedia_materials WHERE card_id = ? ORDER BY order_id',
            [card.id]
          );
          
          // Process text materials
          for (const m of textMaterials) {
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
          for (const m of multimediaMaterials) {
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
    const db = await getDb();
    
    // Generate a new question bank ID
    const questionbank_id = generateQuestionBankId();
    const export_date = getCurrentTimestamp();
    
    // Start a transaction
    await db.run('BEGIN TRANSACTION');
    
    // Insert the question bank
    await db.run(
      'INSERT INTO question_banks (questionbank_id, title, description, export_date, status) VALUES (?, ?, ?, ?, ?)',
      [questionbank_id, title, description, export_date, 'draft']
    );
    
    // Process each page
    if (pages && Array.isArray(pages)) {
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const page = pages[pageIndex];
        const { exam_language, exam_categories, cards } = page;
        
        // Insert the page
        const pageResult = await db.run(
          'INSERT INTO question_bank_pages (questionbank_id, page_index, exam_language, exam_type, component, category) VALUES (?, ?, ?, ?, ?, ?)',
          [
            questionbank_id,
            pageIndex + 1,
            exam_language,
            exam_categories?.exam_type || null,
            exam_categories?.component || null,
            exam_categories?.category || null
          ]
        );
        
        const page_id = pageResult.lastID;
        
        // Process each card
        if (cards && Array.isArray(cards)) {
          for (let cardIndex = 0; cardIndex < cards.length; cardIndex++) {
            const card = cards[cardIndex];
            const { card_type, contents } = card;
            
            // Insert the card
            const cardResult = await db.run(
              'INSERT INTO cards (page_id, card_type, position) VALUES (?, ?, ?)',
              [page_id, card_type, cardIndex]
            );
            
            const card_id = cardResult.lastID;
            
            // Process card contents based on type
            if (contents && Array.isArray(contents)) {
              for (let contentIndex = 0; contentIndex < contents.length; contentIndex++) {
                const content = contents[contentIndex];
                const { type } = content;
                
                // Process based on content type
                switch (type) {
                  case 'single-choice':
                    await processSingleChoiceQuestion(db, content, card_id);
                    break;
                  case 'multiple-choice':
                    await processMultipleChoiceQuestion(db, content, card_id);
                    break;
                  case 'fill-in-the-blank':
                    await processFillInBlankQuestion(db, content, card_id);
                    break;
                  case 'matching':
                    await processMatchingQuestion(db, content, card_id);
                    break;
                  case 'long-text':
                    await processLongTextQuestion(db, content, card_id);
                    break;
                  case 'text-material':
                    await processTextMaterial(db, content, card_id);
                    break;
                  case 'multimedia-material':
                    await processMultimediaMaterial(db, content, card_id);
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
    await db.run('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Question bank created successfully',
      data: {
        questionbank_id
      }
    });
  } catch (error) {
    // Rollback if there's an error
    const db = await getDb();
    await db.run('ROLLBACK');
    
    logger.error('Error creating question bank:', error);
    next(error);
  }
};

// Update an existing question bank
exports.updateQuestionBank = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, pages } = req.body;
    const db = await getDb();
    
    // Check if the question bank exists
    const existingBank = await db.get(
      'SELECT * FROM question_banks WHERE questionbank_id = ?',
      [id]
    );
    
    if (!existingBank) {
      return res.status(404).json({
        success: false,
        message: 'Question bank not found'
      });
    }
    
    // Start a transaction
    await db.run('BEGIN TRANSACTION');
    
    // Update the question bank
    await db.run(
      'UPDATE question_banks SET title = ?, description = ?, updated_at = ? WHERE questionbank_id = ?',
      [title, description, getCurrentTimestamp(), id]
    );
    
    // Get existing pages
    const existingPages = await db.all(
      'SELECT id, page_index FROM question_bank_pages WHERE questionbank_id = ?',
      [id]
    );
    
    // Process each page - we'll replace all content
    if (pages && Array.isArray(pages)) {
      // Delete existing pages and their cards
      for (const page of existingPages) {
        // Get card IDs for this page
        const cardIds = await db.all(
          'SELECT id FROM cards WHERE page_id = ?',
          [page.id]
        );
        
        // Delete all content from these cards
        for (const card of cardIds) {
          await deleteCardContents(db, card.id);
        }
        
        // Delete the cards
        await db.run('DELETE FROM cards WHERE page_id = ?', [page.id]);
      }
      
      // Delete the pages
      await db.run('DELETE FROM question_bank_pages WHERE questionbank_id = ?', [id]);
      
      // Now insert the new pages
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const page = pages[pageIndex];
        const { exam_language, exam_categories, cards } = page;
        
        // Insert the page
        const pageResult = await db.run(
          'INSERT INTO question_bank_pages (questionbank_id, page_index, exam_language, exam_type, component, category) VALUES (?, ?, ?, ?, ?, ?)',
          [
            id,
            pageIndex + 1,
            exam_language,
            exam_categories?.exam_type || null,
            exam_categories?.component || null,
            exam_categories?.category || null
          ]
        );
        
        const page_id = pageResult.lastID;
        
        // Process each card
        if (cards && Array.isArray(cards)) {
          for (let cardIndex = 0; cardIndex < cards.length; cardIndex++) {
            const card = cards[cardIndex];
            const { card_type, contents } = card;
            
            // Insert the card
            const cardResult = await db.run(
              'INSERT INTO cards (page_id, card_type, position) VALUES (?, ?, ?)',
              [page_id, card_type, cardIndex]
            );
            
            const card_id = cardResult.lastID;
            
            // Process card contents based on type
            if (contents && Array.isArray(contents)) {
              for (let contentIndex = 0; contentIndex < contents.length; contentIndex++) {
                const content = contents[contentIndex];
                const { type } = content;
                
                // Process based on content type (same as create)
                switch (type) {
                  case 'single-choice':
                    await processSingleChoiceQuestion(db, content, card_id);
                    break;
                  case 'multiple-choice':
                    await processMultipleChoiceQuestion(db, content, card_id);
                    break;
                  case 'fill-in-the-blank':
                    await processFillInBlankQuestion(db, content, card_id);
                    break;
                  case 'matching':
                    await processMatchingQuestion(db, content, card_id);
                    break;
                  case 'long-text':
                    await processLongTextQuestion(db, content, card_id);
                    break;
                  case 'text-material':
                    await processTextMaterial(db, content, card_id);
                    break;
                  case 'multimedia-material':
                    await processMultimediaMaterial(db, content, card_id);
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
    await db.run(
      'UPDATE question_banks SET version = version + 1 WHERE questionbank_id = ?',
      [id]
    );
    
    // Commit the transaction
    await db.run('COMMIT');
    
    res.status(200).json({
      success: true,
      message: 'Question bank updated successfully',
      data: {
        questionbank_id: id
      }
    });
  } catch (error) {
    // Rollback if there's an error
    const db = await getDb();
    await db.run('ROLLBACK');
    
    logger.error(`Error updating question bank ${req.params.id}:`, error);
    next(error);
  }
};

// Delete a question bank
exports.deleteQuestionBank = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    
    // Check if the question bank exists
    const existingBank = await db.get(
      'SELECT * FROM question_banks WHERE questionbank_id = ?',
      [id]
    );
    
    if (!existingBank) {
      return res.status(404).json({
        success: false,
        message: 'Question bank not found'
      });
    }
    
    // Start a transaction
    await db.run('BEGIN TRANSACTION');
    
    // Get all pages
    const pages = await db.all(
      'SELECT id FROM question_bank_pages WHERE questionbank_id = ?',
      [id]
    );
    
    // For each page, delete all cards and their contents
    for (const page of pages) {
      // Get card IDs for this page
      const cardIds = await db.all(
        'SELECT id FROM cards WHERE page_id = ?',
        [page.id]
      );
      
      // Delete all content from these cards
      for (const card of cardIds) {
        await deleteCardContents(db, card.id);
      }
      
      // Delete the cards
      await db.run('DELETE FROM cards WHERE page_id = ?', [page.id]);
    }
    
    // Delete the pages
    await db.run('DELETE FROM question_bank_pages WHERE questionbank_id = ?', [id]);
    
    // Delete the question bank
    await db.run('DELETE FROM question_banks WHERE questionbank_id = ?', [id]);
    
    // Commit the transaction
    await db.run('COMMIT');
    
    res.status(200).json({
      success: true,
      message: 'Question bank deleted successfully'
    });
  } catch (error) {
    // Rollback if there's an error
    const db = await getDb();
    await db.run('ROLLBACK');
    
    logger.error(`Error deleting question bank ${req.params.id}:`, error);
    next(error);
  }
};

// Helper function to delete all content for a card
async function deleteCardContents(db, cardId) {
  await db.run('DELETE FROM single_choice_questions WHERE card_id = ?', [cardId]);
  await db.run('DELETE FROM multiple_choice_questions WHERE card_id = ?', [cardId]);
  await db.run('DELETE FROM fill_in_blank_questions WHERE card_id = ?', [cardId]);
  await db.run('DELETE FROM matching_questions WHERE card_id = ?', [cardId]);
  await db.run('DELETE FROM long_text_questions WHERE card_id = ?', [cardId]);
  await db.run('DELETE FROM audio_response_questions WHERE card_id = ?', [cardId]);
  await db.run('DELETE FROM text_materials WHERE card_id = ?', [cardId]);
  await db.run('DELETE FROM multimedia_materials WHERE card_id = ?', [cardId]);
  await db.run('DELETE FROM llm_session_materials WHERE card_id = ?', [cardId]);
  await db.run('DELETE FROM llm_audio_response_questions WHERE card_id = ?', [cardId]);
}

// Helper functions to process different content types
async function processSingleChoiceQuestion(db, content, cardId) {
  const { id, order_id, question, answer_id, correctAnswer, instruction, difficulty, marks, options } = content;
  const media_data = JSON.stringify({
    question_image: content.question_image || null,
    question_audio: content.question_audio || null,
    question_video: content.question_video || null
  });
  
  await db.run(
    `INSERT INTO single_choice_questions 
     (content_id, card_id, order_id, question, answer_id, correct_answer, instruction, difficulty, marks, options_data, media_data) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

async function processMultipleChoiceQuestion(db, content, cardId) {
  const { id, order_id, question, answer_id, instruction, difficulty, marks, options, correctAnswers } = content;
  const media_data = JSON.stringify({
    question_image: content.question_image || null,
    question_audio: content.question_audio || null,
    question_video: content.question_video || null
  });
  
  await db.run(
    `INSERT INTO multiple_choice_questions 
     (content_id, card_id, order_id, question, answer_id, instruction, difficulty, marks, options_data, correct_answers, media_data) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

async function processFillInBlankQuestion(db, content, cardId) {
  const { id, order_id, question, instruction, difficulty, blanks } = content;
  const media_data = JSON.stringify({
    question_image: content.question_image || null,
    question_audio: content.question_audio || null,
    question_video: content.question_video || null
  });
  
  await db.run(
    `INSERT INTO fill_in_blank_questions 
     (content_id, card_id, order_id, question, instruction, difficulty, blanks_data, media_data) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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

async function processMatchingQuestion(db, content, cardId) {
  const { id, order_id, question, instruction, difficulty, options } = content;
  const media_data = JSON.stringify({
    question_image: content.question_image || null,
    question_audio: content.question_audio || null,
    question_video: content.question_video || null
  });
  
  await db.run(
    `INSERT INTO matching_questions 
     (content_id, card_id, order_id, question, instruction, difficulty, options_data, media_data) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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

async function processLongTextQuestion(db, content, cardId) {
  const { id, order_id, question, instruction, difficulty, placeholder, rows, suggestedAnswer, marks } = content;
  const media_data = JSON.stringify({
    question_image: content.question_image || null,
    question_audio: content.question_audio || null,
    question_video: content.question_video || null
  });
  
  await db.run(
    `INSERT INTO long_text_questions 
     (content_id, card_id, order_id, question, instruction, difficulty, placeholder, rows, suggested_answer, marks, media_data) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

async function processTextMaterial(db, content, cardId) {
  const { id, order_id, title, content: textContent, showTitle, titleStyle, isRichText } = content;
  
  await db.run(
    `INSERT INTO text_materials 
     (content_id, card_id, order_id, title, content, show_title, title_style, is_rich_text) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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

async function processMultimediaMaterial(db, content, cardId) {
  const { id, order_id, title, showTitle, titleStyle, mediaType, media, settings } = content;
  
  await db.run(
    `INSERT INTO multimedia_materials 
     (content_id, card_id, order_id, title, show_title, title_style, media_type, media_data, settings_data) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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