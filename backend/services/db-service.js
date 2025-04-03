// services/db-service.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseService {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Could not connect to database:', err);
          reject(err);
        } else {
          console.log(`Connected to database at ${this.dbPath}`);
          
          // Enable foreign keys for data integrity
          this.db.run('PRAGMA foreign_keys = ON');
          
          // Configure for optimal performance
          this.db.run('PRAGMA journal_mode = WAL');  // Write-Ahead Logging for better concurrency
          this.db.run('PRAGMA synchronous = NORMAL'); // Moderate durability/performance balance
          this.db.run('PRAGMA cache_size = 10000');  // Increase cache size for better performance
          
          resolve(this.db);
        }
      });
    });
  }

  // Helper for running SQL queries as promises
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Error running SQL:', err);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }
  
  // Helper for getting a single row
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, result) => {
        if (err) {
          console.error('Error running SQL:', err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
  
  // Helper for getting multiple rows
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Error running SQL:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
  
  // Execute multiple SQL statements
  exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          console.error('Error executing SQL:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Prepare statement for repeated use
  prepareStatement(sql) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(sql, (err) => {
        if (err) {
          console.error('Error preparing statement:', err);
          reject(err);
        } else {
          resolve(stmt);
        }
      });
    });
  }

  // Run batch operations
  async batchRun(sql, paramsList) {
    try {
      const stmt = await this.prepareStatement(sql);
      
      for (const params of paramsList) {
        await new Promise((resolve, reject) => {
          stmt.run(params, function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ id: this.lastID, changes: this.changes });
            }
          });
        });
      }
      
      await new Promise((resolve, reject) => {
        stmt.finalize(err => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      return true;
    } catch (error) {
      console.error('Error in batch operation:', error);
      throw error;
    }
  }

  // Enhanced close method
  async close() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(); // Already closed or never opened
        return;
      }
      
      this.db.close(err => {
        if (err) {
          console.error('Error closing database:', err);
          reject(err);
        } else {
          console.log('Database connection closed');
          this.db = null; // Clear the reference
          resolve();
        }
      });
    });
  }
}

module.exports = DatabaseService;