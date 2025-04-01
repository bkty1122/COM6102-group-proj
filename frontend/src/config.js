// /workspaces/COM6102-group-proj/frontend/src/config.js
// Environment-specific configuration
const config = {
    // API URLs
    api: {
      baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
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
    }
  };
  
  export default config;