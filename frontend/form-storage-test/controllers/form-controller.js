const FormModel = require('../models/form-model');

// Controller for form operations
const FormController = {
  // Create new form
  async createForm(req, res, next) {
    try {
      const formData = req.body;
      
      if (!formData) {
        return res.status(400).json({
          error: true,
          message: 'Form data is required'
        });
      }
      
      const result = await FormModel.createForm(formData);
      
      res.status(201).json({
        success: true,
        message: 'Form created successfully',
        data: {
          questionbankId: result.questionbankId
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  // Get form by ID
  async getFormById(req, res, next) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          error: true,
          message: 'Form ID is required'
        });
      }
      
      const form = await FormModel.getFormById(id);
      
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
    } catch (error) {
      next(error);
    }
  },
  
  // Get all forms
  async getAllForms(req, res, next) {
    try {
      const forms = await FormModel.getAllForms();
      
      res.status(200).json({
        success: true,
        count: forms.length,
        data: forms
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = FormController;