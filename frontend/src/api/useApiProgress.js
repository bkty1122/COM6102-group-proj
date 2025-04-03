// /workspaces/COM6102-group-proj/frontend/src/api/useApiProgress.js
import { useState, useCallback } from 'react';

/**
 * Hook for tracking API request loading states
 * @returns {Object} Loading state and handler functions
 */
const useApiProgress = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  /**
   * Wrap an API call with loading indicators
   * @param {Function} apiCall - Async function making the API call
   * @param {Object} options - Options for handling the response
   * @returns {Promise} Result of the API call
   */
  const callApi = useCallback(async (apiCall, options = {}) => {
    const {
      successMessage = 'Operation completed successfully',
      errorMessage = 'Operation failed',
      onSuccess = null,
      onError = null,
      resetStates = true
    } = options;
    
    if (resetStates) {
      setError(null);
      setSuccess(null);
    }
    
    setLoading(true);
    
    try {
      const result = await apiCall();
      setSuccess(successMessage);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const message = err.message || errorMessage;
      setError(message);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Reset all states
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(null);
  }, []);
  
  return {
    loading,
    error,
    success,
    callApi,
    reset,
    setError,
    setSuccess
  };
};

export default useApiProgress;