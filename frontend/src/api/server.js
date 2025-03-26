// server.js (Express server)
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());

// API endpoint to save the exam field relationship data
app.post('/api/exam-fields', (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }
    
    // Path to the JSON file
    const filePath = path.join(__dirname, 'frontend', 'src', 'api', 'examFieldRelationship.json');
    
    // Write the data to the file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    
    return res.status(200).json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error saving data:', error);
    return res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});