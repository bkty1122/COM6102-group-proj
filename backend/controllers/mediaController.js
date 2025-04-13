const logger = require('../utils/logger');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');

// Initialize S3 client with your specific region
const s3Client = new S3Client({
  region: 'us-east-1', // US East (N. Virginia)
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "AKIA4MTWKVTTTX6ISK72",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "8+i878OKdnSit70BAStnEZiY777Af8t8Akhrleu5",
  }
});

// Your specific bucket name
const BUCKET_NAME = 'lgsmt-media-store';

// List all media files
exports.listMedia = async (req, res, next) => {
  try {
    const { folder = 'root', page = 1, limit = 20, search = '', type = '', continuationToken = null } = req.query;
    
    // Determine the prefix based on folder
    let prefix = '';
    if (folder && folder !== 'root') {
      prefix = `${folder}/`;
    }
    
    // List objects from S3 bucket
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: parseInt(limit),
      // Only use continuation token if explicitly provided
      ContinuationToken: continuationToken || undefined,
      ...(folder === 'root' ? { Delimiter: '/' } : {}) // Use delimiter for root to list only top-level objects
    });
    
    const response = await s3Client.send(command);
    
    // Process S3 files without database metadata
    let mediaFiles = [];
    
    if (folder === 'root') {
      // For root folder, only include files at the root level (not in subfolders)
      mediaFiles = response.Contents ? response.Contents
        .filter(item => !item.Key.includes('/') || item.Key.split('/').length === 1)
        .map(item => {
          const fileType = determineContentType(item.Key);
          return {
            id: item.Key,
            key: item.Key,
            name: path.basename(item.Key),
            size: item.Size,
            type: fileType,
            url: `https://${BUCKET_NAME}.s3.amazonaws.com/${encodeURIComponent(item.Key).replace(/%2F/g, '/')}`,
            lastModified: item.LastModified,
            folder: 'root'  // Use 'root' for root level files
          };
        }) : [];
    } else {
      // For non-root folders, include all files in that folder
      mediaFiles = response.Contents ? response.Contents.map(item => {
        const fileType = determineContentType(item.Key);
        const itemFolder = path.dirname(item.Key);
        return {
          id: item.Key,
          key: item.Key,
          name: path.basename(item.Key),
          size: item.Size,
          type: fileType,
          url: `https://${BUCKET_NAME}.s3.amazonaws.com/${encodeURIComponent(item.Key).replace(/%2F/g, '/')}`,
          lastModified: item.LastModified,
          folder: itemFolder === '.' ? 'root' : itemFolder
        };
      }) : [];
    }
    
    // Apply additional filters (search and type) if provided
    if (search) {
      const searchLower = search.toLowerCase();
      mediaFiles = mediaFiles.filter(file => 
        file.name.toLowerCase().includes(searchLower) || 
        (file.folder && file.folder !== 'root' && file.folder.toLowerCase().includes(searchLower))
      );
    }
    
    if (type && type !== 'all') {
      mediaFiles = mediaFiles.filter(file => {
        if (type === 'image') return file.type.startsWith('image/');
        if (type === 'audio') return file.type.startsWith('audio/');
        if (type === 'video') return file.type.startsWith('video/');
        return true;
      });
    }
    
    // Filter out directory markers (items ending with /)
    mediaFiles = mediaFiles.filter(file => !file.key.endsWith('/'));
    
    // Extract unique folders for the folder dropdown - match exactly what the frontend expects
    const folderSet = new Set();
    
    // Include standard folder options that match the frontend dropdown options exactly
    folderSet.add('root');    // Root folder
    folderSet.add('image');   // Image folder
    folderSet.add('audio');   // Audio folder
    folderSet.add('video');   // Video folder
    
    // Also add any other existing folders found in S3
    mediaFiles.forEach(file => {
      if (file.folder && !file.folder.endsWith('/') && 
          !['root', 'image', 'audio', 'video'].includes(file.folder)) {
        folderSet.add(file.folder);
      }
    });
    
    const folders = Array.from(folderSet).map(folderPath => ({
      path: folderPath,
      name: folderPath === 'root' ? 'Root' : 
            (folderPath === 'image' ? 'Image' :
             folderPath === 'audio' ? 'Audio' :
             folderPath === 'video' ? 'Video' :
             folderPath.split('/').pop() || folderPath)
    }));
    
    // If frontend pagination is used (client-side)
    // We'll calculate pagination info for the frontend
    const total = mediaFiles.length;
    const totalPages = Math.ceil(total / parseInt(limit));
    
    // For client-side pagination, slice the result
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedFiles = mediaFiles.slice(startIndex, endIndex);
    
    res.status(200).json({
      success: true,
      data: paginatedFiles,
      pagination: {
        hasMore: response.IsTruncated || false,
        nextContinuationToken: response.NextContinuationToken || null,
        total: total,
        totalPages: totalPages,
        page: parseInt(page),
        limit: parseInt(limit)
      },
      folders: folders
    });
  } catch (error) {
    logger.error('Error listing media:', error);
    next(error);
  }
};

// Get media details by ID (which is now the S3 key)
exports.getMediaDetails = async (req, res, next) => {
  try {
    const { mediaId } = req.params;
    
    // Get S3 object information directly
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: mediaId
    });
    
    try {
      const s3Response = await s3Client.send(command);
      
      // Extract metadata from S3 object
      const metadata = s3Response.Metadata || {};
      
      // Determine folder, use 'root' for files at the root level (to match frontend)
      const folderPath = path.dirname(mediaId);
      const folder = folderPath === '.' ? 'root' : folderPath;
      
      res.status(200).json({
        success: true,
        data: {
          id: mediaId,
          key: mediaId,
          name: path.basename(mediaId),
          size: s3Response.ContentLength,
          type: s3Response.ContentType || determineContentType(mediaId),
          url: `https://${BUCKET_NAME}.s3.amazonaws.com/${encodeURIComponent(mediaId).replace(/%2F/g, '/')}`,
          lastModified: s3Response.LastModified,
          folder: folder,  // 'root' for root level
          metadata: {
            originalName: metadata.originalname,
            uploadedAt: metadata.uploadedat
          }
        }
      });
    } catch (s3Error) {
      logger.error(`Error getting S3 object for ${mediaId}:`, s3Error);
      return res.status(404).json({
        success: false,
        message: 'Media file not found'
      });
    }
  } catch (error) {
    logger.error(`Error getting media details for ${req.params.mediaId}:`, error);
    next(error);
  }
};

// Upload media file
exports.uploadMedia = async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.file && !req.files) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }
    
    const file = req.file || req.files[0];
    let { folder = 'root', name, type } = req.body;
    
    // Handle the 'custom' folder case from the frontend
    if (folder === 'custom') {
      return res.status(400).json({
        success: false,
        message: 'Please specify a custom folder path instead of "custom"'
      });
    }
    
    // Convert 'root' folder to empty string for S3 path
    if (folder === 'root') {
      folder = '';
    } 
    // If type is provided but no folder, use the type to determine folder
    else if (!folder && type) {
      switch (type) {
        case 'image':
          folder = 'image';
          break;
        case 'audio':
          folder = 'audio';
          break;
        case 'video':
          folder = 'video';
          break;
        default:
          folder = '';  // Default is empty folder (will convert to 'root' later)
          break;
      }
    } 
    // If no folder and no type, determine from mime type
    else if (!folder) {
      const mainType = file.mimetype.split('/')[0];
      if (mainType === 'image') folder = 'image';
      else if (mainType === 'audio') folder = 'audio';
      else if (mainType === 'video') folder = 'video';
      else folder = '';  // Default is empty folder (will convert to 'root' later)
    }
    
    // Clean folder path (remove leading/trailing slashes)
    folder = folder.replace(/^\/+|\/+$/g, '');
    
    // Prepare file key (path in S3)
    const fileName = name || file.originalname;
    const fileKey = folder ? `${folder}/${fileName}` : fileName;
    
    try {
      // Read file as buffer for reliable upload
      const fileBuffer = fs.readFileSync(file.path);
      
      // Use PutObjectCommand for more reliable upload of smaller files
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: file.mimetype,
        ContentDisposition: `inline; filename="${encodeURIComponent(fileName)}"`,
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
          mediaType: type || ''
        }
      });
      
      await s3Client.send(command);
      
      // Clean up temp file
      fs.unlink(file.path, (err) => {
        if (err) logger.error(`Error removing temp file ${file.path}:`, err);
      });
      
      // Convert empty folder back to 'root' for display
      const displayFolder = folder || 'root';
      
      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          id: fileKey, // Use the key as ID
          key: fileKey,
          name: fileName,
          type: file.mimetype,
          size: file.size,
          url: `https://${BUCKET_NAME}.s3.amazonaws.com/${encodeURIComponent(fileKey).replace(/%2F/g, '/')}`,
          folder: displayFolder // Use 'root' for display when folder is empty
        }
      });
    } catch (uploadError) {
      // Clean up temp file if upload fails
      fs.unlink(file.path, (err) => {
        if (err) logger.error(`Error removing temp file ${file.path}:`, err);
      });
      
      logger.error('Error in S3 upload:', uploadError);
      throw uploadError;
    }
  } catch (error) {
    logger.error('Error uploading media:', error);
    next(error);
  }
};

// Delete media file (mediaId is now the S3 key)
exports.deleteMedia = async (req, res, next) => {
  try {
    const { mediaId } = req.params;
    
    // Delete from S3 directly
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: mediaId
    });
    
    await s3Client.send(command);
    
    res.status(200).json({
      success: true,
      message: 'Media file deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting media ${req.params.mediaId}:`, error);
    next(error);
  }
};

// Respond with media file directly from S3
exports.respondMedia = async (req, res, next) => {
  try {
    const { mediaId } = req.params;
    
    // Get the file from S3 directly
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: mediaId
    });
    
    try {
      const s3Response = await s3Client.send(command);
      
      // Set appropriate headers
      res.setHeader('Content-Type', s3Response.ContentType || determineContentType(mediaId));
      if (s3Response.ContentLength) {
        res.setHeader('Content-Length', s3Response.ContentLength);
      }
      
      // Set filename for download
      const filename = path.basename(mediaId);
      const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
      res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(filename)}"`);
      
      // Stream the file directly to the response
      s3Response.Body.pipe(res);
      
    } catch (s3Error) {
      logger.error(`Error getting S3 object for ${mediaId}:`, s3Error);
      return res.status(404).json({
        success: false,
        message: 'File not found in storage'
      });
    }
  } catch (error) {
    logger.error(`Error responding with media ${req.params.mediaId}:`, error);
    next(error);
  }
};

// Access file directly by key (for public access)
exports.respondDirectMedia = async (req, res, next) => {
  try {
    const { fileKey } = req.params;
    
    // Get the file from S3 directly
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey
    });
    
    try {
      const s3Response = await s3Client.send(command);
      
      // Set appropriate headers
      res.setHeader('Content-Type', s3Response.ContentType || determineContentType(fileKey));
      if (s3Response.ContentLength) {
        res.setHeader('Content-Length', s3Response.ContentLength);
      }
      
      // Set filename for download
      const filename = path.basename(fileKey);
      const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
      res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(filename)}"`);
      
      // Stream the file directly to the response
      s3Response.Body.pipe(res);
      
    } catch (s3Error) {
      logger.error(`Error getting S3 object for ${fileKey}:`, s3Error);
      return res.status(404).json({
        success: false,
        message: 'File not found in storage'
      });
    }
  } catch (error) {
    logger.error(`Error responding with media ${req.params.fileKey}:`, error);
    next(error);
  }
};

// Helper function to determine content type based on file extension
function determineContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.json': 'application/json'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}