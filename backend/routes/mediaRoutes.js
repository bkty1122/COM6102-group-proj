const express = require('express');
const mediaController = require('../controllers/mediaController');
// const auth = require('../middleware/auth'); // Uncomment to use auth

const router = express.Router();

// List all media files
router.get('/', mediaController.listMedia);

// Get media details by ID
router.get('/:mediaId', mediaController.getMediaDetails);

// Upload media file
router.post('/upload', mediaController.uploadMedia);

// Delete media file
router.delete('/:mediaId', mediaController.deleteMedia);

module.exports = router;