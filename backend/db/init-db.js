const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Create database configuration from environment or config file
const config = require('../config'); // Adjust path as needed

// Create a connection pool
const pool = new Pool(config.dbConfig);

async function initDatabase() {
  let client;
  
  try {
    // Connect to the database
    client = await pool.connect();
    console.log('Connected to PostgreSQL database');
    
    // Read schema SQL
    const schema = fs.readFileSync(path.join(__dirname, 'postgres_schema.sql'), 'utf8');
    
    // Execute schema SQL to create tables
    await client.query(schema);
    console.log('Database schema created successfully');
    
  } catch (err) {
    console.error('Error creating database schema:', err);
    process.exit(1);
  } finally {
    // Release the client back to the pool
    if (client) {
      client.release();
    }
    
    // Close the pool
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the initialization
initDatabase();