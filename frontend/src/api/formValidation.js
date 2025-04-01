// /workspaces/COM6102-group-proj/frontend/src/utils/formValidation.js
/**
 * Validates a form object for required fields and data structure
 * @param {Object} formData - The form data to validate
 * @returns {Object} - Validation result with isValid flag and errors array
 */
export const validateForm = (formData) => {
    const errors = [];
    
    // Check for required fields
    if (!formData.title) {
      errors.push({ field: 'title', message: 'Form title is required' });
    }
    
    // Check if pages array exists and is not empty
    if (!formData.pages || !Array.isArray(formData.pages) || formData.pages.length === 0) {
      errors.push({ field: 'pages', message: 'Form must have at least one page' });
      return { isValid: false, errors };
    }
    
    // Validate each page
    formData.pages.forEach((page, pageIndex) => {
      // Check if page has cards
      if (!page.cards || !Array.isArray(page.cards)) {
        errors.push({ 
          field: `pages[${pageIndex}].cards`, 
          message: `Page ${pageIndex + 1} is missing cards array` 
        });
      } else if (page.cards.length === 0) {
        errors.push({ 
          field: `pages[${pageIndex}].cards`, 
          message: `Page ${pageIndex + 1} has no cards` 
        });
      }
      
      // Check examCategories
      if (!page.examCategories || !page.examCategories.exam_language) {
        errors.push({ 
          field: `pages[${pageIndex}].examCategories`, 
          message: `Page ${pageIndex + 1} is missing exam language` 
        });
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  /**
   * Checks for duplicate IDs within the form data
   * @param {Object} formData - The form data to check
   * @returns {Object} - Result with hasDuplicates flag and duplicateIds array
   */
  export const checkForDuplicateIds = (formData) => {
    const contentIds = new Set();
    const duplicateIds = [];
    
    // Check for duplicate content IDs across all pages and cards
    formData.pages.forEach(page => {
      const cardContents = page.cardContents || {};
      
      Object.values(cardContents).forEach(contents => {
        if (Array.isArray(contents)) {
          contents.forEach(content => {
            if (content.id) {
              if (contentIds.has(content.id)) {
                duplicateIds.push(content.id);
              } else {
                contentIds.add(content.id);
              }
            }
          });
        }
      });
    });
    
    return {
      hasDuplicates: duplicateIds.length > 0,
      duplicateIds
    };
  };
  
  /**
   * Creates a URL-friendly slug from a title
   * @param {string} title - The title to convert to a slug
   * @returns {string} - The generated slug
   */
  export const createSlugFromTitle = (title) => {
    if (!title) return '';
    
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/--+/g, '-')     // Replace multiple hyphens with single hyphen
      .trim();
  };