const express = require('express');
const mediaController = require('../controllers/mediaController');
const multer = require('multer');
// const auth = require('../middleware/auth'); // Uncomment to use auth

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = express.Router();

// List all media files
router.get('/', mediaController.listMedia);

// Get media details by ID
router.get('/:mediaId', mediaController.getMediaDetails);

// Upload media file
router.post('/upload', upload.single('file'), mediaController.uploadMedia);

// Delete media file
router.delete('/:mediaId', mediaController.deleteMedia);

// Serve media files directly (for authenticated/controlled access)
router.get('/file/:mediaId', mediaController.respondMedia);

// Direct file access by key (for public files)
router.get('/direct/:fileKey(*)', mediaController.respondDirectMedia);

module.exports = router;