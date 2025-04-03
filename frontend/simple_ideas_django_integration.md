# Hybrid Data Storage Implementation for Question Bank System

I'll design a hybrid RDBMS/JSONB storage solution based on your requirements. This approach balances structured table organization with the flexibility needed for varying question types.

## Database Schema Design

### 1. Question Bank (Main Table)

```sql
CREATE TABLE question_banks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionbank_id VARCHAR(36) NOT NULL UNIQUE,  -- UUID format
    title VARCHAR(255) NOT NULL,
    description TEXT,
    export_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'draft',  -- draft, published, archived
    author_id INTEGER,
    version INTEGER DEFAULT 1
);
```

### 2. Pages Metadata Table

```sql
CREATE TABLE question_bank_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionbank_id VARCHAR(36) NOT NULL,
    page_index INTEGER NOT NULL,
    exam_language VARCHAR(10),
    exam_type VARCHAR(50),
    component VARCHAR(50),
    category VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (questionbank_id) REFERENCES question_banks(questionbank_id),
    UNIQUE (questionbank_id, page_index)
);
```

### 3. Cards Table (Parent for both card types)

```sql
CREATE TABLE cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id INTEGER NOT NULL,
    card_type VARCHAR(20) NOT NULL,  -- 'question' or 'material'
    position INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (page_id) REFERENCES question_bank_pages(id),
    UNIQUE (page_id, position)
);
```

### 4. Structured Question Tables

#### 4.1 Single Choice Questions

```sql
CREATE TABLE single_choice_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id VARCHAR(100) NOT NULL UNIQUE,  -- Original frontend ID
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer_id INTEGER,
    correct_answer TEXT,
    instruction TEXT,
    difficulty VARCHAR(20),
    marks INTEGER DEFAULT 1,
    options_data TEXT,  -- JSONB in PostgreSQL, TEXT with JSON in SQLite
    media_data TEXT,    -- JSONB in PostgreSQL, TEXT with JSON in SQLite
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id),
    UNIQUE (card_id, order_id)
);
```

#### 4.2 Multiple Choice Questions

```sql
CREATE TABLE multiple_choice_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id VARCHAR(100) NOT NULL UNIQUE,
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer_id INTEGER,
    instruction TEXT,
    difficulty VARCHAR(20),
    marks INTEGER DEFAULT 1,
    options_data TEXT,  -- JSONB for options array
    correct_answers TEXT,  -- JSONB for correct answers array
    media_data TEXT,    -- JSONB for media objects
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id),
    UNIQUE (card_id, order_id)
);
```

#### 4.3 Fill in the Blank Questions

```sql
CREATE TABLE fill_in_blank_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id VARCHAR(100) NOT NULL UNIQUE,
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    instruction TEXT,
    difficulty VARCHAR(20),
    blanks_data TEXT,  -- JSONB for blanks array
    media_data TEXT,   -- JSONB for media objects
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id),
    UNIQUE (card_id, order_id)
);
```

#### 4.4 Matching Questions

```sql
CREATE TABLE matching_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id VARCHAR(100) NOT NULL UNIQUE,
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    instruction TEXT,
    difficulty VARCHAR(20),
    options_data TEXT,  -- JSONB for matching options (renamed from blanks)
    media_data TEXT,    -- JSONB for media objects
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id),
    UNIQUE (card_id, order_id)
);
```

#### 4.5 Long Text Questions

```sql
CREATE TABLE long_text_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id VARCHAR(100) NOT NULL UNIQUE,
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    instruction TEXT,
    difficulty VARCHAR(20),
    placeholder TEXT,
    rows INTEGER DEFAULT 4,
    suggested_answer TEXT,
    marks INTEGER DEFAULT 1,
    media_data TEXT,  -- JSONB for media objects
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id),
    UNIQUE (card_id, order_id)
);
```

#### 4.6 Audio Response Questions

```sql
CREATE TABLE audio_response_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id VARCHAR(100) NOT NULL UNIQUE,
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    instruction TEXT,
    difficulty VARCHAR(20),
    max_seconds INTEGER DEFAULT 60,
    marks INTEGER DEFAULT 1,
    allow_rerecording BOOLEAN DEFAULT 1,
    allow_pause BOOLEAN DEFAULT 1,
    show_timer BOOLEAN DEFAULT 1,
    media_data TEXT,  -- JSONB for media objects
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id),
    UNIQUE (card_id, order_id)
);
```

### 5. Material Tables

#### 5.1 Text Material

```sql
CREATE TABLE text_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id VARCHAR(100) NOT NULL UNIQUE,
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    title TEXT,
    content TEXT,
    show_title BOOLEAN DEFAULT 1,
    title_style VARCHAR(10) DEFAULT 'h2',
    is_rich_text BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id),
    UNIQUE (card_id, order_id)
);
```

#### 5.2 Multimedia Material

```sql
CREATE TABLE multimedia_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id VARCHAR(100) NOT NULL UNIQUE,
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    title TEXT,
    show_title BOOLEAN DEFAULT 1,
    title_style VARCHAR(10) DEFAULT 'h2',
    media_type VARCHAR(20),  -- image, audio, video
    media_data TEXT,  -- JSONB for media object
    settings_data TEXT,  -- JSONB for display settings
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id),
    UNIQUE (card_id, order_id)
);
```

### 6. Special Case Tables (for LLM-related content)

#### 6.1 LLM Session Material

```sql
CREATE TABLE llm_session_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id VARCHAR(100) NOT NULL UNIQUE,
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    title TEXT,
    show_title BOOLEAN DEFAULT 1,
    title_style VARCHAR(10) DEFAULT 'h2',
    session_settings TEXT,  -- JSONB for complex session configuration
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id),
    UNIQUE (card_id, order_id)
);
```

#### 6.2 LLM Audio Response Questions

```sql
CREATE TABLE llm_audio_response_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id VARCHAR(100) NOT NULL UNIQUE,
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    instruction TEXT,
    difficulty VARCHAR(20),
    max_seconds INTEGER DEFAULT 60,
    marks INTEGER DEFAULT 1,
    allow_rerecording BOOLEAN DEFAULT 1,
    allow_pause BOOLEAN DEFAULT 1,
    show_timer BOOLEAN DEFAULT 1,
    number_of_questions INTEGER DEFAULT 1,
    llm_session_type VARCHAR(50),
    linked_llm_session_id VARCHAR(100),
    question_specific_settings TEXT,  -- JSONB for per-question settings
    media_data TEXT,  -- JSONB for media objects
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id),
    UNIQUE (card_id, order_id)
);
```

## Data Processing Flow

Here's how data will flow from the frontend JSON to the database:

1. **Main Form Data Processing**:
   - Generate UUID for `questionbank_id`
   - Insert basic info into `question_banks` table
   - Process each page and store in `question_bank_pages`

2. **Card Processing**:
   - For each page, create card entries in `cards` table with correct `card_type` and `position`

3. **Content Processing**:
   - Process each content item in each card
   - Store in the appropriate table based on `type`
   - Use JSONB (or JSON in SQLite text fields) for complex nested data

4. **Special Field Handling**:
   - Convert `blanks` to `options_data` for matching questions
   - Extract media objects into the `media_data` field
   - Store options arrays in `options_data` field

## Implementation Example (Node.js with SQLite)

```javascript
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const db = new sqlite3.Database('./questionbank.db');

// Process form submission from frontend
async function processQuestionBank(formData) {
  const questionbankId = uuidv4();
  
  // Start a transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    try {
      // 1. Insert main question bank record
      db.run(
        `INSERT INTO question_banks (questionbank_id, title, export_date, description) 
         VALUES (?, ?, ?, ?)`,
        [
          questionbankId,
          formData.title || 'Untitled Question Bank',
          formData.exportDate || new Date().toISOString(),
          formData.description || ''
        ]
      );
      
      // 2. Process each page
      if (Array.isArray(formData.pages)) {
        formData.pages.forEach(page => {
          // Insert page metadata
          let pageId;
          
          db.run(
            `INSERT INTO question_bank_pages 
             (questionbank_id, page_index, exam_language, exam_type, component, category) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              questionbankId,
              page.page_index || 0,
              page.exam_categories?.exam_language || page.exam_language || 'en',
              page.exam_categories?.exam_type || '',
              page.exam_categories?.component || '',
              page.exam_categories?.category || ''
            ],
            function(err) {
              if (err) {
                console.error("Error inserting page:", err);
                return;
              }
              
              pageId = this.lastID;
              
              // 3. Process each card on the page
              if (Array.isArray(page.cards)) {
                page.cards.forEach(card => {
                  let cardId;
                  
                  // Insert card
                  db.run(
                    `INSERT INTO cards (page_id, card_type, position) VALUES (?, ?, ?)`,
                    [pageId, card.card_type, card.position || 0],
                    function(err) {
                      if (err) {
                        console.error("Error inserting card:", err);
                        return;
                      }
                      
                      cardId = this.lastID;
                      
                      // 4. Process each content item in the card
                      if (Array.isArray(card.contents)) {
                        processCardContents(cardId, card.contents);
                      }
                    }
                  );
                });
              }
            }
          );
        });
      }
      
      db.run('COMMIT');
      return { success: true, questionbankId };
      
    } catch (error) {
      db.run('ROLLBACK');
      console.error("Transaction failed:", error);
      return { success: false, error };
    }
  });
}

// Process content items within a card
function processCardContents(cardId, contents) {
  if (!Array.isArray(contents)) return;
  
  contents.forEach(content => {
    const contentType = content.type;
    
    // Process by content type
    switch (contentType) {
      case 'single-choice':
        processSingleChoiceQuestion(cardId, content);
        break;
        
      case 'multiple-choice':
        processMultipleChoiceQuestion(cardId, content);
        break;
        
      case 'fill-in-the-blank':
        processFillInBlankQuestion(cardId, content);
        break;
        
      case 'matching':
        processMatchingQuestion(cardId, content);
        break;
        
      case 'long-text':
        processLongTextQuestion(cardId, content);
        break;
        
      case 'audio':
        processAudioResponseQuestion(cardId, content);
        break;
        
      case 'text-material':
        processTextMaterial(cardId, content);
        break;
        
      case 'multimedia-material':
        processMultimediaMaterial(cardId, content);
        break;
        
      case 'llm-session-material':
        processLlmSessionMaterial(cardId, content);
        break;
        
      case 'llm-audio-response':
        processLlmAudioResponseQuestion(cardId, content);
        break;
        
      default:
        console.warn(`Unknown content type: ${contentType}`);
    }
  });
}

// Process a single-choice question
function processSingleChoiceQuestion(cardId, content) {
  // Extract media data
  const mediaData = JSON.stringify({
    question_image: content.question_image,
    question_audio: content.question_audio,
    question_video: content.question_video
  });
  
  // Options data serialization
  const optionsData = JSON.stringify(content.options || []);
  
  db.run(
    `INSERT INTO single_choice_questions 
     (content_id, card_id, order_id, question, answer_id, correct_answer, 
      instruction, difficulty, marks, options_data, media_data) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      content.id,
      cardId,
      content.order_id || 0,
      content.question || '',
      content.answer_id,
      content.correctAnswer || '',
      content.instruction || '',
      content.difficulty || 'medium',
      content.marks || 1,
      optionsData,
      mediaData
    ],
    function(err) {
      if (err) {
        console.error("Error inserting single choice question:", err);
      }
    }
  );
}

// Process a matching question (using options_data instead of blanks)
function processMatchingQuestion(cardId, content) {
  // Extract media data
  const mediaData = JSON.stringify({
    question_image: content.question_image,
    question_audio: content.question_audio,
    question_video: content.question_video
  });
  
  // Convert blanks to options_data for standardization
  const optionsData = JSON.stringify(content.blanks || content.options || []);
  
  db.run(
    `INSERT INTO matching_questions 
     (content_id, card_id, order_id, question, instruction, difficulty, 
      options_data, media_data) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      content.id,
      cardId,
      content.order_id || 0,
      content.question || '',
      content.instruction || '',
      content.difficulty || 'medium',
      optionsData,
      mediaData
    ],
    function(err) {
      if (err) {
        console.error("Error inserting matching question:", err);
      }
    }
  );
}

// Additional processing functions for other content types would follow the same pattern
```

## Reading and Reconstructing the Data

When retrieving the data to send back to the frontend, you'll need to reconstruct the JSON structure:

```javascript
async function getQuestionBankById(questionbankId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM question_banks WHERE questionbank_id = ?',
      [questionbankId],
      (err, questionBank) => {
        if (err) return reject(err);
        if (!questionBank) return resolve(null);
        
        // Build the complete structure with pages, cards, and contents
        buildCompleteQuestionBank(questionBank)
          .then(completeData => resolve(completeData))
          .catch(error => reject(error));
      }
    );
  });
}

async function buildCompleteQuestionBank(questionBank) {
  // Get all pages for this question bank
  const pages = await getPages(questionBank.questionbank_id);
  
  // For each page, get its cards
  for (let i = 0; i < pages.length; i++) {
    const cards = await getCards(pages[i].id);
    
    // For each card, get its contents
    for (let j = 0; j < cards.length; j++) {
      const contents = await getCardContents(cards[j].id, cards[j].card_type);
      cards[j].contents = contents;
    }
    
    pages[i].cards = cards;
    
    // Reconstruct exam_categories from fields
    pages[i].exam_categories = {
      exam_language: pages[i].exam_language,
      exam_type: pages[i].exam_type,
      component: pages[i].component,
      category: pages[i].category
    };
  }
  
  // Construct the final object
  return {
    title: questionBank.title,
    exportDate: questionBank.export_date,
    pages: pages
  };
}

// Other support functions for building the complete data structure
```

## Handling Special Cases (LLM Components)

For LLM-related components, which have more unique structures, you'll want dedicated processing:

```javascript
function processLlmSessionMaterial(cardId, content) {
  db.run(
    `INSERT INTO llm_session_materials 
     (content_id, card_id, order_id, title, show_title, title_style, session_settings) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      content.id,
      cardId,
      content.order_id || 0,
      content.title || '',
      content.showTitle ? 1 : 0,
      content.titleStyle || 'h2',
      JSON.stringify(content.sessionSettings || {})
    ],
    function(err) {
      if (err) {
        console.error("Error inserting LLM session material:", err);
      }
    }
  );
}
```

## Conclusion

This hybrid approach gives you:

1. **Structured metadata** in relational tables for efficient filtering and querying
2. **Flexible JSON storage** for complex nested structures that vary by question type
3. **Standardized naming conventions** matching industry practice
4. **Special handling** for unique component types like LLM sessions
5. **Migration path** from `blanks` to `options_data` in matching questions

The design maintains both data integrity through relational constraints and flexibility through JSON storage of variable structures. When using with SQLite, the JSON will be stored as text, but the code will handle serialization and deserialization appropriately. When migrating to PostgreSQL, you can use native JSONB fields for better performance and query capabilities.