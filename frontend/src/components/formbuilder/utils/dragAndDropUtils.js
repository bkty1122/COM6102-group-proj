// src/components/formbuilder/utils/dragAndDropUtils.js

export const createDragHandlers = (
    setIsDragging, 
    addCard, 
    addCardContent, 
    reorderCards
  ) => {
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
            
            // Only reorder if indexes are different
            if (sourceIndex !== destinationIndex) {
              console.log(`Reordering cards: moving index ${sourceIndex} to ${destinationIndex}`);
              reorderCards(sourceIndex, destinationIndex);
            }
          }
        }
        
        // Handle dropping on a specific drop zone
        if (typeof over.id === 'string' && over.id.startsWith('card-drop-')) {
          const destinationIndex = parseInt(over.id.replace('card-drop-', ''));
          
          // Only reorder if indexes are different
          if (sourceIndex !== destinationIndex) {
            console.log(`Reordering cards: moving index ${sourceIndex} to ${destinationIndex}`);
            reorderCards(sourceIndex, destinationIndex);
          }
        }
      }
    };
  
    return { handleDragStart, handleDragEnd };
  };