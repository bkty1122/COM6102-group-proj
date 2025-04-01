// src/hooks/useQuestionBank.js
import { useState, useEffect } from 'react';
import formExportApi from '../api/formExportApi';
import { transformFormData } from '../utils/formDataTransformer';

const useQuestionBank = (questionBankId) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [questionBank, setQuestionBank] = useState(null);
  const [formData, setFormData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch question bank data
  const fetchQuestionBank = async (id = questionBankId) => {
    if (!id) {
      console.warn('No question bank ID provided');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Use the loadFormForEditing method which returns data in editor format
      const response = await formExportApi.loadFormForEditing(id);
      
      if (response && response.data) {
        setQuestionBank(response.data);
        
        // Transform the data for the form builder
        const transformedData = transformFormData(response.data);
        setFormData(transformedData);
        
        return transformedData;
      } else {
        // Handle empty but successful response
        console.warn('API returned success but no data', response);
        const emptyForm = {
          title: 'New Form',
          questionbank_id: id,
          pages: []
        };
        setQuestionBank(emptyForm);
        
        const transformedEmptyForm = transformFormData(emptyForm);
        setFormData(transformedEmptyForm);
        
        return transformedEmptyForm;
      }
    } catch (err) {
      console.error('Error fetching question bank:', err);
      setError(err.response?.data?.message || 'Failed to fetch question bank');
      
      // Return a default form structure on error
      const defaultForm = {
        title: 'Error Loading Form',
        questionbank_id: id,
        pages: [{
          examCategories: { exam_language: 'en' },
          cards: { question: [], material: [] },
          cardContents: { question: {}, material: {} }
        }]
      };
      
      setFormData(defaultForm);
      return defaultForm;
    } finally {
      setLoading(false);
    }
  };
  
  // Save question bank changes
  const saveQuestionBank = async (updatedFormData) => {
    if (!questionBankId) {
      setSaveError('No question bank ID provided');
      return false;
    }
    
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    
    try {
      // Transform the form data back to the API format
      const apiData = {
        questionbank_id: questionBankId,
        title: updatedFormData.title || questionBank?.title || 'Untitled Form',
        description: updatedFormData.description || questionBank?.description || '',
        // Transform the pages data for the API
        pages: (updatedFormData.pages || []).map((page, index) => {
          // Get card types and content
          const materialCards = page.cards.material || [];
          const questionCards = page.cards.question || [];
          
          const materialContents = page.cardContents.material || {};
          const questionContents = page.cardContents.question || {};
          
          // Build material card data
          const materialCard = {
            card_type: 'material',
            position: 0,
            contents: materialCards.map(id => materialContents[id]).filter(Boolean)
          };
          
          // Build question card data
          const questionCard = {
            card_type: 'question',
            position: 1,
            contents: questionCards.map(id => questionContents[id]).filter(Boolean)
          };
          
          // Only include cards that have contents
          const cards = [];
          if (materialCard.contents.length > 0) {
            cards.push(materialCard);
          }
          if (questionCard.contents.length > 0) {
            cards.push(questionCard);
          }
          
          return {
            page_index: index + 1,
            exam_language: page.examCategories?.exam_language || "en",
            exam_categories: {
              exam_language: page.examCategories?.exam_language || "en",
              exam_type: page.examCategories?.exam_type || "",
              component: page.examCategories?.component || "",
              category: page.examCategories?.category || ""
            },
            cards
          };
        })
      };
      
      // Send to API using the formExportApi
      const response = await formExportApi.exportForm(apiData);
      
      if (response && response.success) {
        setSaveSuccess(true);
        return true;
      } else {
        throw new Error(response?.message || 'Unknown error saving question bank');
      }
    } catch (err) {
      console.error('Error saving question bank:', err);
      setSaveError(err.response?.data?.message || 'Failed to save question bank');
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  // Load data when component mounts or ID changes
  useEffect(() => {
    if (questionBankId) {
      fetchQuestionBank();
    }
  }, [questionBankId]);
  
  return {
    loading,
    error,
    questionBank,
    formData,
    fetchQuestionBank,
    saveQuestionBank,
    isSaving,
    saveError,
    saveSuccess
  };
};

export default useQuestionBank;