// src/api/formApi.js
import axios from 'axios';

// Create an axios instance with default configs
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Form API methods
export const formApi = {
  /**
   * Save a form to the server
   * @param {Object} formData - The form data to save
   * @param {boolean} isPublished - Whether to publish the form
   * @returns {Promise} - The API response
   */
  saveForm: async (formData, isPublished = false) => {
    try {
      const response = await api.post('/forms', {
        title: formData.title || 'Untitled Form',
        description: formData.description || '',
        pages: formData.pages || [],
        status: isPublished ? 'published' : 'draft',
      });
      return response.data;
    } catch (error) {
      console.error('Error saving form:', error);
      throw error;
    }
  },

  /**
   * Update an existing form
   * @param {string} formId - The ID of the form to update
   * @param {Object} formData - The form data to update
   * @param {boolean} isPublished - Whether to publish the form
   * @returns {Promise} - The API response
   */
  updateForm: async (formId, formData, isPublished = false) => {
    try {
      const response = await api.put(`/forms/${formId}`, {
        title: formData.title || 'Untitled Form',
        description: formData.description || '',
        pages: formData.pages || [],
        status: isPublished ? 'published' : 'draft',
      });
      return response.data;
    } catch (error) {
      console.error('Error updating form:', error);
      throw error;
    }
  },

  /**
   * Get a form by ID
   * @param {string} formId - The ID of the form to get
   * @returns {Promise} - The API response
   */
  getForm: async (formId) => {
    try {
      const response = await api.get(`/forms/${formId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting form:', error);
      throw error;
    }
  },

  /**
   * Get all forms
   * @param {Object} filters - Optional filters for the forms
   * @returns {Promise} - The API response
   */
  getForms: async (filters = {}) => {
    try {
      const response = await api.get('/forms', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error getting forms:', error);
      throw error;
    }
  },

  /**
   * Delete a form
   * @param {string} formId - The ID of the form to delete
   * @returns {Promise} - The API response
   */
  deleteForm: async (formId) => {
    try {
      const response = await api.delete(`/forms/${formId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting form:', error);
      throw error;
    }
  }
};