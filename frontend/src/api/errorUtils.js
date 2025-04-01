// /workspaces/COM6102-group-proj/frontend/src/api/errorUtils.js
/**
 * Extract a user-friendly error message from an API error
 * @param {Object} error - Error object from API request
 * @returns {string} User-friendly error message
 */
export const extractErrorMessage = (error) => {
    // If it's already a string, return it
    if (typeof error === 'string') return error;
    
    // Check for our standardized error format
    if (error.message) return error.message;
    
    // Check for axios/response error format
    if (error.response?.data?.message) return error.response.data.message;
    if (error.response?.data?.error) return error.response.data.error;
    
    // Check for standard Error object
    if (error instanceof Error) return error.message;
    
    // Default fallback
    return 'An unknown error occurred';
  };
  
  /**
   * Format validation errors from the backend
   * @param {Object} validationErrors - Object with field validation errors
   * @returns {Array} Array of formatted error messages
   */
  export const formatValidationErrors = (validationErrors) => {
    if (!validationErrors) return [];
    
    return Object.entries(validationErrors).map(([field, message]) => {
      return `${field}: ${message}`;
    });
  };