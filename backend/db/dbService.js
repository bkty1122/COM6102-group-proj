const { Pool } = require('pg');
const config = require('../config');
const logger = require('../utils/logger');

// Use singleton pattern for database connection pool
let pool = null;

// Initialize and get the database pool
const getPool = () => {
  if (pool) return pool;
  
  try {
    // Create a new pool using configuration
    pool = new Pool(config.dbConfig);
    
    // Add error handler for pool
    pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });
    
    logger.info('PostgreSQL connection pool established');
    return pool;
  } catch (error) {
    logger.error('PostgreSQL connection error:', error);
    throw error;
  }
};

// Get database client with common query methods
const getDb = async () => {
  const pool = getPool();
  
  // Return an object with database methods
  return {
    // Query that returns all rows
    query: async (text, params = []) => {
      const result = await pool.query(text, params);
      return result;
    },
    
    // Query that returns all rows
    all: async (text, params = []) => {
      const result = await pool.query(text, params);
      return result.rows;
    },
    
    // Query that returns a single row
    get: async (text, params = []) => {
      const result = await pool.query(text, params);
      return result.rows[0] || null;
    },
    
    // Execute a query and return basic info
    run: async (text, params = []) => {
      const result = await pool.query(text, params);
      return {
        rowCount: result.rowCount,
        rows: result.rows
      };
    }
  };
};

// Close the pool (useful for testing or cleanup)
const closeDb = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection closed');
  }
};

module.exports = {
  getPool,
  getDb,
  closeDb
};