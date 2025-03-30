// test-real-data.js
const fs = require('fs');
const path = require('path');
const FormProcessingService = require('../models/form-processing-service');

// Load your real form data
function loadRealData() {
  try {
    // Replace with path to your actual data file
    const dataPath = path.join(__dirname, 'real-data.json');
    const jsonData = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(jsonData);
  } catch (err) {
    console.error('Error loading real data:', err);
    process.exit(1);
  }
}

async function testWithRealData() {
  console.log('Starting real data import test...');
  
  // Initialize service
  const service = new FormProcessingService();
  
  try {
    // 1. Load real data
    const formData = loadRealData();
    console.log(`Loaded form: ${formData.title}`);
    console.log(`Form contains ${formData.pages.length} pages`);
    
    // 2. Process the form
    console.log('Processing form data...');
    const result = await service.processForm(formData);
    console.log(`Form processed successfully with ID: ${result.questionbankId}`);
    
    // 3. Retrieve the processed form
    console.log('Retrieving form...');
    const retrievedForm = await service.getQuestionBankById(result.questionbankId);
    
    // 4. Save the retrieved form for verification
    const outputPath = path.join(__dirname, 'retrieved-real-form.json');
    fs.writeFileSync(outputPath, JSON.stringify(retrievedForm, null, 2));
    console.log(`Retrieved form saved to: ${outputPath}`);
    
    // 5. Simple verification
    console.log('\nVerification:');
    console.log(`Original title: ${formData.title}`);
    console.log(`Retrieved title: ${retrievedForm.title}`);
    console.log(`Original page count: ${formData.pages.length}`);
    console.log(`Retrieved page count: ${retrievedForm.pages.length}`);
    
    const firstPageCardCount = formData.pages[0].cards.length;
    const retrievedFirstPageCardCount = retrievedForm.pages[0].cards.length;
    console.log(`First page original card count: ${firstPageCardCount}`);
    console.log(`First page retrieved card count: ${retrievedFirstPageCardCount}`);
    
    // Close the database connection
    await service.close();
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    
    // Close the database connection on error
    await service.close();
  }
}

// Run the test
testWithRealData();