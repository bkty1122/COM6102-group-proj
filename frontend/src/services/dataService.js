// src/services/dataService.js
import apiClient from '../api/apiClient';
import { formExportApi } from '../api'; 

/**
 * Fetch all question banks from the database
 * @returns {Promise<Array>} List of question banks
 */
export const getAllQuestionBanks = async () => {
  try {
    const response = await formExportApi.listForms();
    if (response.success && response.data) {
      // Transform the data to match the expected format in the dashboard
      return response.data.map(bank => ({
        id: bank.questionbank_id,
        title: bank.title || 'Untitled Material',
        exam_language: bank.exam_language || 'Unknown',
        exam_type: bank.exam_type || 'Generic',
        component: bank.component || 'Other',
        created_by: bank.author_id || 'system',
        created_at: bank.created_at,
        updated_by: bank.author_id || 'system',
        updated_at: bank.updated_at,
        question_count: bank.question_count || 0, // This might need to be calculated
        status: bank.status || 'draft'
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching question banks:', error);
    return [];
  }
};

/**
 * Get a single question bank by ID
 * @param {string} id - Question bank ID
 * @returns {Promise<Object>} Question bank data
 */
export const getQuestionBankById = async (id) => {
  try {
    const response = await formExportApi.getFormById(id);
    if (response.success && response.data) {
      // Transform to expected format if needed
      return response.data;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching question bank ${id}:`, error);
    return null;
  }
};

/**
 * Get filter options from question banks
 * @param {Array} materials - List of question banks
 * @returns {Object} Object containing unique filter options
 */
export const getFilterOptions = async (materials = null) => {
  try {
    // If materials are passed, use them; otherwise fetch from API
    const banks = materials || await getAllQuestionBanks();
    
    const uniqueLanguages = [...new Set(banks.map(item => item.exam_language))].filter(Boolean);
    const uniqueExamTypes = [...new Set(banks.map(item => item.exam_type))].filter(Boolean);
    const uniqueComponents = [...new Set(banks.map(item => item.component))].filter(Boolean);
    const uniqueStatuses = [...new Set(banks.map(item => item.status))].filter(Boolean);
    
    return {
      uniqueLanguages,
      uniqueExamTypes,
      uniqueComponents,
      uniqueStatuses
    };
  } catch (error) {
    console.error('Error getting filter options:', error);
    return {
      uniqueLanguages: [],
      uniqueExamTypes: [],
      uniqueComponents: [],
      uniqueStatuses: []
    };
  }
};

/**
 * Get categorized materials by language and exam type
 * @param {Array} materials - List of question banks
 * @returns {Object} Nested object of materials categorized by language and exam type
 */
export const getCategorizedMaterials = async (materials = null) => {
  try {
    // If materials are passed, use them; otherwise fetch from API
    const banks = materials || await getAllQuestionBanks();
    
    const materialsByLanguage = {};
    
    banks.forEach(material => {
      const language = material.exam_language || 'Uncategorized';
      const examType = material.exam_type || 'Generic';
      
      if (!materialsByLanguage[language]) {
        materialsByLanguage[language] = {};
      }
      
      if (!materialsByLanguage[language][examType]) {
        materialsByLanguage[language][examType] = [];
      }
      
      materialsByLanguage[language][examType].push(material);
    });
    
    return materialsByLanguage;
  } catch (error) {
    console.error('Error categorizing materials:', error);
    return {};
  }
};

/**
 * Get dashboard statistics
 * @param {Array} materials - List of question banks
 * @returns {Object} Statistics about the question banks
 */
export const getDashboardStats = async (materials = null) => {
  try {
    // If materials are passed, use them; otherwise fetch from API
    const banks = materials || await getAllQuestionBanks();
    
    const uniqueLanguages = [...new Set(banks.map(item => item.exam_language))].filter(Boolean);
    const uniqueExamTypes = [...new Set(banks.map(item => item.exam_type))].filter(Boolean);
    const uniqueComponents = [...new Set(banks.map(item => item.component))].filter(Boolean);
    
    return {
      totalMaterials: banks.length,
      published: banks.filter(m => m.status === 'published').length,
      drafts: banks.filter(m => m.status === 'draft').length,
      languages: uniqueLanguages.length,
      examTypes: uniqueExamTypes.length,
      components: uniqueComponents.length
    };
  } catch (error) {
    console.error('Error calculating dashboard stats:', error);
    return {
      totalMaterials: 0,
      published: 0,
      drafts: 0,
      languages: 0,
      examTypes: 0,
      components: 0
    };
  }
};

// For backward compatibility, keep a small set of mock data for fallback
export const MOCK_MATERIALS = [
  {
    id: 'qb-fallback',
    title: 'API Connection Failed - Fallback Data',
    exam_language: 'English',
    exam_type: 'Generic',
    component: 'Other',
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_by: 'system',
    updated_at: new Date().toISOString(),
    question_count: 0,
    status: 'draft'
  }
];