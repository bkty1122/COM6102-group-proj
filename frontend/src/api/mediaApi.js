// src/api/mediaApi.js
import apiClient from './apiClient';

/**
 * List all media files from the S3 bucket
 * @param {Object} params - Query parameters (folder, page, limit, etc.)
 * @returns {Promise} - Promise with media list response
 */
const listMedia = async (params = {}) => {
  try {
    const response = await apiClient.get('/media', { params });
    // Return the data as is without restructuring
    return response.data;
  } catch (error) {
    console.error('Error listing media:', error);
    return {
      success: false,
      message: error.message || 'Failed to load media',
      data: [] // Ensure we always return an array for data
    };
  }
};

/**
 * Upload file to S3 bucket
 * @param {File} file - The file to upload
 * @param {Object} metadata - File metadata (name, type, folder, etc.)
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise} - Promise with upload response
 */
const uploadMedia = async (file, metadata = {}, onProgress = () => {}) => {
  try {
    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Add metadata
    Object.keys(metadata).forEach(key => {
      if (metadata[key] !== undefined) {
        formData.append(key, metadata[key]);
      }
    });
    
    // Configure request with progress tracking
    const config = {
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      },
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    
    const response = await apiClient.post('/media/upload', formData, config);
    return response.data;
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
};

/**
 * Delete media from S3 bucket
 * @param {string} mediaId - ID of the media to delete
 * @returns {Promise} - Promise with delete response
 */
const deleteMedia = async (mediaId) => {
  try {
    const response = await apiClient.delete(`/media/${mediaId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting media ${mediaId}:`, error);
    throw error;
  }
};

/**
 * Get media details
 * @param {string} mediaId - ID of the media
 * @returns {Promise} - Promise with media details
 */
const getMediaDetails = async (mediaId) => {
  try {
    const response = await apiClient.get(`/media/${mediaId}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting media details for ${mediaId}:`, error);
    throw error;
  }
};

/**
 * Get direct URL for media file
 * @param {string} mediaId - ID of the media
 * @param {boolean} download - Whether to force download
 * @returns {string} - Direct URL to the media file
 */
const getMediaFileUrl = (mediaId, download = false) => {
  return `${apiClient.defaults.baseURL}/media/file/${mediaId}${download ? '?download=true' : ''}`;
};

/**
 * Get direct URL for media file by key
 * @param {string} fileKey - S3 key of the media file
 * @param {boolean} download - Whether to force download
 * @returns {string} - Direct URL to the media file
 */
const getDirectFileUrl = (fileKey, download = false) => {
  return `${apiClient.defaults.baseURL}/media/direct/${encodeURIComponent(fileKey)}${download ? '?download=true' : ''}`;
};

export const mediaApi = {
  listMedia,
  uploadMedia,
  deleteMedia,
  getMediaDetails,
  getMediaFileUrl,
  getDirectFileUrl
};

export default mediaApi;