// src/api/questionBankApi.js
import apiClient from './apiClient';

const questionBankApi = {
  /**
   * Fetch a question bank by ID
   * @param {string} id - The question bank ID
   * @returns {Promise} - Promise resolving to the question bank data
   */
  getQuestionBank: async (id) => {
    try {
      const response = await apiClient.get(`/question-banks/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching question bank:', error);
      throw error;
    }
  },
  
  /**
   * Update a question bank
   * @param {string} id - The question bank ID
   * @param {Object} data - The updated question bank data
   * @returns {Promise} - Promise resolving to the updated question bank
   */
  updateQuestionBank: async (id, data) => {
    try {
      const response = await apiClient.put(`/question-banks/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating question bank:', error);
      throw error;
    }
  },
  
  /**
   * List all question banks with optional filtering
   * @param {Object} filters - Filter parameters
   * @returns {Promise} - Promise resolving to list of question banks
   */
  listQuestionBanks: async (filters = {}) => {
    try {
      const response = await apiClient.get('/question-banks', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error listing question banks:', error);
      throw error;
    }
  },
  
  /**
   * Create a new question bank
   * @param {Object} data - The question bank data
   * @returns {Promise} - Promise resolving to the created question bank
   */
  createQuestionBank: async (data) => {
    try {
      const response = await apiClient.post('/question-banks', data);
      return response.data;
    } catch (error) {
      console.error('Error creating question bank:', error);
      throw error;
    }
  },
  
  /**
   * Delete a question bank
   * @param {string} id - The question bank ID
   * @returns {Promise} - Promise resolving to the deletion result
   */
  deleteQuestionBank: async (id) => {
    try {
      const response = await apiClient.delete(`/question-banks/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting question bank ${id}:`, error);
      throw error;
    }
  }
};

export default questionBankApi;