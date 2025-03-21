// src/components/formbuilder/hooks/useFormBuilder.js
import { useState, useEffect } from "react";
import AnswerIdManager from '../utils/answerIdManager';

export default function useFormBuilder() {
  const [pages, setPages] = useState([
    { id: 1, cards: [], cardContents: {} }, // Each page starts with no cards
  ]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Initialize the AnswerIdManager when the hook is first used
  useEffect(() => {
    // Initialize with empty pages
    AnswerIdManager.initialize(pages);
    console.log(`AnswerIdManager initialized with nextAvailableId: ${AnswerIdManager.getCurrentNextId()}`);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log("Current page state:", pages[currentPage]);
    console.log("Current next answer ID:", AnswerIdManager.getCurrentNextId());
  }, [pages, currentPage]);

  // Add a new page - immutably
  const addPage = () => {
    setPages(prevPages => [
      ...prevPages,
      { id: prevPages.length + 1, cards: [], cardContents: {} }
    ]);
    setCurrentPage(pages.length);
  };

  // Delete the current page - immutably
  const deletePage = () => {
    if (pages.length > 1) {
      setPages(prevPages => prevPages.filter((_, index) => index !== currentPage));
      setCurrentPage(prev => (prev > 0 ? prev - 1 : 0));
    }
  };

  // Add a card to the current page - fully immutable
  const addCard = (type) => {
    // Ensure we're using the most recent state when checking conditions
    setPages(prevPages => {
      const currentPageData = prevPages[currentPage] || { cards: [], cardContents: {} };
      const currentCards = currentPageData.cards || [];
      
      // Allow adding the card if:
      // 1. We don't already have this type (no duplicates)
      // 2. We have fewer than 2 cards total
      const alreadyHasType = currentCards.includes(type);
      const hasMaxCards = currentCards.length >= 2;
      
      // If we already have this type or have reached max cards, don't add it
      if (alreadyHasType || hasMaxCards) {
        console.log("Cannot add card:", 
          alreadyHasType ? "Card type already exists" : "Max cards reached");
        return prevPages; // Return original state if conditions aren't met
      }
      
      console.log("Adding card of type:", type);
      
      // Create a fully immutable update with map
      return prevPages.map((page, index) => {
        if (index !== currentPage) return page; // Leave other pages unchanged
        
        // Create a new page object with updated cards array
        return {
          ...page,
          cards: [...page.cards, type],
          cardContents: {
            ...page.cardContents,
            [type]: [] // Initialize empty array for this card type
          }
        };
      });
    });
  };

  const removeCardContent = (cardType, contentId) => {
    setPages(prevPages => {
      return prevPages.map((page, index) => {
        if (index !== currentPage) return page; // Leave other pages unchanged
        
        // Skip if this card type doesn't exist or has no contents
        if (!page.cardContents[cardType]) return page;
        
        // Filter out the content with the matching ID
        const updatedContents = page.cardContents[cardType].filter(
          content => content.id !== contentId
        );
        
        // Return new page object with updated cardContents
        return {
          ...page,
          cardContents: {
            ...page.cardContents,
            [cardType]: updatedContents
          }
        };
      });
    });
  };

  // Remove a card from the current page - fully immutable
  const removeCard = (type) => {
    setPages(prevPages => {
      return prevPages.map((page, index) => {
        if (index !== currentPage) return page; // Leave other pages unchanged
        
        // Create a new cardContents object without the removed type
        // Using destructuring to remove the property
        const { [type]: removedContent, ...remainingContents } = page.cardContents;
        
        // Return new page object with filtered cards and updated cardContents
        return {
          ...page,
          cards: page.cards.filter(card => card !== type),
          cardContents: remainingContents
        };
      });
    });
  };

  // Add a new content to a card - using AnswerIdManager for ID consistency
  const addCardContent = (cardType, contentType) => {
    setPages(prevPages => {
      return prevPages.map((page, index) => {
        if (index !== currentPage) return page;
        
        // Get current contents for this card type
        const currentContents = page.cardContents[cardType] || [];
        
        // Generate a stable component ID
        const contentId = `${contentType}-${Date.now()}`;
        
        // Create a new content item with the right properties based on type
        let newContent = {
          id: contentId,
          type: contentType,
          order_id: currentContents.length,
        };
        
        // For single-choice questions, add answer_id at question level
        if (contentType === 'single-choice') {
          // Get a new answer_id for the question
          const newAnswerId = AnswerIdManager.getNextId();
          
          newContent = {
            ...newContent,
            answer_id: newAnswerId,
            question: 'Enter your question here...',
            options: [
              { 
                id: 0, 
                answer_id: newAnswerId, // Same answer_id for all options
                option_value: 'Option 1',
                option_image: null,
                option_audio: null,
                option_video: null 
              },
              { 
                id: 1, 
                answer_id: newAnswerId, // Same answer_id for all options
                option_value: 'Option 2',
                option_image: null,
                option_audio: null,
                option_video: null 
              },
              { 
                id: 2, 
                answer_id: newAnswerId, // Same answer_id for all options
                option_value: 'Option 3',
                option_image: null,
                option_audio: null,
                option_video: null 
              }
            ],
            correctAnswer: null
          };
        } 
        // For fill-in-the-blank, don't add answer_id at question level
        else if (contentType === 'fill-in-the-blank') {
          // Get a new answer_id for the first blank
          const firstBlankAnswerId = AnswerIdManager.getNextId();
          
          newContent = {
            ...newContent,
            question: 'Enter your question with [blank_1] placeholders...',
            blanks: [{
              id: 0,
              answer_id: firstBlankAnswerId,
              placeholder: '[blank_1]',
              correctAnswers: ['']
            }]
          };
        }
        
        // Create a new contents array with the new item
        const newContents = [...currentContents, newContent];
        
        // Return a new page object with updated contents
        return {
          ...page,
          cardContents: {
            ...page.cardContents,
            [cardType]: newContents
          }
        };
      });
    });
  };

  // Update card content when edited - using AnswerIdManager for consistency
  const updateCardContent = (cardType, updatedContent) => {
    console.log("Updating card content:", cardType, {
      id: updatedContent.id,
      answer_id: updatedContent.answer_id,
      media: {
        question_image: updatedContent.question_image,
        question_audio: updatedContent.question_audio,
        question_video: updatedContent.question_video
      }
    });
    
    // Update AnswerIdManager with any new answer_ids from this content
    if (updatedContent.answer_id !== undefined) {
      AnswerIdManager.reserveId(updatedContent.answer_id);
    }
    
    // For fill-in-the-blank, check all blanks
    if (updatedContent.type === 'fill-in-the-blank' && updatedContent.blanks) {
      updatedContent.blanks.forEach(blank => {
        if (blank.answer_id !== undefined) {
          AnswerIdManager.reserveId(blank.answer_id);
        }
      });
    }
    
    setPages(prevPages => {
      return prevPages.map((page, index) => {
        if (index !== currentPage) return page;
        
        // Skip if this card type doesn't exist or has no contents
        if (!page.cardContents[cardType]) return page;
        
        // Update the specific content
        const updatedContents = page.cardContents[cardType].map(content => {
          if (content.id === updatedContent.id) {
            // Create a deep copy of the content object to avoid reference issues
            const newContent = JSON.parse(JSON.stringify(content));
            
            // Preserve the original answer_id if not provided in updatedContent
            const answer_id = updatedContent.answer_id !== undefined 
              ? updatedContent.answer_id 
              : content.answer_id;
            
            // For each key in updatedContent, properly update the content
            Object.keys(updatedContent).forEach(key => {
              // Special handling for media objects - deep clone them
              if (key === 'question_image' || key === 'question_audio' || key === 'question_video') {
                if (updatedContent[key]) {
                  // Make a complete deep copy of the media object
                  newContent[key] = JSON.parse(JSON.stringify(updatedContent[key]));
                } else {
                  newContent[key] = null;
                }
              } 
              // Special handling for options with media in single-choice
              else if (key === 'options' && Array.isArray(updatedContent.options)) {
                newContent.options = updatedContent.options.map(option => {
                  // If option is a string, convert to object format with answer_id
                  if (typeof option === 'string') {
                    return {
                      option_value: option,
                      answer_id: answer_id, // Add answer_id to each option
                      option_image: null,
                      option_audio: null,
                      option_video: null
                    };
                  }
                  
                  // Make sure we preserve media inside options
                  const optionCopy = { ...option };
                  
                  // Ensure answer_id is set for each option
                  optionCopy.answer_id = answer_id;
                  
                  // Deep copy media objects inside options
                  if (option.option_image) {
                    optionCopy.option_image = JSON.parse(JSON.stringify(option.option_image));
                  }
                  if (option.option_audio) {
                    optionCopy.option_audio = JSON.parse(JSON.stringify(option.option_audio));
                  }
                  if (option.option_video) {
                    optionCopy.option_video = JSON.parse(JSON.stringify(option.option_video));
                  }
                  
                  return optionCopy;
                });
              }
              // Special handling for blanks in fill-in-the-blank
              else if (key === 'blanks' && Array.isArray(updatedContent.blanks)) {
                newContent.blanks = updatedContent.blanks.map(blank => {
                  // Ensure each blank has a valid answer_id
                  if (blank.answer_id === undefined) {
                    // If no answer_id, assign a new one
                    blank.answer_id = AnswerIdManager.getNextId();
                  } else {
                    // Reserve this ID to ensure future IDs are higher
                    AnswerIdManager.reserveId(blank.answer_id);
                  }
                  
                  // Return a deep copy of the blank
                  return JSON.parse(JSON.stringify(blank));
                });
              }
              // For other properties, just copy them over
              else {
                newContent[key] = updatedContent[key];
              }
            });
            
            // For single-choice, ensure answer_id is always set
            if (newContent.type === 'single-choice') {
              newContent.answer_id = answer_id;
              
              // Make sure options have the same answer_id
              if (newContent.options) {
                newContent.options = newContent.options.map(option => ({
                  ...option,
                  answer_id: answer_id
                }));
              }
            }
            
            return newContent;
          }
          return content;
        });
        
        // Return a new page object with updated cardContents
        return {
          ...page,
          cardContents: {
            ...page.cardContents,
            [cardType]: updatedContents
          }
        };
      });
    });
  };

  // Update the reorderContent function to update order_id but maintain each item's answer_id
  const reorderContent = (cardType, contentId, direction, targetIndex) => {
    console.log(`Reordering content: ${contentId} in ${cardType} direction: ${direction}`);
    
    setPages(prevPages => {
      return prevPages.map((page, index) => {
        if (index !== currentPage) return page; // Leave other pages unchanged
        
        // Get the card contents
        const cardContents = page.cardContents[cardType] || [];
        if (cardContents.length <= 1) return page; // Nothing to reorder
        
        // Find the index of the content to move
        const contentIndex = cardContents.findIndex(item => item.id === contentId);
        if (contentIndex === -1) return page; // Content not found
        
        // Calculate new index based on direction
        let newIndex;
        if (direction === 'up') {
          newIndex = Math.max(0, contentIndex - 1);
        } else if (direction === 'down') {
          newIndex = Math.min(cardContents.length - 1, contentIndex + 1);
        } else if (direction === 'custom' && typeof targetIndex === 'number') {
          // For drag and drop, use the provided target index
          newIndex = targetIndex;
        } else {
          return page; // Invalid direction
        }
        
        // Don't proceed if the indices are the same
        if (newIndex === contentIndex) return page;
        
        // Create a new array with reordered contents
        const newContents = [...cardContents];
        const [removed] = newContents.splice(contentIndex, 1);
        newContents.splice(newIndex, 0, removed);
        
        // Update only order_id for all items based on their new positions
        // Maintain each item's original answer_id
        const updatedContents = newContents.map((item, idx) => ({
          ...item,
          order_id: idx, // Update order_id based on new position (zero-based)
          // Keep the original answer_id unchanged
        }));
        
        // Return new page object with updated contents
        return {
          ...page,
          cardContents: {
            ...page.cardContents,
            [cardType]: updatedContents
          }
        };
      });
    });
  };

  // Reorder cards (swap positions)
  const reorderCards = (sourceIndex, destinationIndex) => {
    // Only do something if indices are different
    if (sourceIndex === destinationIndex) {
      console.log("Indices are the same, skipping reorder");
      return;
    }
    
    console.log(`Reordering cards: from ${sourceIndex} to ${destinationIndex}`);
    
    // Get current state
    const currentCards = [...pages[currentPage].cards];
    console.log("Current cards before reorder:", currentCards);
    
    // Create a new array with the reordered cards
    const newCards = [...currentCards];
    const [movedCard] = newCards.splice(sourceIndex, 1);
    newCards.splice(destinationIndex, 0, movedCard);
    
    console.log("Calculated new card order:", newCards);
    
    // Create a completely new state object
    const newPages = pages.map((page, index) => {
      if (index !== currentPage) return page;
      
      // Return a new page object for the current page
      return {
        ...page,
        cards: newCards
      };
    });
    
    // Update state with the new pages array
    console.log("Setting new pages state");
    setPages(newPages);
  };

  // Load form data function to initialize from existing data
  const loadFormData = (formData) => {
    if (!formData || !formData.pages) {
      console.error("Invalid form data provided");
      return;
    }
    
    // Set the pages from the form data
    setPages(formData.pages);
    
    // Initialize the AnswerIdManager with the loaded data
    const highestId = AnswerIdManager.initialize(formData.pages);
    console.log("AnswerIdManager initialized with highest ID:", highestId);
    
    // Set current page to 0
    setCurrentPage(0);
  };

  // Get the current page data safely
  const currentPageData = pages[currentPage] || { cards: [], cardContents: {} };

  return {
    pages,
    setPages,
    currentPage,
    setCurrentPage,
    isDragging,
    setIsDragging,
    currentPageData,
    nextAnswerId: AnswerIdManager.getCurrentNextId(), // Expose the current next ID
    addPage,
    deletePage,
    addCard,
    removeCard,
    addCardContent,
    removeCardContent,
    updateCardContent,
    reorderContent,
    reorderCards,
    loadFormData
  };
}