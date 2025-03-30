// export-to-excel.js
const sqlite3 = require('sqlite3').verbose();
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Database path
const dbPath = path.join(__dirname, 'form_storage.db');

// Output directory for Excel files
const outputDir = path.join(__dirname, 'exports');

// Make sure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Connect to the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(`Error connecting to database at ${dbPath}:`, err);
    process.exit(1);
  }
  console.log(`Connected to database at ${dbPath}`);
});

// Get all table names
function getAllTables() {
  return new Promise((resolve, reject) => {
    const query = `SELECT name FROM sqlite_master 
                   WHERE type='table' AND name NOT LIKE 'sqlite_%'`;
                   
    db.all(query, [], (err, tables) => {
      if (err) {
        reject(err);
        return;
      }
      
      resolve(tables.map(t => t.name));
    });
  });
}

// Get all data from a table
function getTableData(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      resolve({
        tableName,
        data: rows
      });
    });
  });
}

// Get table schema information
function getTableSchema(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, [], (err, columns) => {
      if (err) {
        reject(err);
        return;
      }
      
      resolve({
        tableName,
        columns: columns.map(col => ({
          name: col.name,
          type: col.type,
          primaryKey: col.pk === 1,
          notNull: col.notnull === 1
        }))
      });
    });
  });
}

// Get foreign key information
function getTableForeignKeys(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA foreign_key_list(${tableName})`, [], (err, foreignKeys) => {
      if (err) {
        reject(err);
        return;
      }
      
      resolve({
        tableName,
        foreignKeys: foreignKeys.map(fk => ({
          id: fk.id,
          seq: fk.seq,
          table: fk.table,
          from: fk.from,
          to: fk.to,
          onUpdate: fk.on_update,
          onDelete: fk.on_delete,
          match: fk.match
        }))
      });
    });
  });
}

// Process JSON data in appropriate tables
function processJsonColumns(data, schema) {
  // List of columns that contain JSON data
  const jsonColumns = ['options_data', 'media_data', 'blanks_data', 'correct_answers', 
                      'settings_data', 'session_settings', 'question_specific_settings'];
  
  // Process each row
  data.forEach(row => {
    // Process JSON columns if they exist in this row
    Object.keys(row).forEach(key => {
      if (jsonColumns.includes(key) && row[key]) {
        try {
          // Parse the JSON and then stringify with formatting for better readability
          const parsed = JSON.parse(row[key]);
          row[key] = JSON.stringify(parsed, null, 2);
        } catch (e) {
          console.warn(`Error parsing JSON in ${key} column:`, e.message);
        }
      }
    });
  });
  
  return data;
}

// Create an Excel workbook and export all tables
async function exportAllTablesToExcel() {
  try {
    // Get all table names
    const tables = await getAllTables();
    console.log(`Found ${tables.length} tables: ${tables.join(', ')}`);
    
    // Create a workbook with multiple sheets
    const workbook = XLSX.utils.book_new();
    
    // Add a summary sheet
    const summaryData = [
      ['Database Export Summary'],
      ['Export Date', new Date().toISOString()],
      ['Database Path', dbPath],
      [''],
      ['Table Name', 'Row Count']
    ];
    
    // Schema workbook for detailed analysis
    const schemaWorkbook = XLSX.utils.book_new();
    const schemaData = [
      ['Table Name', 'Column Name', 'Data Type', 'Primary Key', 'Not Null']
    ];
    
    // Foreign keys workbook
    const relationshipsWorkbook = XLSX.utils.book_new();
    const relationshipsData = [
      ['Table Name', 'Column', 'References Table', 'References Column']
    ];
    
    // Create an individual Excel file for each table
    for (const tableName of tables) {
      try {
        // Get both schema and data
        const schema = await getTableSchema(tableName);
        const { data } = await getTableData(tableName);
        const { foreignKeys } = await getTableForeignKeys(tableName);
        
        // Process JSON columns
        const processedData = processJsonColumns(data, schema);
        
        // Add table row count to summary
        summaryData.push([tableName, data.length]);
        
        // Add schema information
        schema.columns.forEach(col => {
          schemaData.push([
            tableName,
            col.name,
            col.type,
            col.primaryKey ? 'Yes' : 'No',
            col.notNull ? 'Yes' : 'No'
          ]);
        });
        
        // Add foreign key information
        foreignKeys.forEach(fk => {
          relationshipsData.push([
            tableName,
            fk.from,
            fk.table,
            fk.to
          ]);
        });
        
        // Create a worksheet for this table in combined workbook
        const worksheet = XLSX.utils.json_to_sheet(processedData);
        
        // Adjust column widths to make JSON content readable
        const colWidths = [];
        if (processedData.length > 0) {
          const firstRow = processedData[0];
          Object.keys(firstRow).forEach(key => {
            // Auto-determine column width based on data and header
            const maxLen = Math.max(
              key.length,
              ...processedData.map(row => 
                typeof row[key] === 'string' ? row[key].length : String(row[key]).length
              )
            );
            colWidths.push({ wch: Math.min(maxLen, 100) }); // Cap at 100 characters
          });
        }
        
        // Add worksheet to combined workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, tableName.substring(0, 31)); // Excel has a 31 char limit for sheet names
        
        // Create individual Excel file for this table
        const tableWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(tableWorkbook, worksheet, 'Data');
        
        // Save individual table file
        const tableFilePath = path.join(outputDir, `${tableName}.xlsx`);
        XLSX.writeFile(tableWorkbook, tableFilePath);
        console.log(`Exported table ${tableName} to ${tableFilePath}`);
      } catch (error) {
        console.error(`Error exporting table ${tableName}:`, error);
      }
    }
    
    // Add summary sheet to main workbook
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Add schema sheet to schema workbook
    const schemaSheet = XLSX.utils.aoa_to_sheet(schemaData);
    XLSX.utils.book_append_sheet(schemaWorkbook, schemaSheet, 'Schema');
    
    // Add relationships sheet to relationships workbook
    const relationshipsSheet = XLSX.utils.aoa_to_sheet(relationshipsData);
    XLSX.utils.book_append_sheet(relationshipsWorkbook, relationshipsSheet, 'Relationships');
    
    // Save the combined workbook
    const allTablesFilePath = path.join(outputDir, 'all_tables.xlsx');
    XLSX.writeFile(workbook, allTablesFilePath);
    console.log(`Exported all tables to ${allTablesFilePath}`);
    
    // Save the schema workbook
    const schemaFilePath = path.join(outputDir, 'schema.xlsx');
    XLSX.writeFile(schemaWorkbook, schemaFilePath);
    console.log(`Exported schema information to ${schemaFilePath}`);
    
    // Save the relationships workbook
    const relationshipsFilePath = path.join(outputDir, 'relationships.xlsx');
    XLSX.writeFile(relationshipsWorkbook, relationshipsFilePath);
    console.log(`Exported relationship information to ${relationshipsFilePath}`);
    
    console.log(`All exports completed successfully!`);
  } catch (error) {
    console.error('Error exporting tables:', error);
  } finally {
    // Close the database connection
    db.close();
  }
}

// Execute the export
exportAllTablesToExcel();