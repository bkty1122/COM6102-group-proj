// src/utils/errorHandling.js

/**
 * Formats API error messages for display
 * @param {Error} error - The error object from API call
 * @returns {string} - Formatted error message
 */
export const formatApiError = (error) => {
    if (!error) return 'Unknown error occurred';
    
    // Handle axios error responses
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle different status codes
      switch (status) {
        case 400:
          return data.message || 'Invalid request data';
        case 401:
          return 'You need to log in to perform this action';
        case 403:
          return 'You do not have permission to perform this action';
        case 404:
          return 'The requested resource was not found';
        case 422:
          // Format validation errors
          if (data.errors && Array.isArray(data.errors)) {
            return 'Validation errors: ' + data.errors.map(e => e.message).join(', ');
          }
          return data.message || 'Validation failed';
        case 500:
          return 'Server error occurred. Please try again later.';
        default:
          return data.message || `Error ${status}: Something went wrong`;
      }
    }
    
    // Handle network errors
    if (error.request && !error.response) {
      return 'Network error. Please check your connection.';
    }
    
    // Handle other errors
    return error.message || 'An unexpected error occurred';
  };
  
  /**
   * Centralized error logger that can be expanded for production
   * @param {string} context - Where the error occurred
   * @param {Error} error - The error object
   */
  export const logError = (context, error) => {
    // In development, log to console
    console.error(`Error in ${context}:`, error);
    
    // In production, you might want to send to a logging service
    if (process.env.NODE_ENV === 'production') {
      // Example: send to logging service
      // logger.captureException(error);
    }
  };
  
  /**
   * Transform validation errors from backend to frontend format
   * @param {Array} backendErrors - Errors from backend API
   * @returns {Array} - Frontend formatted errors
   */
  export const transformValidationErrors = (backendErrors) => {
    if (!backendErrors || !Array.isArray(backendErrors)) {
      return [];
    }
    
    return backendErrors.map(error => ({
      field: error.param || error.field || 'general',
      message: error.msg || error.message
    }));
  };