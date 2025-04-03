// src/config.js
// Environment-specific configuration
const config = {
  // API URLs
  api: {
    baseUrl: 'https://literate-space-enigma-qgpq7xrqx94f45g7-5000.app.github.dev/api', // GitHub Codespaces URL, change base on the server config
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