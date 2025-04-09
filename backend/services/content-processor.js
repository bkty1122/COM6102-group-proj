class ContentProcessor {
  constructor(dbService) {
    this.dbService = dbService;
  }

  // Helper for content processing
  async processContent(cardId, content, cardType, client) {
    const contentType = content.type;
    
    try {
      switch (contentType) {
        case 'single-choice':
          return await this.processSingleChoiceQuestion(cardId, content, client);
        
        case 'multiple-choice':
          return await this.processMultipleChoiceQuestion(cardId, content, client);
        
        case 'fill-in-the-blank':
          return await this.processFillInBlankQuestion(cardId, content, client);
        
        case 'matching':
          return await this.processMatchingQuestion(cardId, content, client);
        
        case 'long-text':
          return await this.processLongTextQuestion(cardId, content, client);
        
        case 'audio':
          return await this.processAudioResponseQuestion(cardId, content, client);
        
        case 'text-material':
          return await this.processTextMaterial(cardId, content, client);
        
        case 'multimedia-material':
          return await this.processMultimediaMaterial(cardId, content, client);
        
        case 'llm-session-material':
          return await this.processLlmSessionMaterial(cardId, content, client);
        
        case 'llm-audio-response':
          return await this.processLlmAudioResponseQuestion(cardId, content, client);
        
        default:
          console.warn(`Unknown content type: ${contentType}`);
          return null;
      }
    } catch (error) {
      console.error(`Error processing content type ${contentType}:`, error);
      throw error;
    }
  }
  
  // Question type processors
  async processSingleChoiceQuestion(cardId, content, client) {
    try {
      // Store question media
      const mediaData = JSON.stringify({
        question_image: content.question_image,
        question_audio: content.question_audio,
        question_video: content.question_video
      });
      
      // Store options with their media
      const optionsData = JSON.stringify(content.options || []);
      
      // Use the provided client if available, otherwise use the dbService
      const queryExecutor = client || this.dbService.pool;
      
      return await queryExecutor.query(
        `INSERT INTO single_choice_questions 
         (content_id, card_id, order_id, question, answer_id, correct_answer, 
          instruction, difficulty, marks, options_data, media_data) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
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
  
  async processMultipleChoiceQuestion(cardId, content, client) {
    try {
      const mediaData = JSON.stringify({
        question_image: content.question_image,
        question_audio: content.question_audio,
        question_video: content.question_video
      });
      
      const optionsData = JSON.stringify(content.options || []);
      const correctAnswersData = JSON.stringify(content.correctAnswers || []);
      
      // Use the provided client if available, otherwise use the dbService
      const queryExecutor = client || this.dbService.pool;
      
      return await queryExecutor.query(
        `INSERT INTO multiple_choice_questions 
         (content_id, card_id, order_id, question, answer_id, 
          instruction, difficulty, marks, options_data, correct_answers, media_data) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
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
  
  async processFillInBlankQuestion(cardId, content, client) {
    try {
      const mediaData = JSON.stringify({
        question_image: content.question_image,
        question_audio: content.question_audio,
        question_video: content.question_video
      });
      
      const blanksData = JSON.stringify(content.blanks || []);
      
      // Use the provided client if available, otherwise use the dbService
      const queryExecutor = client || this.dbService.pool;
      
      return await queryExecutor.query(
        `INSERT INTO fill_in_blank_questions 
         (content_id, card_id, order_id, question, instruction, difficulty, blanks_data, media_data) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
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
  
  async processMatchingQuestion(cardId, content, client) {
    try {
      const mediaData = JSON.stringify({
        question_image: content.question_image,
        question_audio: content.question_audio,
        question_video: content.question_video
      });
      
      // Standardize: Use blanks but store as options_data
      const optionsData = JSON.stringify(content.blanks || content.options || []);
      
      // Use the provided client if available, otherwise use the dbService
      const queryExecutor = client || this.dbService.pool;
      
      return await queryExecutor.query(
        `INSERT INTO matching_questions 
         (content_id, card_id, order_id, question, instruction, difficulty, options_data, media_data) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
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
  
  async processLongTextQuestion(cardId, content, client) {
    try {
      const mediaData = JSON.stringify({
        question_image: content.question_image,
        question_audio: content.question_audio,
        question_video: content.question_video
      });
      
      // Use the provided client if available, otherwise use the dbService
      const queryExecutor = client || this.dbService.pool;
      
      return await queryExecutor.query(
        `INSERT INTO long_text_questions 
         (content_id, card_id, order_id, question, instruction, difficulty, 
          placeholder, rows, suggested_answer, marks, media_data) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
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
  
  async processAudioResponseQuestion(cardId, content, client) {
    try {
      const mediaData = JSON.stringify({
        question_image: content.question_image,
        question_audio: content.question_audio,
        question_video: content.question_video
      });
      
      // Use the provided client if available, otherwise use the dbService
      const queryExecutor = client || this.dbService.pool;
      
      return await queryExecutor.query(
        `INSERT INTO audio_response_questions 
         (content_id, card_id, order_id, question, instruction, difficulty, 
          max_seconds, marks, allow_rerecording, allow_pause, show_timer, media_data) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
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
  
  async processLlmAudioResponseQuestion(cardId, content, client) {
    try {
      const mediaData = JSON.stringify({
        question_image: content.question_image,
        question_audio: content.question_audio,
        question_video: content.question_video
      });
      
      const questionSettings = JSON.stringify(content.questionSpecificSettings || {});
      
      // Use the provided client if available, otherwise use the dbService
      const queryExecutor = client || this.dbService.pool;
      
      return await queryExecutor.query(
        `INSERT INTO llm_audio_response_questions 
         (content_id, card_id, order_id, question, instruction, difficulty, 
          max_seconds, marks, allow_rerecording, allow_pause, show_timer,
          number_of_questions, llm_session_type, linked_llm_session_id,
          question_specific_settings, media_data) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
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
  
  // Material type processors
  async processTextMaterial(cardId, content, client) {
    try {
      // Use the provided client if available, otherwise use the dbService
      const queryExecutor = client || this.dbService.pool;
      
      return await queryExecutor.query(
        `INSERT INTO text_materials 
         (content_id, card_id, order_id, title, content, show_title, title_style, is_rich_text) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
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
  
  async processMultimediaMaterial(cardId, content, client) {
    try {
      // Store the full media object
      const mediaData = JSON.stringify(content.media || {});
      
      // Store the full settings object
      const settingsData = JSON.stringify(content.settings || {});
      
      // Use the provided client if available, otherwise use the dbService
      const queryExecutor = client || this.dbService.pool;
      
      return await queryExecutor.query(
        `INSERT INTO multimedia_materials 
         (content_id, card_id, order_id, title, show_title, title_style, media_type, media_data, settings_data) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
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
  
  async processLlmSessionMaterial(cardId, content, client) {
    try {
      // Use the provided client if available, otherwise use the dbService
      const queryExecutor = client || this.dbService.pool;
      
      return await queryExecutor.query(
        `INSERT INTO llm_session_materials 
         (content_id, card_id, order_id, title, show_title, title_style, session_settings) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
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
}

module.exports = ContentProcessor;