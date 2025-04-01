// Updated apiClient.js
import axios from 'axios';
import config from '../config';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: config.api.baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: config.timeouts.apiRequest,
});

export default apiClient;

// Rest of the file remains the same