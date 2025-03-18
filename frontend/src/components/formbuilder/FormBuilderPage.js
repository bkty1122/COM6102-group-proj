// FormBuilderPage.js
import React, { useState, useEffect } from "react";
import { Box, Grid } from "@mui/material";
import { DndContext } from "@dnd-kit/core";
import NavigationBar from "./shared/NavigationBar";
import BlankPage from "./shared/BlankPage";
import AvailableQuestions from "./shared/AvailableQuestions";

const FormBuilderPage = () => {
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

  // Add content to a card - fully immutable
  const addCardContent = (cardType, contentType) => {
    setPages(prevPages => {
      return prevPages.map((page, index) => {
        if (index !== currentPage) return page; // Leave other pages unchanged
        
        // Verify that this card type exists on the page
        if (!page.cards.includes(cardType)) {
          return page; // Skip if card type doesn't exist
        }
        
        // Get existing contents or initialize empty array
        const existingContents = page.cardContents[cardType] || [];
        
        // Create new content item with unique ID
        const newContent = {
          type: contentType,
          id: `${contentType}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          question: "New Question", // Default values
          options: ["Option 1", "Option 2"]
        };
        
        // Return new page object with updated cardContents
        return {
          ...page,
          cardContents: {
            ...page.cardContents,
            [cardType]: [...existingContents, newContent]
          }
        };
      });
    });
  };

  // Reorder content within a card - fully immutable
  const reorderContent = (cardType, contentId, direction) => {
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
        } else {
          return page; // Invalid direction
        }
        
        // Don't proceed if the indices are the same
        if (newIndex === contentIndex) return page;
        
        // Create a new array with reordered contents
        const newContents = [...cardContents];
        const [removed] = newContents.splice(contentIndex, 1);
        newContents.splice(newIndex, 0, removed);
        
        // Return new page object with updated contents
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

  // Reorder cards (swap positions) - fully immutable
  const reorderCards = (sourceIndex, destinationIndex) => {
    // Only do something if indices are different
    if (sourceIndex === destinationIndex) return;
    
    console.log(`Reordering cards: moving index ${sourceIndex} to ${destinationIndex}`);
    
    setPages(prevPages => {
      return prevPages.map((page, index) => {
        if (index !== currentPage) return page; // Leave other pages unchanged
        
        // Get a copy of the cards array
        const newCards = [...page.cards];
        
        // Perform the reordering
        const [removed] = newCards.splice(sourceIndex, 1);
        newCards.splice(destinationIndex, 0, removed);
        
        console.log("New card order:", newCards);
        
        // Return new page object with reordered cards
        return {
          ...page,
          cards: newCards
        };
      });
    });
  };

  // Handler for drag start events
  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Handler for drag end events
  const handleDragEnd = (event) => {
    setIsDragging(false);
    
    const { active, over } = event;
    
    // Debug info
    console.log("Drag ended:", { 
      activeId: active?.id, 
      overId: over?.id,
      activeData: active?.data?.current,
      overData: over?.data?.current
    });
    
    if (!over) return;
    
    // Handle card drag to blank page
    if (over.id === "dropzone") {
      if (active.id === "question" || active.id === "material") {
        console.log("Dropping card type:", active.id);
        addCard(active.id);
      }
    }
    
    // Handle component drag to question/material card
    if (typeof over.id === 'string' && over.id.startsWith("droppable-")) {
      const cardType = over.id.replace("droppable-", "");
      
      // Add support for all question types
      const questionTypes = [
        "single-choice", "multiple-choice", "matching", 
        "fill-in-the-blank", "long-text", "audio"
      ];
      
      if (questionTypes.includes(active.id)) {
        console.log("Adding content of type:", active.id, "to card:", cardType);
        addCardContent(cardType, active.id);
      }
    }
    
    // Handle card reordering
    if (active.data?.current?.type === 'card' && 
        typeof active.id === 'string' && 
        active.id.startsWith('card-')) {
      
      // Get source index
      const sourceIndex = active.data.current.index;
      
      // Handle dropping on another card
      if (typeof over.id === 'string' && over.id.startsWith('card-')) {
        // Get destination card index from the over.id
        const destinationId = over.id;
        const match = destinationId.match(/card-(\w+)-(\d+)/);
        
        if (match && match[2]) {
          const destinationIndex = parseInt(match[2]);
          
          // Swap the cards
          reorderCards(sourceIndex, destinationIndex);
        }
      }
      
      // Handle dropping on a specific drop zone
      if (typeof over.id === 'string' && over.id.startsWith('card-drop-')) {
        const destinationIndex = parseInt(over.id.replace('card-drop-', ''));
        reorderCards(sourceIndex, destinationIndex);
      }
    }
  };

  // Get the current page data safely
  const currentPageData = pages[currentPage] || { cards: [], cardContents: {} };

  return (
    <DndContext 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box 
        sx={{ 
          display: "flex", 
          height: "100vh",
          position: "relative",
          zIndex: 1
        }}
      >
        {/* Main content area */}
        <Box 
          sx={{ 
            flexGrow: 1, 
            overflow: "auto", 
            p: 2,
            zIndex: 1
          }}
        >
          <NavigationBar
            pages={pages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            addPage={addPage}
            deletePage={deletePage}
          />
          
          <BlankPage 
          cards={currentPageData.cards} 
          addCard={addCard} 
          removeCard={removeCard}
          cardContents={currentPageData.cardContents}
          reorderCards={reorderCards}
          onRemoveContent={removeCardContent}
          onReorderContent={reorderContent}
          />
        </Box>
        
        {/* Available Questions panel on the right */}
        <Box 
          sx={{ 
            width: "250px", 
            backgroundColor: "#f5f5f5", 
            p: 2, 
            borderLeft: "1px solid #ddd",
            overflowY: "auto",
            zIndex: 2 // Slightly higher than main content
          }}
        >
          <AvailableQuestions />
        </Box>
        
        {/* Optional overlay div to help visualize drop targets during dragging */}
        {isDragging && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: "none",
              zIndex: 5, // Higher than content but lower than dragged items
              backgroundColor: "rgba(0,0,0,0.03)",
              transition: "opacity 0.2s",
            }}
          />
        )}
      </Box>
      
    </DndContext>
  );
};

export default FormBuilderPage;