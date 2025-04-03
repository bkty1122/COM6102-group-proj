// src/api/formApi.js

import apiClient from './apiClient';

/**
 * Save a new form to the database
 */
const saveForm = async (formData, isPublished = false) => {
  try {
    // Make sure form status is set based on isPublished
    formData.status = isPublished ? 'published' : 'draft';
    
    const response = await apiClient.post('/exports/export', formData);
    
    // Transform the response to match expected format in the component
    return {
      data: {
        success: response.data.success,
        form: {
          id: response.data.data.questionbank_id
        },
        message: response.data.message
      }
    };
  } catch (error) {
    console.error('Error saving form:', error);
    throw error;
  }
};

/**
 * Update an existing form
 */
const updateForm = async (formId, formData, isPublished = false) => {
  try {
    // Make sure form has the correct ID and status
    formData.questionbank_id = formId;
    formData.status = isPublished ? 'published' : 'draft';
    
    const response = await apiClient.post('/exports/export', formData);
    
    // Transform the response to match expected format in the component
    return {
      data: {
        success: response.data.success,
        form: {
          id: response.data.data.questionbank_id
        },
        message: response.data.message
      }
    };
  } catch (error) {
    console.error('Error updating form:', error);
    throw error;
  }
};

// List all forms
const listForms = async () => {
  try {
    const response = await apiClient.get('/exports/forms');
    return response.data;
  } catch (error) {
    console.error('Error listing forms:', error);
    throw error;
  }
};

// Get a form by ID
const getFormById = async (formId, format = 'default') => {
  try {
    const response = await apiClient.get(`/exports/forms/${formId}?format=${format}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting form ${formId}:`, error);
    throw error;
  }
};

// Delete a form
const deleteForm = async (formId) => {
  try {
    const response = await apiClient.delete(`/exports/forms/${formId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting form ${formId}:`, error);
    throw error;
  }
};

export const formApi = {
  saveForm,
  updateForm,
  listForms,
  getFormById,
  deleteForm
};