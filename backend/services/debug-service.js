// services/debug-service.js
const fs = require('fs');
const path = require('path');

class DebugService {
  constructor(debugEnabled = false, debugDir = null) {
    this.debugEnabled = debugEnabled;
    this.debugDir = debugDir || path.join(__dirname, '../logs/form-service');
  }

  async debugExport(data, operation, id) {
    if (!this.debugEnabled) return;
    
    try {
      // Create debug directory if it doesn't exist
      if (!fs.existsSync(this.debugDir)) {
        fs.mkdirSync(this.debugDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
      const filename = path.join(this.debugDir, `${operation}-${id || 'unknown'}-${timestamp}.json`);
      
      fs.writeFileSync(filename, JSON.stringify(data, null, 2));
      console.log(`[DEBUG] Exported ${operation} data to ${filename}`);
    } catch (error) {
      console.error('Error exporting debug data:', error);
    }
  }
}

module.exports = DebugService;