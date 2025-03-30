// models/form-processing-service.js
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

class FormProcessingService {
  constructor(dbPath = path.join(__dirname, '../form_storage.db')) {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Could not connect to database', err);
      } else {
        console.log('Processing service connected to database');
      }
    });
  }
  
  // Helper for running SQL queries as promises
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Error running sql: ' + sql);
          console.error(err);
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }
  
  // Helper for getting a single row
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, result) => {
        if (err) {
          console.error('Error running sql: ' + sql);
          console.error(err);
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
          console.error('Error running sql: ' + sql);
          console.error(err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
  
  // Process the form data according to the hybrid model
  async processForm(formData) {
    const questionbankId = uuidv4();
    
    // Start a transaction
    await this.run('BEGIN TRANSACTION');
    
    try {
      // 1. Insert main question bank record
      await this.run(
        `INSERT INTO question_banks (questionbank_id, title, export_date, description) 
         VALUES (?, ?, ?, ?)`,
        [
          questionbankId,
          formData.title || 'Untitled Question Bank',
          formData.exportDate || new Date().toISOString(),
          formData.description || ''
        ]
      );
      
      // 2. Process each page
      if (Array.isArray(formData.pages)) {
        for (const page of formData.pages) {
          // Insert page metadata
          const pageResult = await this.run(
            `INSERT INTO question_bank_pages 
             (questionbank_id, page_index, exam_language, exam_type, component, category) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              questionbankId,
              page.page_index || 0,
              page.exam_categories?.exam_language || page.exam_language || 'en',
              page.exam_categories?.exam_type || '',
              page.exam_categories?.component || '',
              page.exam_categories?.category || ''
            ]
          );
          
          const pageId = pageResult.id;
          
          // 3. Process each card on the page
          if (Array.isArray(page.cards)) {
            for (const card of page.cards) {
              // Insert card
              const cardResult = await this.run(
                `INSERT INTO cards (page_id, card_type, position) VALUES (?, ?, ?)`,
                [pageId, card.card_type, card.position || 0]
              );
              
              const cardId = cardResult.id;
              
              // 4. Process each content item in the card
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
      
      return { success: true, questionbankId };
      
    } catch (error) {
      // Rollback on error
      await this.run('ROLLBACK');
      console.error("Transaction failed:", error);
      throw error;
    }
  }
  
  // Process a single content item
  async processContent(cardId, content, cardType) {
    const contentType = content.type;
    
    switch (contentType) {
      case 'single-choice':
        return this.processSingleChoiceQuestion(cardId, content);
      
      case 'multiple-choice':
        return this.processMultipleChoiceQuestion(cardId, content);
      
      case 'fill-in-the-blank':
        return this.processFillInBlankQuestion(cardId, content);
      
      case 'matching':
        return this.processMatchingQuestion(cardId, content);
      
      case 'long-text':
        return this.processLongTextQuestion(cardId, content);
      
      case 'audio':
        return this.processAudioResponseQuestion(cardId, content);
      
      case 'text-material':
        return this.processTextMaterial(cardId, content);
      
      case 'multimedia-material':
        return this.processMultimediaMaterial(cardId, content);
      
      case 'llm-session-material':
        return this.processLlmSessionMaterial(cardId, content);
      
      case 'llm-audio-response':
        return this.processLlmAudioResponseQuestion(cardId, content);
      
      default:
        console.warn(`Unknown content type: ${contentType}`);
        return Promise.resolve();
    }
  }
  
  // Process each content type
  async processSingleChoiceQuestion(cardId, content) {
    // Store question media
    const mediaData = JSON.stringify({
      question_image: content.question_image,
      question_audio: content.question_audio,
      question_video: content.question_video
    });
    
    // Store options with their media
    const optionsData = JSON.stringify(content.options || []);
    
    return this.run(
      `INSERT INTO single_choice_questions 
       (content_id, card_id, order_id, question, answer_id, correct_answer, 
        instruction, difficulty, marks, options_data, media_data) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        content.id,
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
  }
  
  async processMultipleChoiceQuestion(cardId, content) {
    const mediaData = JSON.stringify({
      question_image: content.question_image,
      question_audio: content.question_audio,
      question_video: content.question_video
    });
    
    const optionsData = JSON.stringify(content.options || []);
    const correctAnswersData = JSON.stringify(content.correctAnswers || []);
    
    return this.run(
      `INSERT INTO multiple_choice_questions 
       (content_id, card_id, order_id, question, answer_id, 
        instruction, difficulty, marks, options_data, correct_answers, media_data) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        content.id,
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
  }
  
  async processFillInBlankQuestion(cardId, content) {
    const mediaData = JSON.stringify({
      question_image: content.question_image,
      question_audio: content.question_audio,
      question_video: content.question_video
    });
    
    const blanksData = JSON.stringify(content.blanks || []);
    
    return this.run(
      `INSERT INTO fill_in_blank_questions 
       (content_id, card_id, order_id, question, instruction, difficulty, blanks_data, media_data) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        content.id,
        cardId,
        content.order_id || 0,
        content.question || '',
        content.instruction || '',
        content.difficulty || 'medium',
        blanksData,
        mediaData
      ]
    );
  }
  
  async processMatchingQuestion(cardId, content) {
    const mediaData = JSON.stringify({
      question_image: content.question_image,
      question_audio: content.question_audio,
      question_video: content.question_video
    });
    
    // Standardize: Use blanks but store as options_data
    const optionsData = JSON.stringify(content.blanks || content.options || []);
    
    return this.run(
      `INSERT INTO matching_questions 
       (content_id, card_id, order_id, question, instruction, difficulty, options_data, media_data) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        content.id,
        cardId,
        content.order_id || 0,
        content.question || '',
        content.instruction || '',
        content.difficulty || 'medium',
        optionsData,
        mediaData
      ]
    );
  }
  
  // Add the missing methods
  async processLongTextQuestion(cardId, content) {
    const mediaData = JSON.stringify({
      question_image: content.question_image,
      question_audio: content.question_audio,
      question_video: content.question_video
    });
    
    return this.run(
      `INSERT INTO long_text_questions 
       (content_id, card_id, order_id, question, instruction, difficulty, 
        placeholder, rows, suggested_answer, marks, media_data) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        content.id,
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
  }
  
  async processAudioResponseQuestion(cardId, content) {
    const mediaData = JSON.stringify({
      question_image: content.question_image,
      question_audio: content.question_audio,
      question_video: content.question_video
    });
    
    return this.run(
      `INSERT INTO audio_response_questions 
       (content_id, card_id, order_id, question, instruction, difficulty, 
        max_seconds, marks, allow_rerecording, allow_pause, show_timer, media_data) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        content.id,
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
  }
  
  async processTextMaterial(cardId, content) {
    return this.run(
      `INSERT INTO text_materials 
       (content_id, card_id, order_id, title, content, show_title, title_style, is_rich_text) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        content.id,
        cardId,
        content.order_id || 0,
        content.title || '',
        content.content || '',
        content.showTitle ? 1 : 0,
        content.titleStyle || 'h2',
        content.isRichText ? 1 : 0
      ]
    );
  }
  
  async processMultimediaMaterial(cardId, content) {
    // Store the full media object
    const mediaData = JSON.stringify(content.media || {});
    
    // Store the full settings object
    const settingsData = JSON.stringify(content.settings || {});
    
    return this.run(
      `INSERT INTO multimedia_materials 
       (content_id, card_id, order_id, title, show_title, title_style, media_type, media_data, settings_data) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        content.id,
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
  }
  
  async processLlmSessionMaterial(cardId, content) {
    return this.run(
      `INSERT INTO llm_session_materials 
       (content_id, card_id, order_id, title, show_title, title_style, session_settings) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        content.id,
        cardId,
        content.order_id || 0,
        content.title || '',
        content.showTitle ? 1 : 0,
        content.titleStyle || 'h2',
        JSON.stringify(content.sessionSettings || {})
      ]
    );
  }
  
  async processLlmAudioResponseQuestion(cardId, content) {
    const mediaData = JSON.stringify({
      question_image: content.question_image,
      question_audio: content.question_audio,
      question_video: content.question_video
    });
    
    const questionSettings = JSON.stringify(content.questionSpecificSettings || {});
    
    return this.run(
      `INSERT INTO llm_audio_response_questions 
       (content_id, card_id, order_id, question, instruction, difficulty, 
        max_seconds, marks, allow_rerecording, allow_pause, show_timer,
        number_of_questions, llm_session_type, linked_llm_session_id,
        question_specific_settings, media_data) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        content.id,
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
  }
  
  // Retrieve a full question bank by ID
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
      
      // Get all pages for this question bank
      const pages = await this.all(
        'SELECT * FROM question_bank_pages WHERE questionbank_id = ? ORDER BY page_index',
        [questionbankId]
      );
      
      // For each page, get its cards and contents
      for (let i = 0; i < pages.length; i++) {
        const cards = await this.all(
          'SELECT * FROM cards WHERE page_id = ? ORDER BY position',
          [pages[i].id]
        );
        
        // For each card, get its contents
        for (let j = 0; j < cards.length; j++) {
          const contents = await this.getCardContents(cards[j].id, cards[j].card_type);
          cards[j].contents = contents;
        }
        
        // Add cards to page
        pages[i].cards = cards;
        
        // Reconstruct exam_categories
        pages[i].exam_categories = {
          exam_language: pages[i].exam_language,
          exam_type: pages[i].exam_type,
          component: pages[i].component,
          category: pages[i].category
        };
      }
      
      // Build the complete response
      return {
        title: questionBank.title,
        exportDate: questionBank.export_date,
        pages: pages.map(page => ({
          page_index: page.page_index,
          exam_categories: page.exam_categories,
          exam_language: page.exam_language,
          cards: page.cards.map(card => ({
            card_type: card.card_type,
            position: card.position,
            contents: card.contents
          }))
        }))
      };
      
    } catch (error) {
      console.error("Error getting question bank:", error);
      throw error;
    }
  }
  
  // Get contents for a card from the appropriate tables
  async getCardContents(cardId, cardType) {
    try {
      let contents = [];
      
      if (cardType === 'question') {
        // Get question contents from all question tables
        
        // Single choice questions
        const singleChoiceQuestions = await this.all(
          'SELECT * FROM single_choice_questions WHERE card_id = ? ORDER BY order_id',
          [cardId]
        );
        
        for (const q of singleChoiceQuestions) {
          const content = this.reconstructSingleChoiceQuestion(q);
          contents.push(content);
        }
        
        // Multiple choice questions
        const multipleChoiceQuestions = await this.all(
          'SELECT * FROM multiple_choice_questions WHERE card_id = ? ORDER BY order_id',
          [cardId]
        );
        
        for (const q of multipleChoiceQuestions) {
          const content = this.reconstructMultipleChoiceQuestion(q);
          contents.push(content);
        }
        
        // Fill in blank questions
        const fillInBlankQuestions = await this.all(
          'SELECT * FROM fill_in_blank_questions WHERE card_id = ? ORDER BY order_id',
          [cardId]
        );
        
        for (const q of fillInBlankQuestions) {
          const content = this.reconstructFillInBlankQuestion(q);
          contents.push(content);
        }
        
        // Matching questions
        const matchingQuestions = await this.all(
          'SELECT * FROM matching_questions WHERE card_id = ? ORDER BY order_id',
          [cardId]
        );
        
        for (const q of matchingQuestions) {
          const content = this.reconstructMatchingQuestion(q);
          contents.push(content);
        }
        
        // Long text questions
        const longTextQuestions = await this.all(
          'SELECT * FROM long_text_questions WHERE card_id = ? ORDER BY order_id',
          [cardId]
        );
        
        for (const q of longTextQuestions) {
          const content = this.reconstructLongTextQuestion(q);
          contents.push(content);
        }
        
        // Audio response questions
        const audioQuestions = await this.all(
          'SELECT * FROM audio_response_questions WHERE card_id = ? ORDER BY order_id',
          [cardId]
        );
        
        for (const q of audioQuestions) {
          const content = this.reconstructAudioQuestion(q);
          contents.push(content);
        }
        
        // LLM audio response questions
        const llmAudioQuestions = await this.all(
          'SELECT * FROM llm_audio_response_questions WHERE card_id = ? ORDER BY order_id',
          [cardId]
        );
        
        for (const q of llmAudioQuestions) {
          const content = this.reconstructLlmAudioQuestion(q);
          contents.push(content);
        }
        
      } else if (cardType === 'material') {
        // Get material contents
        
        // Text materials
        const textMaterials = await this.all(
          'SELECT * FROM text_materials WHERE card_id = ? ORDER BY order_id',
          [cardId]
        );
        
        for (const m of textMaterials) {
          const content = this.reconstructTextMaterial(m);
          contents.push(content);
        }
        
        // Multimedia materials
        const multimediaMaterials = await this.all(
          'SELECT * FROM multimedia_materials WHERE card_id = ? ORDER BY order_id',
          [cardId]
        );
        
        for (const m of multimediaMaterials) {
          const content = this.reconstructMultimediaMaterial(m);
          contents.push(content);
        }
        
        // LLM session materials
        const llmSessionMaterials = await this.all(
          'SELECT * FROM llm_session_materials WHERE card_id = ? ORDER BY order_id',
          [cardId]
        );
        
        for (const m of llmSessionMaterials) {
          const content = this.reconstructLlmSessionMaterial(m);
          contents.push(content);
        }
      }
      
      // Sort by order_id
      contents.sort((a, b) => a.order_id - b.order_id);
      
      return contents;
      
    } catch (error) {
      console.error("Error getting card contents:", error);
      throw error;
    }
  }
  
  // Add all the reconstruction functions
  reconstructSingleChoiceQuestion(record) {
    const media = JSON.parse(record.media_data || '{}');
    const options = JSON.parse(record.options_data || '[]');
    
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
    const media = JSON.parse(record.media_data || '{}');
    const options = JSON.parse(record.options_data || '[]');
    const correctAnswers = JSON.parse(record.correct_answers || '[]');
    
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
    const media = JSON.parse(record.media_data || '{}');
    const blanks = JSON.parse(record.blanks_data || '[]');
    
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
    const media = JSON.parse(record.media_data || '{}');
    const options = JSON.parse(record.options_data || '[]');
    
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
    const media = JSON.parse(record.media_data || '{}');
    
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
    const media = JSON.parse(record.media_data || '{}');
    
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
    const media = JSON.parse(record.media_data || '{}');
    const questionSettings = JSON.parse(record.question_specific_settings || '{}');
    
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
    const media = JSON.parse(record.media_data || '{}');
    const settings = JSON.parse(record.settings_data || '{}');
    
    return {
      id: record.content_id,
      type: 'multimedia-material',
      order_id: record.order_id,
      title: record.title,
      showTitle: record.show_title === 1,
      titleStyle: record.title_style,
      mediaType: record.media_type,
      media: media,  // Return the full media object
      settings: settings  // Return the full settings object
    };
  }
  
  reconstructLlmSessionMaterial(record) {
    const sessionSettings = JSON.parse(record.session_settings || '{}');
    
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
  
  close() {
    return new Promise((resolve, reject) => {
      this.db.close(err => {
        if (err) {
          console.error('Error closing database:', err);
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    });
  }
}

module.exports = FormProcessingService;