// src/components/formbuilder/FormBuilderPage.js
import React from "react";
import { Box } from "@mui/material";
import { DndContext } from "@dnd-kit/core";
import NavigationBar from "./shared/NavigationBar";
import BlankPage from "./shared/BlankPage";
import AvailableQuestions from "./shared/AvailableQuestions";
import FormExport from "./FormExport";
import useFormBuilder from "./hooks/useFormBuilder";
import { createDragHandlers } from "./utils/dragAndDropUtils";

const FormBuilderPage = () => {
  const {
    pages,
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
  } = useFormBuilder();

  // Create drag handlers
  const { handleDragStart, handleDragEnd } = createDragHandlers(
    setIsDragging,
    addCard,
    addCardContent,
    reorderCards
  );

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
            onUpdateContent={updateCardContent}
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
      
      {/* Export button */}
      <FormExport pages={pages} />
    </DndContext>
  );
};

export default FormBuilderPage;