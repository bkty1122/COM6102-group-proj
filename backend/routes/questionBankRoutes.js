// routes/questionBankRoutes.js
const express = require('express');
const questionBankController = require('../controllers/questionBankController');
// const auth = require('../middleware/auth'); // Uncomment to use auth

const router = express.Router();

// Get all question banks
router.get('/', questionBankController.getAllQuestionBanks);

// Get a question bank by ID
router.get('/:id', questionBankController.getQuestionBankById);

// Create a new question bank
router.post('/', questionBankController.createQuestionBank);

// Update a question bank
router.put('/:id', questionBankController.updateQuestionBank);

// Delete a question bank
router.delete('/:id', questionBankController.deleteQuestionBank);

module.exports = router;