// src/config.js
// Environment-specific configuration
const config = {
  // API URLs
  api: {
    baseUrl: 'http://localhost:5000/api', // GitHub Codespaces URL, change base on the server config
  },
  
  // Authentication
  auth: {
    tokenKey: 'authToken',
    storageType: 'localStorage', // or 'sessionStorage'
  },
  
  // Feature flags
  features: {
    enableExports: true,
    enableImports: true,
  },
  
  // Timeouts
  timeouts: {
    apiRequest: 10000, // 10 seconds
  },
  
  // Development mode flag
  useLocalJson: process.env.REACT_APP_USE_LOCAL_JSON === 'true'
};

export default config;