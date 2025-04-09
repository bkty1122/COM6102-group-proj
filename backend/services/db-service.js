const { Pool } = require('pg');

class DatabaseService {
  constructor(dbConfig) {
    this.dbConfig = dbConfig;
    this.pool = null;
    this.init();
  }

  init() {
    try {
      this.pool = new Pool(this.dbConfig);
      
      // Set up error handler for the pool
      this.pool.on('error', (err) => {
        console.error('Unexpected error on idle PostgreSQL client', err);
      });
      
      console.log(`Connected to PostgreSQL database at ${this.dbConfig.host}/${this.dbConfig.database}`);
    } catch (error) {
      console.error('Could not create database connection pool:', error);
      throw error;
    }
  }

  // Helper for running SQL queries as promises
  async query(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return result;
    } catch (error) {
      console.error('Error running SQL:', error);
      throw error;
    }
  }
  
  // Helper for running SQL that modifies data (INSERT, UPDATE, DELETE)
  async run(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return {
        id: result.rows[0]?.id, // If RETURNING id is used
        changes: result.rowCount // Number of rows affected
      };
    } catch (error) {
      console.error('Error running SQL:', error);
      throw error;
    }
  }
  
  // Helper for getting a single row
  async get(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error running SQL:', error);
      throw error;
    }
  }
  
  // Helper for getting multiple rows
  async all(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows;
    } catch (error) {
      console.error('Error running SQL:', error);
      throw error;
    }
  }
  
  // Execute multiple SQL statements
  async exec(sql) {
    const client = await this.pool.connect();
    try {
      await client.query(sql);
      return true;
    } catch (error) {
      console.error('Error executing SQL:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Run batch operations - in PostgreSQL we can use a transaction
  async batchRun(sql, paramsList) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const params of paramsList) {
        await client.query(sql, params);
      }
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in batch operation:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get a client for transaction operations
  async getClient() {
    return await this.pool.connect();
  }

  // Transaction helpers
  async beginTransaction(client) {
    await client.query('BEGIN');
  }

  async commitTransaction(client) {
    await client.query('COMMIT');
  }

  async rollbackTransaction(client) {
    await client.query('ROLLBACK');
  }

  // Enhanced close method
  async close() {
    try {
      if (this.pool) {
        await this.pool.end();
        console.log('Database connection pool closed');
        this.pool = null;
      }
    } catch (error) {
      console.error('Error closing database pool:', error);
      throw error;
    }
  }
}

module.exports = DatabaseService;