const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = 'http://localhost:3000/api';
const SPEAKING_TEST_PATH = path.join(__dirname, 'test-data', 'speaking-test.json');
const READING_TEST_PATH = path.join(__dirname, 'test-data', 'reading-test.json');

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper to log with timestamps
const log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

// Helper to write results to file
const writeResultToFile = (filename, data) => {
  fs.writeFileSync(
    path.join(__dirname, filename),
    JSON.stringify(data, null, 2)
  );
  log(`Results saved to ${filename}`);
};

// Check if objects have the same structure
const compareStructure = (orig, retrieved) => {
  // Simple tests for high-level structure
  const tests = [
    { name: 'Has title', test: () => typeof retrieved.title === typeof orig.title },
    { name: 'Has pages array', test: () => Array.isArray(retrieved.pages) && Array.isArray(orig.pages) },
    { name: 'Same page count', test: () => retrieved.pages.length === orig.pages.length },
    { name: 'Pages have cards', test: () => retrieved.pages.every(p => Array.isArray(p.cards)) },
    { name: 'First page has same cards count', test: () => retrieved.pages[0].cards.length === orig.pages[0].cards.length },
    { name: 'Has exam categories', test: () => retrieved.pages[0].exam_categories && orig.pages[0].exam_categories },
    { name: 'Cards have contents', test: () => retrieved.pages[0].cards[0].contents && orig.pages[0].cards[0].contents },
    { name: 'First card contents match count', test: () => retrieved.pages[0].cards[0].contents.length === orig.pages[0].cards[0].contents.length },
  ];
  
  const results = tests.map(t => ({ ...t, passed: t.test() }));
  const allPassed = results.every(r => r.passed);
  
  return { results, allPassed };
};

// Test comparing original and retrieved data more thoroughly
const verifyDataIntegrity = (orig, retrieved) => {
  // Check basic structure first
  const structureCheck = compareStructure(orig, retrieved);
  if (!structureCheck.allPassed) {
    return { passed: false, issues: structureCheck.results.filter(r => !r.passed).map(r => r.name) };
  }
  
  // More detailed comparisons
  const issues = [];
  
  // Check pages
  for (let i = 0; i < orig.pages.length; i++) {
    const origPage = orig.pages[i];
    const retrievedPage = retrieved.pages[i];
    
    // Check page index
    if (origPage.page_index !== retrievedPage.page_index) {
      issues.push(`Page ${i} index mismatch: ${origPage.page_index} vs ${retrievedPage.page_index}`);
    }
    
    // Check exam categories
    const origCategories = origPage.exam_categories;
    const retrievedCategories = retrievedPage.exam_categories;
    
    if (origCategories.exam_language !== retrievedCategories.exam_language) {
      issues.push(`Page ${i} exam language mismatch`);
    }
    
    if (origCategories.exam_type !== retrievedCategories.exam_type) {
      issues.push(`Page ${i} exam type mismatch`);
    }
    
    if (origCategories.component !== retrievedCategories.component) {
      issues.push(`Page ${i} component mismatch`);
    }
    
    // Check card counts match
    if (origPage.cards.length !== retrievedPage.cards.length) {
      issues.push(`Page ${i} card count mismatch: ${origPage.cards.length} vs ${retrievedPage.cards.length}`);
      continue;
    }
    
    // Check each card
    for (let j = 0; j < origPage.cards.length; j++) {
      const origCard = origPage.cards[j];
      const retrievedCard = retrievedPage.cards[j];
      
      // Check card type
      if (origCard.card_type !== retrievedCard.card_type) {
        issues.push(`Page ${i} Card ${j} type mismatch: ${origCard.card_type} vs ${retrievedCard.card_type}`);
      }
      
      // Check position
      if (origCard.position !== retrievedCard.position) {
        issues.push(`Page ${i} Card ${j} position mismatch: ${origCard.position} vs ${retrievedCard.position}`);
      }
      
      // Check content counts match
      if (origCard.contents.length !== retrievedCard.contents.length) {
        issues.push(`Page ${i} Card ${j} content count mismatch: ${origCard.contents.length} vs ${retrievedCard.contents.length}`);
        continue;
      }
      
      // Check first content item
      if (origCard.contents.length > 0) {
        const origFirstContent = origCard.contents[0];
        const retrievedFirstContent = retrievedCard.contents[0];
        
        if (origFirstContent.id !== retrievedFirstContent.id) {
          issues.push(`Page ${i} Card ${j} first content ID mismatch`);
        }
        
        if (origFirstContent.type !== retrievedFirstContent.type) {
          issues.push(`Page ${i} Card ${j} first content type mismatch`);
        }
      }
    }
  }
  
  return { 
    passed: issues.length === 0,
    issues
  };
};

// Main test function
const runTest = async () => {
  try {
    log('Starting SQLite JSON storage test...');
    
    // Load test data
    log('Loading test data...');
    let speakingTestData, readingTestData;
    
    try {
      speakingTestData = JSON.parse(fs.readFileSync(SPEAKING_TEST_PATH, 'utf8'));
      log('Speaking test data loaded successfully');
    } catch (err) {
      log('Error loading speaking test data. Using minimal test data instead.');
      speakingTestData = {
        title: "Test Speaking Form",
        exportDate: new Date().toISOString(),
        pages: [{
          page_index: 1,
          exam_categories: {
            exam_language: "en",
            exam_type: "test",
            component: "speaking",
            category: "test"
          },
          cards: [{
            card_type: "question",
            position: 0,
            contents: [{
              id: "test-content-1",
              type: "audio",
              order_id: 0,
              question: "Test question",
              instruction: "Test instruction"
            }]
          }]
        }]
      };
    }
    
    try {
      readingTestData = JSON.parse(fs.readFileSync(READING_TEST_PATH, 'utf8'));
      log('Reading test data loaded successfully');
    } catch (err) {
      log('Error loading reading test data. Using minimal test data instead.');
      readingTestData = {
        title: "Test Reading Form",
        exportDate: new Date().toISOString(),
        pages: [{
          page_index: 1,
          exam_categories: {
            exam_language: "en",
            exam_type: "test",
            component: "reading",
            category: "test"
          },
          cards: [{
            card_type: "material",
            position: 0,
            contents: [{
              id: "test-content-2",
              type: "text-material",
              order_id: 0,
              title: "Test material",
              content: "Test content"
            }]
          }]
        }]
      };
    }
    
    // Step 1: Health Check
    log('Checking API health...');
    try {
      // Health endpoint is at the root, not under /api
      const healthResponse = await axios.get('http://localhost:3000/health');
      log('Health check passed: ' + healthResponse.data.message);
    } catch (error) {
      log('Health check failed. Please make sure the server is running.');
      log('Error: ' + (error.response?.data?.message || error.message));
      process.exit(1);
    }
    
    // Step 2: Create forms
    log('Creating speaking test form...');
    let speakingFormId;
    try {
      const speakingResponse = await api.post('/forms', speakingTestData);
      speakingFormId = speakingResponse.data.data.questionbankId;
      log(`Speaking form created with ID: ${speakingFormId}`);
    } catch (error) {
      log('Error creating speaking form:');
      log(error.response?.data?.message || error.message);
      process.exit(1);
    }
    
    log('Creating reading test form...');
    let readingFormId;
    try {
      const readingResponse = await api.post('/forms', readingTestData);
      readingFormId = readingResponse.data.data.questionbankId;
      log(`Reading form created with ID: ${readingFormId}`);
    } catch (error) {
      log('Error creating reading form:');
      log(error.response?.data?.message || error.message);
      process.exit(1);
    }
    
    // Step 3: Get all forms
    log('Getting all forms...');
    try {
      const allFormsResponse = await api.get('/forms');
      const allForms = allFormsResponse.data.data;
      log(`Retrieved ${allForms.length} forms`);
    } catch (error) {
      log('Error getting all forms:');
      log(error.response?.data?.message || error.message);
    }
    
    // Step 4: Get speaking form by ID
    log(`Getting speaking form with ID: ${speakingFormId}...`);
    let retrievedSpeakingForm;
    try {
      const speakingResponse = await api.get(`/forms/${speakingFormId}`);
      retrievedSpeakingForm = speakingResponse.data.data;
      writeResultToFile('retrieved-speaking.json', retrievedSpeakingForm);
      log('Speaking form retrieved and saved to file');
    } catch (error) {
      log('Error getting speaking form:');
      log(error.response?.data?.message || error.message);
      process.exit(1);
    }
    
    // Step 5: Get reading form by ID
    log(`Getting reading form with ID: ${readingFormId}...`);
    let retrievedReadingForm;
    try {
      const readingResponse = await api.get(`/forms/${readingFormId}`);
      retrievedReadingForm = readingResponse.data.data;
      writeResultToFile('retrieved-reading.json', retrievedReadingForm);
      log('Reading form retrieved and saved to file');
    } catch (error) {
      log('Error getting reading form:');
      log(error.response?.data?.message || error.message);
      process.exit(1);
    }
    
    // Step 6: Verify data integrity
    log('Verifying data integrity for speaking form...');
    const speakingIntegrityResult = verifyDataIntegrity(speakingTestData, retrievedSpeakingForm);
    
    if (speakingIntegrityResult.passed) {
      log('✅ Speaking form data integrity check PASSED');
    } else {
      log('❌ Speaking form data integrity check FAILED');
      log('Issues found:');
      speakingIntegrityResult.issues.forEach(issue => log(`- ${issue}`));
    }
    
    log('Verifying data integrity for reading form...');
    const readingIntegrityResult = verifyDataIntegrity(readingTestData, retrievedReadingForm);
    
    if (readingIntegrityResult.passed) {
      log('✅ Reading form data integrity check PASSED');
    } else {
      log('❌ Reading form data integrity check FAILED');
      log('Issues found:');
      readingIntegrityResult.issues.forEach(issue => log(`- ${issue}`));
    }
    
    // Step 7: Save test results
    const testResults = {
      timestamp: new Date().toISOString(),
      speakingFormId,
      readingFormId,
      speakingIntegrityPassed: speakingIntegrityResult.passed,
      readingIntegrityPassed: readingIntegrityResult.passed,
      speakingIssues: speakingIntegrityResult.issues,
      readingIssues: readingIntegrityResult.issues,
      overall: speakingIntegrityResult.passed && readingIntegrityResult.passed
    };
    
    writeResultToFile('test-results.json', testResults);
    
    // Final results
    log('Test completed.');
    
    if (testResults.overall) {
      log('✅ ALL TESTS PASSED - SQLite JSONB mock storage is working correctly');
    } else {
      log('❌ SOME TESTS FAILED - See test-results.json for details');
    }
    
  } catch (error) {
    log('Unexpected error during test:');
    console.error(error);
  }
};

// Run the test
runTest();