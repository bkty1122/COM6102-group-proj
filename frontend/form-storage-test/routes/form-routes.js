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

// Get form by ID
router.get('/forms/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        error: true,
        message: 'Form ID is required'
      });
    }
    
    const service = new FormProcessingService();
    
    try {
      const form = await service.getQuestionBankById(id);
      
      if (!form) {
        return res.status(404).json({
          error: true,
          message: 'Form not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: form
      });
    } finally {
      // Always close the service connection
      await service.close();
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;