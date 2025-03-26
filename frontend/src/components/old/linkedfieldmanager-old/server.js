// server.js
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Serve the API directory
app.use('/src', express.static(path.join(__dirname, 'frontend/src')));

// Update the JSON file
app.post('/api/updateExamFieldRelationship', (req, res) => {
  try {
    const data = req.body;
    const filePath = path.join(__dirname, 'frontend/src/api/examFieldRelationship.json');
    
    // Write the updated data to the file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    
    res.status(200).json({ success: true, message: 'File updated successfully' });
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ success: false, message: 'Error updating file' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});