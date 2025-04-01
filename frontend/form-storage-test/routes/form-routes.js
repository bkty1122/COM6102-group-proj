// routes/production-routes.js
const express = require('express');
const router = express.Router();
const FormProcessingService = require('../models/form-processing-service');

// Create a new form with the production service
router.post('/forms', async (req, res, next) => {
  try {
    const formData = req.body;
    
    if (!formData) {
      return res.status(400).json({
        error: true,
        message: 'Form data is required'
      });
    }
    
    const service = new FormProcessingService();
    
    try {
      const result = await service.processForm(formData);
      
      res.status(201).json({
        success: true,
        message: 'Form created successfully',
        data: {
          questionbankId: result.questionbankId
        }
      });
    } finally {
      // Always close the service connection
      await service.close();
    }
  } catch (error) {
    next(error);
  }
});

// GET endpoint to get a specific form by ID (full details)
router.get('/form/:id', async (req, res) => {
  try {
    const questionbankId = req.params.id;
    
    // Get the form data from the database
    const questionBank = await formService.getQuestionBankById(questionbankId);
    
    if (!questionBank) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }
    
    // Get additional metadata
    const questionCount = await formService.getQuestionCountForBank(questionbankId);
    
    // Combine the data
    const result = {
      ...questionBank,
      question_count: questionCount
    };
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get form',
      error: error.message
    });
  }
});

// Add additional metadata to the list endpoint
router.get('/list', async (req, res) => {
  try {
    // Query all question banks from the database
    const banks = await formService.listQuestionBanks();
    
    // Enhance banks with additional information
    const enhancedBanks = await Promise.all(banks.map(async (bank) => {
      // Get the first page for each bank to extract exam metadata
      const firstPage = await formService.getFirstPageForBank(bank.questionbank_id);
      
      // Get question count
      const questionCount = await formService.getQuestionCountForBank(bank.questionbank_id);
      
      return {
        ...bank,
        exam_language: firstPage?.exam_language || null,
        exam_type: firstPage?.exam_type || null,
        component: firstPage?.component || null,
        category: firstPage?.category || null,
        question_count: questionCount || 0
      };
    }));
    
    res.json({
      success: true,
      data: enhancedBanks
    });
  } catch (error) {
    console.error('Error listing forms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list forms',
      error: error.message
    });
  }
});

module.exports = router;