// save-real-json.js
const fs = require('fs');
const path = require('path');

// Parse the JSON from your form export
const formData = JSON.parse(fs.readFileSync(path.join(__dirname, 'form-export-2025-03-30(speaking).json'), 'utf8'));

// Save it to the expected location for the test
fs.writeFileSync(
  path.join(__dirname, 'real-data.json'),
  JSON.stringify(formData, null, 2)
);

console.log('Real form data saved to real-data.json');