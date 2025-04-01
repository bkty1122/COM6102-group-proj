// test-export-question-bank.js
const path = require('path');
const fs = require('fs');
const FormProcessingService = require('./models/form-processing-service');

// Database path
const dbPath = path.join(__dirname, 'form_storage.db');

// ID of the question bank to export
const questionBankId = 'c6d3ac69-738d-418c-bd63-0dc133d4bde9';

// Output directory for the exported JSON
const outputDir = path.join(__dirname, 'exports');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Create a new instance of the form processing service
const formService = new FormProcessingService(dbPath);

/**
 * Format a question bank object for better readability
 */
function formatQuestionBank(questionBank) {
  if (!questionBank) return null;
  
  const formatted = {
    ...questionBank,
    pages: questionBank.pages.map(page => ({
      ...page,
      cards: page.cards.map(card => ({
        ...card,
        contents: card.contents.map(content => {
          // Special handling for JSON fields
          const formattedContent = { ...content };
          
          // Convert JSON objects back to pretty strings for better display
          if (content.options && typeof content.options !== 'string') {
            formattedContent.options = JSON.stringify(content.options, null, 2);
          }
          if (content.blanks && typeof content.blanks !== 'string') {
            formattedContent.blanks = JSON.stringify(content.blanks, null, 2);
          }
          if (content.correctAnswers && typeof content.correctAnswers !== 'string') {
            formattedContent.correctAnswers = JSON.stringify(content.correctAnswers, null, 2);
          }
          if (content.media && typeof content.media !== 'string') {
            formattedContent.media = JSON.stringify(content.media, null, 2);
          }
          if (content.settings && typeof content.settings !== 'string') {
            formattedContent.settings = JSON.stringify(content.settings, null, 2);
          }
          if (content.sessionSettings && typeof content.sessionSettings !== 'string') {
            formattedContent.sessionSettings = JSON.stringify(content.sessionSettings, null, 2);
          }
          if (content.questionSpecificSettings && typeof content.questionSpecificSettings !== 'string') {
            formattedContent.questionSpecificSettings = JSON.stringify(content.questionSpecificSettings, null, 2);
          }
          
          return formattedContent;
        })
      }))
    }))
  };
  
  return formatted;
}

/**
 * Export a single question bank by ID
 */
async function exportQuestionBank(id) {
  console.log(`Exporting question bank: ${id}`);
  
  try {
    // Fetch the question bank data
    const questionBank = await formService.getQuestionBankById(id);
    
    if (!questionBank) {
      console.error(`Question bank with ID ${id} not found`);
      return;
    }
    
    // Format the question bank for better readability
    const formatted = formatQuestionBank(questionBank);
    
    // Create the output filename
    const outputPath = path.join(outputDir, `question-bank-${id}.json`);
    
    // Write the data to a JSON file
    fs.writeFileSync(outputPath, JSON.stringify(formatted, null, 2));
    
    console.log(`Question bank exported to: ${outputPath}`);
    
    // Also create a minified version
    const minifiedPath = path.join(outputDir, `question-bank-${id}.min.json`);
    fs.writeFileSync(minifiedPath, JSON.stringify(questionBank));
    
    console.log(`Minified version exported to: ${minifiedPath}`);
    
    // Create a summary file with just the metadata
    const summary = {
      id: id,
      title: questionBank.title,
      exportDate: questionBank.exportDate,
      pageCount: questionBank.pages.length,
      totalCards: questionBank.pages.reduce((sum, page) => sum + page.cards.length, 0),
      totalContents: questionBank.pages.reduce((sum, page) => {
        return sum + page.cards.reduce((cardSum, card) => cardSum + card.contents.length, 0);
      }, 0)
    };
    
    const summaryPath = path.join(outputDir, `question-bank-${id}-summary.json`);
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log(`Summary exported to: ${summaryPath}`);
    
    return {
      success: true,
      id: id,
      outputPath,
      minifiedPath,
      summaryPath
    };
  } catch (error) {
    console.error('Error exporting question bank:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create a REST API-like response
 */
function createApiResponse(data) {
  if (!data) {
    return {
      success: false,
      error: 'No data returned'
    };
  }
  
  if (!data.success) {
    return {
      success: false,
      error: data.error
    };
  }
  
  return {
    success: true,
    data: {
      id: data.id,
      files: {
        full: data.outputPath,
        minified: data.minifiedPath,
        summary: data.summaryPath
      }
    }
  };
}

/**
 * Main function to run the test
 */
async function runTest() {
  console.log('Starting export test...');
  console.log(`Database path: ${dbPath}`);
  console.log(`Question bank ID: ${questionBankId}`);
  
  try {
    // Export the question bank
    const result = await exportQuestionBank(questionBankId);
    
    // Create an API-like response
    const apiResponse = createApiResponse(result);
    
    // Save the API response
    const apiResponsePath = path.join(outputDir, `api-response-${questionBankId}.json`);
    fs.writeFileSync(apiResponsePath, JSON.stringify(apiResponse, null, 2));
    
    console.log('\nTest completed successfully!');
    console.log('API response saved to:', apiResponsePath);
    
    // Log the API response
    console.log('\nAPI Response:');
    console.log(JSON.stringify(apiResponse, null, 2));
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Close the database connection
    await formService.close();
  }
}

// Run the test
runTest();