// db/dbService.js
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

// Use singleton pattern for database connection
let db = null;

const getDb = async () => {
  if (db) return db;
  
  try {
    db = await open({
      filename: path.resolve(config.dbPath),
      driver: sqlite3.Database
    });
    
    logger.info('Database connection established');
    return db;
  } catch (error) {
    logger.error('Database connection error:', error);
    throw error;
  }
};

module.exports = {
  getDb
};