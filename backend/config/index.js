// config/index.js
module.exports = {
    port: process.env.PORT || 5000,
    dbPath: process.env.DB_PATH || './db/form_storage.db',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    environment: process.env.NODE_ENV || 'development',
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    },
    timeouts: {
      apiRequest: parseInt(process.env.API_TIMEOUT) || 30000
    }
  };