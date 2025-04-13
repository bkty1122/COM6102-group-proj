// src/utils/mediaUtils.js

/**
 * Get the media type based on URL or file extension
 * @param {string|Object} media - The media URL string or media object
 * @returns {string|null} - 'image', 'audio', 'video', or null if can't determine
 */
export const getMediaType = (media) => {
    if (!media) return null;
    
    // Extract URL from media object if needed
    let url;
    if (typeof media === 'object' && media !== null) {
      // If it's an S3 media object with a url property
      if (media.url) {
        url = media.url;
      }
      // If it has a type property that's a MIME type (e.g., "image/png")
      else if (media.type && typeof media.type === 'string') {
        const mimeType = media.type.split('/')[0];
        if (['image', 'audio', 'video'].includes(mimeType)) {
          return mimeType;
        }
      }
      else {
        return null;
      }
    } else if (typeof media === 'string') {
      url = media;
    } else {
      return null;
    }
    
    // Ensure url is a string
    url = String(url).toLowerCase();
    
    // Check for image extensions
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i)) {
      return 'image';
    }
    
    // Check for audio extensions
    if (url.match(/\.(mp3|wav|ogg|aac|flac|m4a|wma)$/i)) {
      return 'audio';
    }
    
    // Check for video extensions
    if (url.match(/\.(mp4|webm|mov|avi|wmv|flv|mkv|m4v)$/i)) {
      return 'video';
    }
    
    // Check if URL contains hints about the type
    if (url.includes('/images/') || url.includes('/img/')) {
      return 'image';
    }
    
    if (url.includes('/audio/')) {
      return 'audio';
    }
    
    if (url.includes('/video/') || url.includes('/videos/')) {
      return 'video';
    }
    
    // If we can't determine the type from the URL
    return null;
  };
  
  /**
   * Extract URL from media object or return the URL string
   * @param {string|Object} media - The media URL string or media object
   * @returns {string|null} - The URL or null if not found
   */
  export const extractMediaUrl = (media) => {
    if (!media) return null;
    
    // If it's already a string (URL), return as is
    if (typeof media === 'string') return media;
    
    // If it's an object with a url property, return just the URL
    if (typeof media === 'object' && media !== null && media.url) {
      return media.url;
    }
    
    return null;
  };
  
  /**
   * Get the filename from a URL
   * @param {string} url - The URL string
   * @returns {string} - The filename or empty string if not found
   */
  export const getFilenameFromUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    
    // Remove query parameters
    const urlWithoutParams = url.split('?')[0];
    
    // Get the last part of the path
    return urlWithoutParams.split('/').pop() || '';
  };
  
  /**
   * Check if the URL is a valid media URL
   * @param {string} url - The URL to check
   * @returns {boolean} - True if it's a valid media URL
   */
  export const isValidMediaUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    
    // Basic URL validation
    try {
      new URL(url);
    } catch (e) {
      return false;
    }
    
    return getMediaType(url) !== null;
  };
  
  /**
   * Create HTML element for the media preview based on media type
   * @param {string} url - The media URL
   * @param {Object} options - Additional options like width, height, controls
   * @returns {Object} - React/JSX element configuration
   */
  export const createMediaPreviewConfig = (url, options = {}) => {
    if (!url) return null;
    
    const mediaType = getMediaType(url);
    
    switch (mediaType) {
      case 'image':
        return {
          component: 'img',
          props: {
            src: url,
            alt: options.alt || 'Image',
            style: {
              maxWidth: options.maxWidth || '100%',
              maxHeight: options.maxHeight || 'auto',
              objectFit: options.objectFit || 'contain',
              ...options.style
            }
          }
        };
      
      case 'audio':
        return {
          component: 'audio',
          props: {
            controls: options.controls !== false,
            autoPlay: options.autoPlay || false,
            loop: options.loop || false,
            style: {
              width: options.width || '100%',
              ...options.style
            },
            children: [
              {
                component: 'source',
                props: {
                  src: url,
                  type: options.mimeType || 'audio/mpeg'
                }
              },
              'Your browser does not support the audio element.'
            ]
          }
        };
      
      case 'video':
        return {
          component: 'video',
          props: {
            controls: options.controls !== false,
            autoPlay: options.autoPlay || false,
            muted: options.muted || options.autoPlay || false,
            loop: options.loop || false,
            poster: options.poster || undefined,
            style: {
              width: options.width || '100%',
              maxHeight: options.maxHeight || 'auto',
              ...options.style
            },
            children: [
              {
                component: 'source',
                props: {
                  src: url,
                  type: options.mimeType || 'video/mp4'
                }
              },
              'Your browser does not support the video element.'
            ]
          }
        };
      
      default:
        return null;
    }
  };
  
  export default {
    getMediaType,
    extractMediaUrl,
    getFilenameFromUrl,
    isValidMediaUrl,
    createMediaPreviewConfig
  };