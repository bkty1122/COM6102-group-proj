// src/utils/formValidation.js

/**
 * Validates the entire form structure
 * @param {Object} formData - The form data to validate
 * @returns {Object} - Validation result {isValid, errors}
 */
export const validateForm = (formData) => {
    const errors = [];
    
    // Check if form has a title
    if (!formData.title) {
      errors.push({ field: 'title', message: 'Form title is required' });
    }
    
    // Check if form has pages
    if (!formData.pages || !Array.isArray(formData.pages) || formData.pages.length === 0) {
      errors.push({ field: 'pages', message: 'Form must have at least one page' });
      return { isValid: false, errors };
    }
    
    // Validate each page
    formData.pages.forEach((page, pageIndex) => {
      // Check if page has cards
      if (!page.cards || !Array.isArray(page.cards) || page.cards.length === 0) {
        errors.push({ 
          field: `pages[${pageIndex}].cards`, 
          message: `Page ${pageIndex + 1} must have at least one card`
        });
        return;
      }
      
      // Validate each card
      page.cards.forEach((card, cardIndex) => {
        // Check if card has a valid type
        if (!card.card_type || !['question', 'material'].includes(card.card_type)) {
          errors.push({ 
            field: `pages[${pageIndex}].cards[${cardIndex}].card_type`, 
            message: `Card ${cardIndex + 1} on page ${pageIndex + 1} must have a valid type`
          });
        }
        
        // Check if card has contents
        if (!card.contents || !Array.isArray(card.contents) || card.contents.length === 0) {
          errors.push({ 
            field: `pages[${pageIndex}].cards[${cardIndex}].contents`, 
            message: `Card ${cardIndex + 1} on page ${pageIndex + 1} must have contents`
          });
          return;
        }
        
        // Validate each content item based on type
        card.contents.forEach((content, contentIndex) => {
          validateContentItem(
            content, 
            errors, 
            pageIndex, 
            cardIndex, 
            contentIndex
          );
        });
      });
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  /**
   * Validates a single content item
   * @param {Object} content - Content item to validate
   * @param {Array} errors - Array to collect errors
   * @param {number} pageIndex - Index of the page
   * @param {number} cardIndex - Index of the card
   * @param {number} contentIndex - Index of the content item
   */
  const validateContentItem = (content, errors, pageIndex, cardIndex, contentIndex) => {
    const path = `pages[${pageIndex}].cards[${cardIndex}].contents[${contentIndex}]`;
    
    // Check if content has an ID and type
    if (!content.id) {
      errors.push({ field: `${path}.id`, message: 'Content ID is required' });
    }
    
    if (!content.type) {
      errors.push({ field: `${path}.type`, message: 'Content type is required' });
      return;
    }
    
    // Validate based on content type
    switch (content.type) {
      case 'single-choice':
      case 'multiple-choice':
        validateChoiceQuestion(content, errors, path);
        break;
        
      case 'fill-in-the-blank':
        validateFillInTheBlank(content, errors, path);
        break;
        
      case 'matching':
        validateMatching(content, errors, path);
        break;
        
      case 'long-text':
        validateLongText(content, errors, path);
        break;
        
      case 'text-material':
        validateTextMaterial(content, errors, path);
        break;
        
      case 'multimedia-material':
        validateMultimediaMaterial(content, errors, path);
        break;
        
      default:
        errors.push({ 
          field: `${path}.type`, 
          message: `Unknown content type: ${content.type}`
        });
    }
  };
  
  /**
   * Validates a choice question (single or multiple)
   */
  const validateChoiceQuestion = (content, errors, path) => {
    // Check if question has options
    if (!content.options || !Array.isArray(content.options) || content.options.length === 0) {
      errors.push({ 
        field: `${path}.options`, 
        message: 'Choice question must have options'
      });
    } else {
      // Check if options have values
      content.options.forEach((option, index) => {
        if (!option.option_value && !option.option_image && !option.option_audio && !option.option_video) {
          errors.push({ 
            field: `${path}.options[${index}]`, 
            message: 'Option must have a value or media'
          });
        }
      });
    }
    
    // For single-choice, check correctAnswer
    if (content.type === 'single-choice' && !content.correctAnswer) {
      errors.push({ 
        field: `${path}.correctAnswer`, 
        message: 'Single choice question must have a correct answer'
      });
    }
    
    // For multiple-choice, check correctAnswers
    if (content.type === 'multiple-choice' && (!content.correctAnswers || !Array.isArray(content.correctAnswers) || content.correctAnswers.length === 0)) {
      errors.push({ 
        field: `${path}.correctAnswers`, 
        message: 'Multiple choice question must have at least one correct answer'
      });
    }
  };
  
  /**
   * Validates a fill-in-the-blank question
   */
  const validateFillInTheBlank = (content, errors, path) => {
    // Check if question has blanks
    if (!content.blanks || !Array.isArray(content.blanks) || content.blanks.length === 0) {
      errors.push({ 
        field: `${path}.blanks`, 
        message: 'Fill-in-the-blank question must have blanks'
      });
    } else {
      // Check if blanks have correctAnswers
      content.blanks.forEach((blank, index) => {
        if (!blank.correctAnswers || !Array.isArray(blank.correctAnswers) || blank.correctAnswers.length === 0) {
          errors.push({ 
            field: `${path}.blanks[${index}].correctAnswers`, 
            message: 'Blank must have at least one correct answer'
          });
        }
      });
    }
    
    // Check if question text contains all placeholders
    if (content.question) {
      content.blanks?.forEach((blank) => {
        if (blank.placeholder && !content.question.includes(blank.placeholder)) {
          errors.push({ 
            field: `${path}.question`, 
            message: `Question text doesn't contain placeholder: ${blank.placeholder}`
          });
        }
      });
    }
  };
  
  /**
   * Validates a matching question
   */
  const validateMatching = (content, errors, path) => {
    // Similar to fill-in-the-blank validation
    if (!content.blanks || !Array.isArray(content.blanks) || content.blanks.length === 0) {
      errors.push({ 
        field: `${path}.blanks`, 
        message: 'Matching question must have items to match'
      });
    } else {
      // Check if items have labels and correct answers
      content.blanks.forEach((blank, index) => {
        if (!blank.label) {
          errors.push({ 
            field: `${path}.blanks[${index}].label`, 
            message: 'Matching item must have a label'
          });
        }
        
        if (!blank.correctAnswers || !Array.isArray(blank.correctAnswers) || blank.correctAnswers.length === 0) {
          errors.push({ 
            field: `${path}.blanks[${index}].correctAnswers`, 
            message: 'Matching item must have at least one correct answer'
          });
        }
      });
    }
  };
  
  /**
   * Validates a long text question
   */
  const validateLongText = (content, errors, path) => {
    // Long text questions are more flexible, but should at least have a question
    if (!content.question) {
      errors.push({ 
        field: `${path}.question`, 
        message: 'Long text question must have question text'
      });
    }
  };
  
  /**
   * Validates text material
   */
  const validateTextMaterial = (content, errors, path) => {
    // Text material should have content
    if (!content.content) {
      errors.push({ 
        field: `${path}.content`, 
        message: 'Text material must have content'
      });
    }
  };
  
  /**
   * Validates multimedia material
   */
  const validateMultimediaMaterial = (content, errors, path) => {
    // Multimedia material should have media
    if (!content.media) {
      errors.push({ 
        field: `${path}.media`, 
        message: 'Multimedia material must have media'
      });
    } else if (!content.media.url) {
      errors.push({ 
        field: `${path}.media.url`, 
        message: 'Media must have a URL'
      });
    }
  };
  
  /**
   * Validates a form to ensure it has no duplicate IDs
   * @param {Object} formData - The form data to validate
   * @returns {Object} - Validation result {hasDuplicates, duplicateIds}
   */
  export const checkForDuplicateIds = (formData) => {
    const idMap = new Map();
    const duplicateIds = [];
    
    // Check all content items for duplicate IDs
    formData.pages?.forEach((page) => {
      page.cards?.forEach((card) => {
        card.contents?.forEach((content) => {
          if (content.id) {
            if (idMap.has(content.id)) {
              duplicateIds.push(content.id);
            } else {
              idMap.set(content.id, true);
            }
          }
        });
      });
    });
    
    return {
      hasDuplicates: duplicateIds.length > 0,
      duplicateIds
    };
  };
  
  /**
   * Creates a slug from a title for URL-friendly form identification
   * @param {string} title - The form title
   * @returns {string} - A URL-friendly slug
   */
  export const createSlugFromTitle = (title) => {
    if (!title) return '';
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/--+/g, '-')     // Replace multiple hyphens with single one
      .trim();                  // Trim whitespace
  };