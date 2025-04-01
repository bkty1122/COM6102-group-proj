// routes/exportRoutes.js
const express = require('express');
const exportController = require('../controllers/exportController');
// const auth = require('../middleware/auth'); // Uncomment to use auth

const router = express.Router();

// Export a form
router.post('/export', exportController.exportForm);

// List all exported forms
router.get('/list', exportController.listForms);

// Get a form by ID
router.get('/form/:id', exportController.getFormById);

// Delete a form
router.delete('/form/:id', exportController.deleteForm);

// Download a form
router.get('/download/:id', exportController.downloadForm);

module.exports = router;