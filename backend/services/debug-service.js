const fs = require('fs');
const path = require('path');

class DebugService {
  constructor(debugEnabled = false, debugDir = null) {
    this.debugEnabled = debugEnabled;
    this.debugDir = debugDir || path.join(__dirname, '../logs/form-service');
  }

  /**
   * Export data for debugging purposes
   * @param {Object} data - Data to export
   * @param {string} operation - Operation type (e.g., 'input-form', 'result-form')
   * @param {string} id - Identifier for the operation
   * @returns {Promise<boolean>} - Success status
   */
  async debugExport(data, operation, id) {
    if (!this.debugEnabled) return false;
    
    try {
      // Create debug directory if it doesn't exist
      if (!fs.existsSync(this.debugDir)) {
        fs.mkdirSync(this.debugDir, { recursive: true });
      }
      
      // Sanitize the id for filename safety
      const safeId = id ? String(id).replace(/[^a-zA-Z0-9-_]/g, '_') : 'unknown';
      
      // Create a timestamped filename
      const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
      const filename = path.join(this.debugDir, `${operation}-${safeId}-${timestamp}.json`);
      
      // Convert circular structures to strings for safe serialization
      const sanitizedData = this.sanitizeDataForExport(data);
      
      // Write to file asynchronously
      await fs.promises.writeFile(filename, JSON.stringify(sanitizedData, null, 2));
      
      console.log(`[DEBUG] Exported ${operation} data to ${filename}`);
      return true;
    } catch (error) {
      console.error('Error exporting debug data:', error);
      return false;
    }
  }
  
  /**
   * Sanitize data for export, handling circular references
   * @param {Object} data - Data to sanitize
   * @returns {Object} - Sanitized data
   */
  sanitizeDataForExport(data) {
    // Handle database clients and pools that might be part of the data
    const seen = new WeakSet();
    
    return JSON.parse(JSON.stringify(data, (key, value) => {
      // Skip functions and null values
      if (typeof value === 'function' || value === null) {
        return undefined;
      }
      
      // Handle PostgreSQL objects
      if (key === 'pool' || key === 'client' || key === 'db') {
        return '[Database Connection Object]';
      }
      
      // Handle circular references
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      
      return value;
    }));
  }
}

module.exports = DebugService;