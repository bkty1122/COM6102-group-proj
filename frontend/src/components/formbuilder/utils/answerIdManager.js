// Singleton to manage global answer IDs
const AnswerIdManager = {
  nextAvailableId: 0,
  usedIds: new Set(),
  contentRegistry: [], // Tracks all content with their answer IDs
  
  // Find highest answer_id in content object
  _scanForHighestId(obj) {
    if (!obj) return 0;
    let highestId = 0;
    
    // Check if object has an answer_id
    if (obj.answer_id !== undefined && obj.answer_id > highestId) {
      highestId = obj.answer_id;
    }
    
    // Check blanks for fill-in-the-blank type
    if (obj.type === 'fill-in-the-blank' && obj.blanks && Array.isArray(obj.blanks)) {
      obj.blanks.forEach(blank => {
        if (blank.answer_id !== undefined && blank.answer_id > highestId) {
          highestId = blank.answer_id;
        }
      });
    }
    
    // Check options for single-choice
    if (obj.options && Array.isArray(obj.options)) {
      obj.options.forEach(option => {
        if (option.answer_id !== undefined && option.answer_id > highestId) {
          highestId = option.answer_id;
        }
      });
    }
    
    return highestId;
  },
  
  // Register all answer_ids found in an object
  _registerIds(obj) {
    if (!obj) return;
    
    // Register object's own answer_id
    if (obj.answer_id !== undefined) {
      this.usedIds.add(obj.answer_id);
    }
    
    // Register blanks' answer_ids
    if (obj.type === 'fill-in-the-blank' && obj.blanks && Array.isArray(obj.blanks)) {
      obj.blanks.forEach(blank => {
        if (blank.answer_id !== undefined) {
          this.usedIds.add(blank.answer_id);
        }
      });
    }
    
    // Register options' answer_ids
    if (obj.options && Array.isArray(obj.options)) {
      obj.options.forEach(option => {
        if (option.answer_id !== undefined) {
          this.usedIds.add(option.answer_id);
        }
      });
    }
  },
  
  // Initialize with existing content
  initialize: (pages) => {
    // Reset manager state
    AnswerIdManager.nextAvailableId = 0;
    AnswerIdManager.usedIds = new Set();
    AnswerIdManager.contentRegistry = [];
    
    // Initialize by detecting highest ID first
    let highestId = 0;
    
    if (pages && Array.isArray(pages)) {
      pages.forEach(page => {
        // Process card contents structure
        if (page.cardContents) {
          Object.values(page.cardContents).forEach(contentArray => {
            if (Array.isArray(contentArray)) {
              contentArray.forEach(content => {
                // Find highest ID in this content
                const contentHighestId = AnswerIdManager._scanForHighestId(content);
                if (contentHighestId > highestId) {
                  highestId = contentHighestId;
                }
                
                // Register all IDs in this content
                AnswerIdManager._registerIds(content);
              });
            }
          });
        }
        
        // Process cards structure (for backward compatibility)
        if (page.cards && Array.isArray(page.cards)) {
          page.cards.forEach(card => {
            if (card.contents && Array.isArray(card.contents)) {
              card.contents.forEach(content => {
                // Find highest ID in this content
                const contentHighestId = AnswerIdManager._scanForHighestId(content);
                if (contentHighestId > highestId) {
                  highestId = contentHighestId;
                }
                
                // Register all IDs in this content
                AnswerIdManager._registerIds(content);
              });
            }
          });
        }
      });
    }
    
    // Set next available ID to one higher than the highest found
    AnswerIdManager.nextAvailableId = highestId + 1;
    
    return highestId;
  },
  
  // Get the next available answer ID and increment the counter
  getNextId: () => {
    const id = AnswerIdManager.nextAvailableId;
    AnswerIdManager.nextAvailableId += 1;
    AnswerIdManager.usedIds.add(id);
    return id;
  },
  
  // Reserve a specific ID
  reserveId: (id) => {
    if (id === undefined || id === null) return;
    
    const numId = Number(id);
    if (isNaN(numId)) return;
    
    AnswerIdManager.usedIds.add(numId);
    if (numId >= AnswerIdManager.nextAvailableId) {
      AnswerIdManager.nextAvailableId = numId + 1;
    }
  },
  
  // Reset the manager
  reset: () => {
    AnswerIdManager.nextAvailableId = 0;
    AnswerIdManager.usedIds = new Set();
    AnswerIdManager.contentRegistry = [];
  },
  
  // Get current next ID without incrementing
  getCurrentNextId: () => {
    return AnswerIdManager.nextAvailableId;
  },

  // Track all answer_ids in a page's content
  trackPageContent: (page) => {
    if (!page) return;

    // Handle different data structures
    if (page.cardContents) {
      // Process all content in all cards using cardContents structure
      Object.values(page.cardContents).forEach(contentArray => {
        if (!Array.isArray(contentArray)) return;
        
        contentArray.forEach(content => {
          AnswerIdManager._registerIds(content);
        });
      });
    } else if (Array.isArray(page)) {
      // If page is just an array of content
      page.forEach(content => {
        AnswerIdManager._registerIds(content);
      });
    }
  },

  // Check if an answer_id is already in use
  isIdInUse: (id) => {
    return AnswerIdManager.usedIds.has(id);
  },
  
  // Get all used answer_ids (useful for conflict detection)
  getUsedIds: () => {
    return Array.from(AnswerIdManager.usedIds).sort((a, b) => a - b);
  },
  
  // Add a new content item and assign appropriate answer_ids
  addContentItem: (content, position = 0) => {
    if (!content || !content.type) return content;
    
    const contentCopy = JSON.parse(JSON.stringify(content));
    contentCopy.order_id = position;
    
    // Get the current nextId to start from
    let currentNextId = AnswerIdManager.nextAvailableId;
    
    if (contentCopy.type === 'single-choice') {
      // For single-choice, assign ONE answer_id for the entire question and all options
      contentCopy.answer_id = currentNextId;
      
      if (contentCopy.options && Array.isArray(contentCopy.options)) {
        contentCopy.options = contentCopy.options.map((option, index) => ({
          ...option,
          id: index,
          answer_id: currentNextId, // Same ID for all options
          option_value: option.option_value || `Option ${index + 1}`,
          option_image: option.option_image || null,
          option_audio: option.option_audio || null,
          option_video: option.option_video || null
        }));
      } else {
        // Initialize options if none exist
        contentCopy.options = [
          { id: 0, answer_id: currentNextId, option_value: "Option 1", option_image: null, option_audio: null, option_video: null },
          { id: 1, answer_id: currentNextId, option_value: "Option 2", option_image: null, option_audio: null, option_video: null },
          { id: 2, answer_id: currentNextId, option_value: "Option 3", option_image: null, option_audio: null, option_video: null }
        ];
      }
      
      // Register the content
      AnswerIdManager.contentRegistry.push({
        contentId: contentCopy.id,
        type: contentCopy.type,
        assignedId: currentNextId
      });
      
      // Increment nextAvailableId by exactly 1 for single-choice
      AnswerIdManager.nextAvailableId = currentNextId + 1;
      AnswerIdManager.usedIds.add(currentNextId);
    } 
    else if (contentCopy.type === 'fill-in-the-blank') {
      // Extract or create blanks
      if (!contentCopy.blanks || !Array.isArray(contentCopy.blanks) || contentCopy.blanks.length === 0) {
        contentCopy.blanks = [{ id: 0, placeholder: '[blank_1]', correctAnswers: [''] }];
      }
      
      // Parse question to find more blanks if they exist in the text but not in the blanks array
      const blankMatches = (contentCopy.question || '').match(/\[blank_\d+\]/g) || [];
      const existingBlanks = new Set(contentCopy.blanks.map(b => b.placeholder));
      
      // Add any blanks found in the question but not in the blanks array
      blankMatches.forEach(placeholder => {
        if (!existingBlanks.has(placeholder)) {
          contentCopy.blanks.push({
            id: contentCopy.blanks.length,
            placeholder: placeholder,
            correctAnswers: ['']
          });
        }
      });
      
      // Assign sequential answer_ids to each blank, starting from the current nextId
      contentCopy.blanks = contentCopy.blanks.map((blank, index) => {
        const blankAnswerId = currentNextId + index;
        
        // Register the blank
        AnswerIdManager.contentRegistry.push({
          contentId: contentCopy.id,
          type: contentCopy.type,
          blankId: index,
          assignedId: blankAnswerId
        });
        
        AnswerIdManager.usedIds.add(blankAnswerId);
        
        return {
          ...blank,
          id: index,
          answer_id: blankAnswerId,
          placeholder: blank.placeholder || `[blank_${index + 1}]`,
          correctAnswers: blank.correctAnswers || ['']
        };
      });
      
      // Update nextAvailableId to be after the last blank
      AnswerIdManager.nextAvailableId = currentNextId + contentCopy.blanks.length;
    }
    
    return contentCopy;
  },
  
  // Validate and fix any answer_id conflicts in content
  validateContent: (content) => {
    if (!content) return content;
    
    // Make a deep copy to avoid mutation issues
    const contentCopy = JSON.parse(JSON.stringify(content));
    
    if (contentCopy.type === 'fill-in-the-blank' && contentCopy.blanks && Array.isArray(contentCopy.blanks)) {
      const usedIds = new Set();
      let modified = false;
      
      contentCopy.blanks = contentCopy.blanks.map((blank, index) => {
        // If no answer_id or duplicate, assign a new one
        if (blank.answer_id === undefined || usedIds.has(blank.answer_id)) {
          modified = true;
          const newId = AnswerIdManager.getNextId();
          return {
            ...blank,
            id: index,
            answer_id: newId
          };
        }
        
        usedIds.add(blank.answer_id);
        AnswerIdManager.reserveId(blank.answer_id);
        return {
          ...blank,
          id: index // Ensure ID matches index
        };
      });
    } else if (contentCopy.type === 'single-choice') {
      // Ensure options have matching answer_ids
      if (contentCopy.answer_id === undefined) {
        contentCopy.answer_id = AnswerIdManager.getNextId();
      } else {
        AnswerIdManager.reserveId(contentCopy.answer_id);
      }
      
      if (contentCopy.options && Array.isArray(contentCopy.options)) {
        contentCopy.options = contentCopy.options.map((option, index) => ({
          ...option,
          id: index,
          answer_id: contentCopy.answer_id
        }));
      }
    }
    
    return contentCopy;
  },
  
  // Reorganize all answer_ids across multiple pages to be sequential
  reorganizeAllPages: (pages) => {
    if (!pages || !Array.isArray(pages) || pages.length === 0) return pages;
    
    // Reset manager state
    AnswerIdManager.nextAvailableId = 0;
    AnswerIdManager.usedIds = new Set();
    AnswerIdManager.contentRegistry = [];
    
    // Create deep copy to avoid mutation
    const updatedPages = JSON.parse(JSON.stringify(pages));
    
    // First, collect all content from all pages in the correct order
    const allContent = [];
    
    updatedPages.forEach(page => {
      // Sort cards by position
      if (page.cards && Array.isArray(page.cards)) {
        page.cards.sort((a, b) => (a.position || 0) - (b.position || 0));
        
        page.cards.forEach(card => {
          if (card.contents && Array.isArray(card.contents)) {
            // Sort contents by order_id
            card.contents.sort((a, b) => (a.order_id || 0) - (b.order_id || 0));
            
            // Add page and card info to each content for tracking
            const contentsWithInfo = card.contents.map(content => ({
              ...content,
              _pageIndex: page.page_index,
              _cardType: card.card_type,
              _cardPosition: card.position
            }));
            
            allContent.push(...contentsWithInfo);
          }
        });
      }
    });
    
    // Now assign sequential answer_ids to all content
    let nextId = 1; // Start from 1 as is common in your data
    
    // Process all content in order
    allContent.forEach(content => {
      // Store references to locate this content later
      const pageIndex = content._pageIndex;
      const cardType = content._cardType;
      const cardPosition = content._cardPosition;
      const contentId = content.id;
      
      // Clean up tracking properties
      delete content._pageIndex;
      delete content._cardType;
      delete content._cardPosition;
      
      if (content.type === 'single-choice') {
        // Assign a single ID for the whole question
        content.answer_id = nextId;
        
        // Update options
        if (content.options && Array.isArray(content.options)) {
          content.options.forEach(option => {
            option.answer_id = nextId;
          });
        }
        
        // Register this ID
        AnswerIdManager.usedIds.add(nextId);
        nextId++;
      }
      else if (content.type === 'fill-in-the-blank' && content.blanks && Array.isArray(content.blanks)) {
        // Assign sequential IDs to each blank
        content.blanks.forEach(blank => {
          blank.answer_id = nextId;
          AnswerIdManager.usedIds.add(nextId);
          nextId++;
        });
      }
      
      // Find and update this content in the pages structure
      const targetPage = updatedPages.find(p => p.page_index === pageIndex);
      if (targetPage && targetPage.cards) {
        const targetCard = targetPage.cards.find(c => 
          c.card_type === cardType && c.position === cardPosition);
          
        if (targetCard && targetCard.contents) {
          const contentIndex = targetCard.contents.findIndex(c => c.id === contentId);
          if (contentIndex !== -1) {
            targetCard.contents[contentIndex] = content;
          }
        }
      }
    });
    
    // Update manager state
    AnswerIdManager.nextAvailableId = nextId;
    
    return updatedPages;
  }
};

export default AnswerIdManager;