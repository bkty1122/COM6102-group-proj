// src/components/formbuilder/FormBuilderPage.js
import React from "react";
import { Box, Divider } from "@mui/material";
import { DndContext } from "@dnd-kit/core";
import NavigationBar from "./shared/NavigationBar";
import BlankPage from "./shared/BlankPage";
import AvailableQuestions from "./shared/AvailableQuestions";
import AvailableMaterials from "./shared/AvailableMaterials";
import FormCategorySelector from "./shared/FormCategorySelector"; // Import the component
import FormExport from "./FormExport";
import useFormBuilder from "./hooks/useFormBuilder";
import { createDragHandlers } from "./utils/dragAndDropUtils";
import AvailableMedia from './shared/media/AvailableMedia';

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
    reorderCards,
    updatePageMetadata // Make sure this is included
  } = useFormBuilder();

  // Create drag handlers
  const { handleDragStart, handleDragEnd } = createDragHandlers(
    setIsDragging,
    addCard,
    addCardContent,
    reorderCards
  );

  // Handler for category changes from FormCategorySelector
  const handleCategoryChange = (categoryData) => {
    // Use the currentPage index, not the page ID
    updatePageMetadata(pages[currentPage].id, { examCategories: categoryData });
  };

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
        {/* Available Materials panel on the left */}
        <Box 
          sx={{ 
            width: "200px", 
            backgroundColor: "#f5f5f5", 
            p: 2, 
            borderRight: "1px solid #ddd",
            overflowY: "auto",
            flexShrink: 0,
            zIndex: 2 // Slightly higher than main content
          }}
        >
          <AvailableMaterials />
        </Box>

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
          
          <Divider sx={{ my: 2 }} />

          {/* // Then when rendering the FormCategorySelector */}
          {currentPage >= 0 && currentPage < pages.length && (
            <FormCategorySelector
              pageId={currentPage}  // Pass the index, not the ID
              initialValues={currentPageData.examCategories || {}}
              onChange={handleCategoryChange}
            />
          )}
          
          <Box 
            sx={{ 
              flexGrow: 1, 
              overflow: "auto", 
              p: 2,
              zIndex: 1
            }}>
              <AvailableMedia />
            </Box>
          <Divider sx={{ my: 2 }} />

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
            width: "200px", 
            backgroundColor: "#f5f5f5", 
            p: 2, 
            borderLeft: "1px solid #ddd",
            overflowY: "auto",
            flexShrink: 0,
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