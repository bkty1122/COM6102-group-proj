// src/components/formbuilder/hooks/useFormBuilder.js
import { useState, useEffect } from "react";

export default function useFormBuilder() {
  const [pages, setPages] = useState([
    { id: 1, cards: [], cardContents: {} }, // Each page starts with no cards
  ]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("Current page state:", pages[currentPage]);
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

  // When adding content to a card
  const addCardContent = (cardType, contentType) => {
    setPages(prevPages => {
      return prevPages.map((page, index) => {
        if (index !== currentPage) return page;
        
        // Get current contents for this card type
        const currentContents = page.cardContents[cardType] || [];
        
        // Generate a stable component ID (this never changes)
        const contentId = `${contentType}-${Date.now()}`;
        
        // Create a new content item with order_id and answer_id
        const newContent = {
          id: contentId,
          type: contentType,
          order_id: currentContents.length, // Zero-based order_id
          answer_id: currentContents.length, // Zero-based answer_id
          // Add other default properties based on content type
          ...(contentType === 'single-choice' && {
            question: 'Enter your question here...',
            options: ['Option 1', 'Option 2', 'Option 3'],
            correctAnswer: null
          })
        };
        
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

  // Update card content when edited
  const updateCardContent = (cardType, updatedContent) => {
    console.log("Updating card content:", cardType, updatedContent);
    
    setPages(prevPages => {
      return prevPages.map((page, index) => {
        if (index !== currentPage) return page;
        
        // Skip if this card type doesn't exist or has no contents
        if (!page.cardContents[cardType]) return page;
        
        // Update the specific content
        const updatedContents = page.cardContents[cardType].map(content => {
          if (content.id === updatedContent.id) {
            // Return the updated content, preserving any existing fields
            return {
              ...content,
              question: updatedContent.question,
              options: updatedContent.options,
              correctAnswer: updatedContent.correctAnswer
            };
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

  // Update the reorderContent function to update both order_id and answer_id
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
        
        // Update order_id and answer_id for all items based on their new positions
        const updatedContents = newContents.map((item, idx) => ({
          ...item,
          order_id: idx, // Update order_id based on new position (zero-based)
          answer_id: idx  // Update answer_id based on new position (zero-based)
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
    addPage,
    deletePage,
    addCard,
    removeCard,
    addCardContent,
    removeCardContent,
    updateCardContent,
    reorderContent,
    reorderCards
  };
}