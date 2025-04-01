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
      
      // Check if the component is being dropped on a compatible card type
      if (isComponentCompatibleWithCard(active, over)) {
        // Handle component items directly
        if (active.data?.current?.type) {
          console.log("Adding content of type:", active.data.current.type, "to card:", cardType);
          addCardContent(cardType, active.data.current.type);
          return;
        }
        
        // Handle legacy component IDs (backward compatibility)
        const componentType = getComponentTypeFromId(active.id);
        if (componentType) {
          console.log("Adding content of type:", componentType, "to card:", cardType);
          addCardContent(cardType, componentType);
          return;
        }
      } else {
        console.log("Component incompatible with card type:", cardType);
        // You could add a notification here for the user
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

// Helper function to check if a component is compatible with the card it's being dropped on
function isComponentCompatibleWithCard(active, over) {
  // Get component type - either from data.current.type or from the ID
  const componentType = active.data?.current?.type || getComponentTypeFromId(active.id);
  
  // If no valid component type found, return false
  if (!componentType) return false;
  
  // Get card type from the over ID
  const cardType = over.id.replace("droppable-", "");
  
  // Get component category (question or material)
  const componentCategory = active.data?.current?.category || getCategoryFromType(componentType);
  
  // Match card type with component category
  if (cardType === "question" && componentCategory === "question") return true;
  if (cardType === "material" && componentCategory === "material") return true;
  
  // If there's an explicit accepts list in the overData, check it
  if (over.data?.current?.accepts && Array.isArray(over.data.current.accepts)) {
    return over.data.current.accepts.includes(componentType);
  }
  
  return false;
}

// Helper function to determine component type from ID for backward compatibility
function getComponentTypeFromId(id) {
  // Check if it's a direct component ID (new format)
  if (id && id.startsWith('component-')) {
    return id.replace('component-', '');
  }
  
  // Legacy question types
  const questionTypes = [
    "single-choice", "multiple-choice", "matching", 
    "fill-in-the-blank", "long-text", "audio"
  ];
  
  // Legacy material types
  const materialTypes = [
    "text-material"
  ];
  
  // Check if the ID directly matches a known component type
  if (questionTypes.includes(id) || materialTypes.includes(id)) {
    return id;
  }
  
  return null;
}

// Helper function to determine component category from type
function getCategoryFromType(type) {
  // Question component types
  const questionTypes = [
    "single-choice", "multiple-choice", "matching", 
    "fill-in-the-blank", "long-text", "audio"
  ];
  
  // Material component types
  const materialTypes = [
    "text-material"
  ];
  
  if (questionTypes.includes(type)) return "question";
  if (materialTypes.includes(type)) return "material";
  
  // If type contains "-material", assume it's a material component
  if (type.includes("-material")) return "material";
  
  // Default to question for backward compatibility
  return "question";
}