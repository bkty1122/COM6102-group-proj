// frontend/src/services/api.js
import axios from 'axios';

// API configuration from environment variables
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const USE_LOCAL_JSON = process.env.REACT_APP_USE_LOCAL_JSON === 'true';

// For local development fallback
let localJsonData = null;
try {
  localJsonData = require('../api/examFieldRelationship.json');
} catch (e) {
  console.warn('Local JSON file not found for fallback');
}

// Create axios instance with configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Exam fields API methods
export const examFieldsApi = {
  // Get exam fields data
  getExamFields: async () => {
    if (USE_LOCAL_JSON && localJsonData) {
      console.info('Using local JSON file instead of API call');
      return localJsonData;
    }
    
    try {
      const response = await api.get('/api/exam-fields');
      return response.data;
    } catch (error) {
      console.error('Error fetching exam fields:', error);
      
      // Try local fallback if API fails
      if (localJsonData) {
        console.warn('API call failed, using local JSON fallback');
        return localJsonData;
      }
      
      throw error;
    }
  },
  
  // Save exam fields data
  saveExamFields: async (data) => {
    if (USE_LOCAL_JSON) {
      console.info('Local JSON mode: Changes not saved to server');
      return { success: true, message: 'Changes saved (local mode)' };
    }
    
    try {
      const response = await api.post('/api/exam-fields', { data });
      return response.data;
    } catch (error) {
      console.error('Error saving exam fields:', error);
      throw error;
    }
  }
};

export default api;