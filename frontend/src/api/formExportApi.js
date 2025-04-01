// /workspaces/COM6102-group-proj/frontend/src/api/formExportApi.js
import apiClient from './apiClient';

const formExportApi = {
  /**
   * Export a form to the backend
   * @param {Object} formData - The form data to export
   * @returns {Promise} - Promise resolving to the export result
   */
  exportForm: async (formData) => {
    // Prepare the form data with title and timestamp if not provided
    const data = {
      title: formData.title || 'Form Builder Export',
      exportDate: formData.exportDate || new Date().toISOString(),
      pages: formData.pages || [],
      ...formData
    };
    
    const response = await apiClient.post('/exports/export', data);
    return response.data;
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
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/exports/list?${params}`);
    return response.data;
  },
  
  /**
   * Get a single form by ID
   * @param {string} questionBankId - The ID of the question bank to fetch
   * @returns {Promise} - Promise resolving to the form data
   */
  getFormById: async (questionBankId) => {
    const response = await apiClient.get(`/exports/form/${questionBankId}`);
    return response.data;
  },
  
  /**
   * Delete an exported form
   * @param {string} questionBankId - The ID of the question bank to delete
   * @returns {Promise} - Promise resolving to the deletion result
   */
  deleteForm: async (questionBankId) => {
    const response = await apiClient.delete(`/exports/form/${questionBankId}`);
    return response.data;
  }

  loadFormForEditing: async (questionBankId) => {
    const response = await apiClient.get(`/exports/form/${questionBankId}?format=editor`);
    return response.data;
  }

};

export default formExportApi;