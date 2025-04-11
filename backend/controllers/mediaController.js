const { getPool } = require('../db/dbService');
const logger = require('../utils/logger');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');

// Initialize S3 client with your specific region
const s3Client = new S3Client({
  region: 'us-east-1', // US East (N. Virginia)
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Your specific bucket name
const BUCKET_NAME = 'lgsmt-media-store';

// List all media files
exports.listMedia = async (req, res, next) => {
  try {
    const { folder = '', page = 1, limit = 20 } = req.query;
    const prefix = folder ? `${folder}/` : '';
    
    // List objects from S3 bucket
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: limit,
      ContinuationToken: page > 1 ? `page-${page}` : undefined
    });
    
    const response = await s3Client.send(command);
    
    // Also get database metadata for these files
    const pool = getPool();
    const fileKeys = response.Contents ? response.Contents.map(item => item.Key) : [];
    
    let mediaMetadata = [];
    if (fileKeys.length > 0) {
      const result = await pool.query(
        'SELECT * FROM media_files WHERE file_key = ANY($1)',
        [fileKeys]
      );
      mediaMetadata = result.rows;
    }
    
    // Combine S3 data with database metadata
    const mediaFiles = response.Contents ? response.Contents.map(item => {
      const metadata = mediaMetadata.find(meta => meta.file_key === item.Key) || {};
      return {
        id: metadata.id || item.Key,
        key: item.Key,
        name: metadata.name || path.basename(item.Key),
        size: item.Size,
        type: metadata.mime_type || 'application/octet-stream',
        url: `https://${BUCKET_NAME}.s3.amazonaws.com/${item.Key}`,
        lastModified: item.LastModified,
        folder: path.dirname(item.Key) === '.' ? '' : path.dirname(item.Key),
        metadata: metadata
      };
    }) : [];
    
    res.status(200).json({
      success: true,
      data: mediaFiles,
      pagination: {
        hasMore: response.IsTruncated || false,
        nextToken: response.NextContinuationToken || null,
        total: response.KeyCount || 0,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Error listing media:', error);
    next(error);
  }
};

// Get media details by ID
exports.getMediaDetails = async (req, res, next) => {
  try {
    const { mediaId } = req.params;
    const pool = getPool();
    
    // Get metadata from database
    const result = await pool.query(
      'SELECT * FROM media_files WHERE id = $1',
      [mediaId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Media file not found'
      });
    }
    
    const fileMetadata = result.rows[0];
    
    // Get S3 object information
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileMetadata.file_key
    });
    
    try {
      const s3Response = await s3Client.send(command);
      
      res.status(200).json({
        success: true,
        data: {
          id: fileMetadata.id,
          key: fileMetadata.file_key,
          name: fileMetadata.name,
          size: s3Response.ContentLength,
          type: fileMetadata.mime_type || s3Response.ContentType,
          url: `https://${BUCKET_NAME}.s3.amazonaws.com/${fileMetadata.file_key}`,
          lastModified: s3Response.LastModified,
          folder: path.dirname(fileMetadata.file_key) === '.' ? '' : path.dirname(fileMetadata.file_key),
          metadata: fileMetadata
        }
      });
    } catch (s3Error) {
      logger.error(`Error getting S3 object for ${fileMetadata.file_key}:`, s3Error);
      
      // Return database info even if S3 object is unavailable
      res.status(200).json({
        success: true,
        data: {
          id: fileMetadata.id,
          key: fileMetadata.file_key,
          name: fileMetadata.name,
          type: fileMetadata.mime_type,
          url: `https://${BUCKET_NAME}.s3.amazonaws.com/${fileMetadata.file_key}`,
          metadata: fileMetadata,
          s3Error: 'Could not retrieve object from S3'
        }
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
    const { folder = '', name } = req.body;
    
    // Generate unique file ID
    const fileId = uuidv4();
    
    // Prepare file key (path in S3)
    const fileName = name || file.originalname;
    const fileKey = folder ? `${folder}/${fileName}` : fileName;
    
    // Upload to S3
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: fs.createReadStream(file.path),
        ContentType: file.mimetype
      }
    });
    
    const uploadResult = await upload.done();
    
    // Save metadata to database
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO media_files (
        id, file_key, name, mime_type, folder, size, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
      [
        fileId,
        fileKey,
        fileName,
        file.mimetype,
        folder,
        file.size
      ]
    );
    
    const mediaFile = result.rows[0];
    
    // Clean up temp file if it exists
    if (file.path) {
      fs.unlink(file.path, (err) => {
        if (err) logger.error(`Error removing temp file ${file.path}:`, err);
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: mediaFile.id,
        key: mediaFile.file_key,
        name: mediaFile.name,
        type: mediaFile.mime_type,
        size: mediaFile.size,
        url: `https://${BUCKET_NAME}.s3.amazonaws.com/${mediaFile.file_key}`,
        folder: mediaFile.folder
      }
    });
  } catch (error) {
    logger.error('Error uploading media:', error);
    
    // Clean up temp file if it exists and there was an error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) logger.error(`Error removing temp file ${req.file.path}:`, err);
      });
    }
    
    next(error);
  }
};

// Delete media file
exports.deleteMedia = async (req, res, next) => {
  try {
    const { mediaId } = req.params;
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Get file info
      const result = await client.query(
        'SELECT * FROM media_files WHERE id = $1',
        [mediaId]
      );
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Media file not found'
        });
      }
      
      const fileData = result.rows[0];
      
      // Delete from S3
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileData.file_key
      });
      
      await s3Client.send(command);
      
      // Delete from database
      await client.query(
        'DELETE FROM media_files WHERE id = $1',
        [mediaId]
      );
      
      // Commit transaction
      await client.query('COMMIT');
      
      res.status(200).json({
        success: true,
        message: 'Media file deleted successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error in delete transaction for media ${mediaId}:`, error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error(`Error deleting media ${req.params.mediaId}:`, error);
    next(error);
  }
};