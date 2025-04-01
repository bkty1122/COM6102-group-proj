const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Create a new database or open existing one
const db = new sqlite3.Database('./form_storage.db', (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Read schema SQL
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

// Execute schema SQL to create tables
db.exec(schema, (err) => {
  if (err) {
    console.error('Error creating database schema:', err);
  } else {
    console.log('Database schema created successfully');
  }
  
  // Close the database connection
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
  });
});