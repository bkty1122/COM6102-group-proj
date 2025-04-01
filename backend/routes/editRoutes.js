// routes/editRoutes.js
const express = require('express');
const editController = require('../controllers/editController');
const router = express.Router();

// Get a form for editing
router.get('/forms/:id/edit', editController.getFormForEdit);

// Update form metadata
router.patch('/forms/:id/metadata', editController.updateFormMetadata);

// Update page metadata
router.patch('/forms/:id/pages/:pageIndex/metadata', editController.updatePageMetadata);

// Add a new page
router.post('/forms/:id/pages', editController.addPage);

// Delete a page
router.delete('/forms/:id/pages/:pageIndex', editController.deletePage);

// Add a card to a page
router.post('/forms/:id/pages/:pageIndex/cards', editController.addCard);

// Delete a card from a page
router.delete('/forms/:id/pages/:pageIndex/cards/:cardPosition', editController.deleteCard);

// Add content to a card
router.post('/forms/:id/pages/:pageIndex/cards/:cardPosition/content', editController.addCardContent);

// Update card content
router.put('/forms/:id/content/:contentId', editController.updateCardContent);

// Delete card content
router.delete('/forms/:id/content/:contentId', editController.deleteCardContent);

module.exports = router;