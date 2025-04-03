// src/utils/formDataTransformer.js

/**
 * Safely parse JSON strings
 * @param {string|Object} jsonString - JSON string to parse or object to return as-is
 * @returns {Object|Array|null} - Parsed object or null if parsing failed
 */
export const parseJsonString = (jsonString) => {
    if (typeof jsonString === 'string') {
      try {
        return JSON.parse(jsonString);
      } catch (e) {
        console.warn('Failed to parse JSON string:', jsonString);
        return null;
      }
    }
    return jsonString; // Return as is if not a string (already an object)
  };
  
  /**
   * Detect if JSON is from database format (with stringified fields)
   * @param {Object} jsonData - The JSON data to check
   * @returns {boolean} - True if data is in database format
   */
  export const isDbJsonFormat = (jsonData) => {
    return jsonData?.pages?.[0]?.cards?.[0]?.contents?.[0] && 
           (typeof jsonData.pages[0].cards[0].contents[0].options === 'string' ||
            typeof jsonData.pages[0].cards[0].contents[0].blanks === 'string' ||
            typeof jsonData.pages[0].cards[0].contents[0].media === 'string');
  };
  
  /**
   * Process a single content item from database format
   * @param {Object} content - The content item to process
   * @param {number} idx - The index/order of the content
   * @returns {Object} - Processed content with parsed fields
   */
  export const processContentItem = (content, idx) => {
    // Create a new content object with parsed JSON fields
    const processedContent = { ...content, order_id: idx };
    
    // Parse stringified JSON fields based on content type
    if (content.type === 'single-choice' || content.type === 'multiple-choice') {
      processedContent.options = parseJsonString(content.options) || [];
      if (content.type === 'multiple-choice') {
        processedContent.correctAnswers = parseJsonString(content.correctAnswers) || [];
      }
    } else if (content.type === 'fill-in-the-blank' || content.type === 'matching') {
      processedContent.blanks = parseJsonString(content.blanks) || [];
      if (content.type === 'matching' && content.options) {
        processedContent.options = parseJsonString(content.options) || [];
      }
    } else if (content.type === 'multimedia-material') {
      processedContent.media = parseJsonString(content.media) || {};
      processedContent.settings = parseJsonString(content.settings) || {};
    }
    
    return processedContent;
  };
  
  /**
   * Transform database JSON format to form builder format
   * @param {Object} jsonData - The database JSON data
   * @returns {Object} - Transformed data for form builder
   */
  export const transformDbJsonToFormBuilder = (jsonData) => {
    return {
      pages: jsonData.pages.map((page, index) => {
        // Create card types array
        const cardTypes = page.cards.map(card => card.card_type);
        
        // Create cardContents object with proper structure
        const cardContents = {};
        page.cards.forEach(card => {
          if (card.contents && Array.isArray(card.contents)) {
            // For each card type, process its contents
            if (!cardContents[card.card_type]) {
              cardContents[card.card_type] = [];
            }
            
            // Process each content item
            card.contents.forEach((content, idx) => {
              // Process the content and add to the card contents array
              cardContents[card.card_type].push(processContentItem(content, idx));
            });
          }
        });
        
        return {
          id: index + 1,
          examCategories: {
            exam_language: page.exam_language || "en",
            exam_type: page.exam_categories?.exam_type || "",
            component: page.exam_categories?.component || "",
            category: page.exam_categories?.category || ""
          },
          cards: cardTypes,
          cardContents: cardContents
        };
      })
    };
  };
  
  /**
   * Transform regular JSON format to form builder format
   * @param {Object} jsonData - The regular JSON data
   * @returns {Object} - Transformed data for form builder
   */
  export const transformJsonToFormBuilder = (jsonData) => {
    return {
      pages: jsonData.pages.map((page, index) => {
        // Create card types array
        const cardTypes = page.cards.map(card => card.card_type);
        
        // Create cardContents object with proper structure
        const cardContents = {};
        page.cards.forEach(card => {
          if (card.contents && Array.isArray(card.contents)) {
            cardContents[card.card_type] = card.contents.map((content, idx) => ({
              ...content,
              order_id: idx
            }));
          }
        });
        
        return {
          id: index + 1,
          examCategories: {
            exam_language: page.exam_language || "en",
            exam_type: page.exam_categories?.exam_type || "",
            component: page.exam_categories?.component || "",
            category: page.exam_categories?.category || ""
          },
          cards: cardTypes,
          cardContents: cardContents
        };
      })
    };
  };
  
  /**
   * Main transformer function that detects format and transforms accordingly
   * @param {Object} jsonData - The JSON data to transform
   * @returns {Object} - Transformed data for form builder
   */
  export const transformFormData = (jsonData) => {
    if (isDbJsonFormat(jsonData)) {
      console.log("Detected database JSON format, transforming...");
      return transformDbJsonToFormBuilder(jsonData);
    } else {
      console.log("Detected regular JSON format, transforming...");
      return transformJsonToFormBuilder(jsonData);
    }
  };
  
  /**
   * Transform form builder data to export format
   * @param {Object} formData - The form builder data
   * @returns {Object} - Transformed data ready for export
   */
  export const transformFormBuilderToExportFormat = (formData) => {
    return {
      title: formData.title || "Form Builder Export",
      description: formData.description || "",
      status: formData.status || "draft",
      exportDate: formData.exportDate || new Date().toISOString(),
      pages: formData.pages.map(page => {
        // Convert cards and cardContents to export format
        const cards = page.cards.map(cardType => {
          const contents = page.cardContents[cardType] || [];
          
          return {
            card_type: cardType,
            position: page.cards.indexOf(cardType),
            contents: contents
          };
        });
        
        return {
          exam_language: page.examCategories?.exam_language || "en",
          exam_categories: {
            exam_type: page.examCategories?.exam_type || "",
            component: page.examCategories?.component || "",
            category: page.examCategories?.category || ""
          },
          cards: cards
        };
      })
    };
  };