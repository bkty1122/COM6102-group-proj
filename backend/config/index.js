// config/index.js
module.exports = {
  port: process.env.PORT || 5000,
  dbConfig: {
    host: process.env.DB_HOST || 'database-3.cluster-cnsi2eiu4jpg.ap-southeast-2.rds.amazonaws.com',
    database: process.env.DB_NAME || 'lgsmt',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Qv2oK0GEJdwQOFPeaNy1',
    port: process.env.DB_PORT || 5432
  },
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