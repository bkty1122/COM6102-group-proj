// /src/api/formExportApi.js
import apiClient from './apiClient';

const formExportApi = {
  /**
   * Export a form to the backend
   * @param {Object} formData - The form data to export
   * @returns {Promise} - Promise resolving to the export result
   */
  exportForm: async (formData) => {
    try {
      // Prepare the form data with title and timestamp if not provided
      const data = {
        title: formData.title || 'Form Builder Export',
        exportDate: formData.exportDate || new Date().toISOString(),
        pages: formData.pages || [],
        ...formData
      };
      
      const response = await apiClient.post('/exports/export', data);
      return response.data;
    } catch (error) {
      console.error('Error exporting form:', error);
      throw error;
    }
  },
  
  /**
   * Download an exported form by its ID
   * @param {string} questionBankId - The ID of the question bank to download
   * @returns {string} - Direct URL to download the file
   */
  getDownloadUrl: (questionBankId) => {
    return `${apiClient.defaults.baseURL}/exports/download/${questionBankId}`;
  },
  
  /**
   * Get a list of all exported forms
   * @param {Object} filters - Optional filters for the list
   * @returns {Promise} - Promise resolving to a list of forms
   */
  listForms: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await apiClient.get(`/exports/list?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error listing forms:', error);
      throw error;
    }
  },
  
  /**
   * Get a single form by ID
   * @param {string} questionBankId - The ID of the question bank to fetch
   * @returns {Promise} - Promise resolving to the form data
   */
  getFormById: async (questionBankId) => {
    try {
      const response = await apiClient.get(`/exports/form/${questionBankId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching form ${questionBankId}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete an exported form
   * @param {string} questionBankId - The ID of the question bank to delete
   * @returns {Promise} - Promise resolving to the deletion result
   */
  deleteForm: async (questionBankId) => {
    try {
      const response = await apiClient.delete(`/exports/form/${questionBankId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting form ${questionBankId}:`, error);
      throw error;
    }
  },

  /**
   * Load a form for editing in the form editor
   * @param {string} questionBankId - The ID of the question bank to edit
   * @returns {Promise} - Promise resolving to the form data formatted for the editor
   */
  loadFormForEditing: async (questionBankId) => {
    try {
      const response = await apiClient.get(`/exports/form/${questionBankId}?format=editor`);
      return response.data;
    } catch (error) {
      console.error(`Error loading form for editing ${questionBankId}:`, error);
      throw error;
    }
  }
};

export default formExportApi;