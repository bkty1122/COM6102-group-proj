// src/api/formEditorApi.js
import apiClient from './apiClient';

/**
 * Get form data for editing
 */
const getFormForEdit = async (formId) => {
  try {
    const response = await apiClient.get(`/edit/forms/${formId}/edit`);
    return response.data;
  } catch (error) {
    console.error(`Error getting form ${formId} for editing:`, error);
    throw error;
  }
};

/**
 * Update form metadata (title, description, publication status)
 */
const updateFormMetadata = async (formId, metadata) => {
  try {
    const response = await apiClient.patch(`/edit/forms/${formId}/metadata`, metadata);
    return response.data;
  } catch (error) {
    console.error(`Error updating form ${formId} metadata:`, error);
    throw error;
  }
};

/**
 * Update page metadata (exam language, type, category, etc)
 */
const updatePageMetadata = async (formId, pageIndex, metadata) => {
  try {
    const response = await apiClient.patch(
      `/edit/forms/${formId}/pages/${pageIndex}/metadata`, 
      metadata
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating page metadata for form ${formId}:`, error);
    throw error;
  }
};

/**
 * Add a new page to the form
 */
const addPage = async (formId, pageData = {}) => {
  try {
    const response = await apiClient.post(`/edit/forms/${formId}/pages`, pageData);
    return response.data;
  } catch (error) {
    console.error(`Error adding page to form ${formId}:`, error);
    throw error;
  }
};

/**
 * Delete a page from the form
 */
const deletePage = async (formId, pageIndex) => {
  try {
    const response = await apiClient.delete(`/edit/forms/${formId}/pages/${pageIndex}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting page ${pageIndex} from form ${formId}:`, error);
    throw error;
  }
};

/**
 * Add a new card to a page
 */
const addCard = async (formId, pageIndex, cardData) => {
  try {
    if (!cardData.card_type) {
      throw new Error("Card type is required");
    }
    
    const response = await apiClient.post(
      `/edit/forms/${formId}/pages/${pageIndex}/cards`, 
      cardData
    );
    return response.data;
  } catch (error) {
    console.error(`Error adding card to page ${pageIndex} of form ${formId}:`, error);
    throw error;
  }
};

/**
 * Delete a card from a page
 */
const deleteCard = async (formId, pageIndex, cardPosition) => {
  try {
    const response = await apiClient.delete(
      `/edit/forms/${formId}/pages/${pageIndex}/cards/${cardPosition}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error deleting card ${cardPosition} from form ${formId}:`, error);
    throw error;
  }
};

/**
 * Add content to a card
 */
const addCardContent = async (formId, pageIndex, cardPosition, contentData) => {
  try {
    if (!contentData.type) {
      throw new Error("Content type is required");
    }
    
    const response = await apiClient.post(
      `/edit/forms/${formId}/pages/${pageIndex}/cards/${cardPosition}/content`, 
      contentData
    );
    return response.data;
  } catch (error) {
    console.error(`Error adding content to card ${cardPosition} in form ${formId}:`, error);
    throw error;
  }
};

/**
 * Update card content
 */
const updateCardContent = async (formId, contentId, contentData) => {
  try {
    if (!contentData.type) {
      throw new Error("Content type is required");
    }
    
    const response = await apiClient.put(
      `/edit/forms/${formId}/content/${contentId}`, 
      contentData
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating content ${contentId} in form ${formId}:`, error);
    throw error;
  }
};

/**
 * Delete card content
 */
const deleteCardContent = async (formId, contentId, contentType) => {
  try {
    if (!contentType) {
      throw new Error("Content type is required");
    }
    
    const response = await apiClient.delete(
      `/edit/forms/${formId}/content/${contentId}?type=${contentType}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error deleting content ${contentId} from form ${formId}:`, error);
    throw error;
  }
};

/**
 * Complete form update in one operation
 * This is a fallback that uses the export endpoint for a full form update
 */
const updateCompleteForm = async (formId, formData) => {
  try {
    // Ensure form has the correct ID
    formData.questionbank_id = formId;
    
    const response = await apiClient.post('/exports/export', formData);
    return response.data;
  } catch (error) {
    console.error(`Error updating complete form ${formId}:`, error);
    throw error;
  }
};

const formEditorApi = {
  getFormForEdit,
  updateFormMetadata,
  updatePageMetadata,
  addPage,
  deletePage,
  addCard,
  deleteCard,
  addCardContent,
  updateCardContent,
  deleteCardContent,
  updateCompleteForm,
};

export default formEditorApi;