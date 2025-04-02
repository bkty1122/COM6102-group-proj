// /src/api/formExportApi.js
import apiClient from './apiClient';

const exportForm = async (formData) => {
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
};

const getDownloadUrl = (questionBankId) => {
  return `${apiClient.defaults.baseURL}/exports/download/${questionBankId}`;
};

const listForms = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/exports/list?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error listing forms:', error);
    throw error;
  }
};

const getFormById = async (questionBankId) => {
  try {
    const response = await apiClient.get(`/exports/form/${questionBankId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching form ${questionBankId}:`, error);
    throw error;
  }
};

const deleteForm = async (questionBankId) => {
  try {
    const response = await apiClient.delete(`/exports/form/${questionBankId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting form ${questionBankId}:`, error);
    throw error;
  }
};

const loadFormForEditing = async (questionBankId) => {
  try {
    const response = await apiClient.get(`/exports/form/${questionBankId}?format=editor`);
    return response.data;
  } catch (error) {
    console.error(`Error loading form for editing ${questionBankId}:`, error);
    throw error;
  }
};

// Export as a single object with all functions
export default {
  exportForm,
  getDownloadUrl,
  listForms,
  getFormById,
  deleteForm,
  loadFormForEditing
};