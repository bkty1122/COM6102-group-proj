class ContentRetriever {
  constructor(dbService) {
    this.dbService = dbService;
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

  // Get card contents by card ID and type
  async getCardContents(cardId, cardType, client) {
    try {
      let contentPromises = [];
      
      if (cardType === 'question') {
        // Process question content tables in parallel
        contentPromises = [
          this.getContentByType('single_choice_questions', this.reconstructSingleChoiceQuestion.bind(this), cardId, client),
          this.getContentByType('multiple_choice_questions', this.reconstructMultipleChoiceQuestion.bind(this), cardId, client),
          this.getContentByType('fill_in_blank_questions', this.reconstructFillInBlankQuestion.bind(this), cardId, client),
          this.getContentByType('matching_questions', this.reconstructMatchingQuestion.bind(this), cardId, client),
          this.getContentByType('long_text_questions', this.reconstructLongTextQuestion.bind(this), cardId, client),
          this.getContentByType('audio_response_questions', this.reconstructAudioQuestion.bind(this), cardId, client),
          this.getContentByType('llm_audio_response_questions', this.reconstructLlmAudioQuestion.bind(this), cardId, client)
        ];
      } else if (cardType === 'material') {
        // Process material content tables in parallel
        contentPromises = [
          this.getContentByType('text_materials', this.reconstructTextMaterial.bind(this), cardId, client),
          this.getContentByType('multimedia_materials', this.reconstructMultimediaMaterial.bind(this), cardId, client),
          this.getContentByType('llm_session_materials', this.reconstructLlmSessionMaterial.bind(this), cardId, client)
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
  async getContentByType(tableName, reconstructFn, cardId, client) {
    try {
      // Use the provided client if available, otherwise use the dbService pool
      const queryExecutor = client || this.dbService.pool;
      
      const result = await queryExecutor.query(
        `SELECT * FROM ${tableName} WHERE card_id = $1 ORDER BY order_id`,
        [cardId]
      );
      
      const records = result.rows;
      
      return records.map(record => reconstructFn(record));
    } catch (error) {
      console.error(`Error getting content from ${tableName}:`, error);
      return [];
    }
  }
  
  // Reconstruction functions for different content types
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
    const correctAnswers = this.safeParseJson(record.correct_answer, []);
    
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
}

module.exports = ContentRetriever;