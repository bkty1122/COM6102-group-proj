// services/fieldService.js

// Default data structure in case the API fails or for reset
const DEFAULT_LINKED_FIELDS = {
  // Previous default data structure
};

// API endpoints
const API_ENDPOINT = '/api/examFieldRelationship.json';
const API_UPDATE_ENDPOINT = '/api/updateExamFieldRelationship';

/**
 * Fetch linked fields from the API
 * @param {boolean} useDefault - Whether to return the default data instead of fetching
 * @returns {Promise<Object>} - The linked fields data
 */
export const fetchLinkedFields = async (useDefault = false) => {
  if (useDefault) {
    return DEFAULT_LINKED_FIELDS;
  }

  try {
    // Use absolute path for fetch in development
    const response = await fetch(process.env.NODE_ENV === 'development' 
      ? '/src/api/examFieldRelationship.json'
      : API_ENDPOINT);
    
    // If the response is not OK, throw an error
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching linked fields:", error);
    
    // Return default data if the API fails
    return DEFAULT_LINKED_FIELDS;
  }
};

/**
 * Save linked fields to the API
 * @param {Object} data - The linked fields data to save
 * @returns {Promise<Object>} - The response from the API
 */
export const saveLinkedFields = async (data) => {
  try {
    // For development environments, use a special endpoint or mock
    if (process.env.NODE_ENV === 'development') {
      // In a real app, this would be a proper API endpoint
      const response = await fetch(API_UPDATE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } else {
      // Production API call
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    }
  } catch (error) {
    console.error("Error saving linked fields:", error);
    // For development - store in localStorage to persist changes during development
    localStorage.setItem('linkedFieldsConfig', JSON.stringify(data));
    throw error;
  }
};