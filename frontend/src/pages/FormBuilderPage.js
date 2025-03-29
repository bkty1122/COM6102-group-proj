// src/pages/FormBuilderPage.js
import React from "react";

// MUI Components
import { Box, Divider } from "@mui/material";

// DnD Kit
import { DndContext } from "@dnd-kit/core";

// Hooks
import useFormBuilder from "../components/formbuilder/hooks/useFormBuilder";

// Utils
import { createDragHandlers } from "../components/formbuilder/utils/dragAndDropUtils";

// Shared Components
import NavigationBar from "../components/formbuilder/shared/NavigationBar";
import FormCategorySelector from "../components/formbuilder/shared/FormCategorySelector";
import AvailableMedia from '../components/formbuilder/shared/media/AvailableMedia';
import TopAppBarLoggedIn from '../components/shared/TopAppBarLoggedIn';

// Form Builder Components
import BlankPage from "../components/formbuilder/shared/BlankPage";
import AvailableQuestions from "../components/formbuilder/shared/AvailableQuestions";
import AvailableMaterials from "../components/formbuilder/shared/AvailableMaterials";
import FormExport from "../components/formbuilder/FormExport";

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
    updatePageMetadata
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
    updatePageMetadata(pages[currentPage].id, { examCategories: categoryData });
  };

  return (
    <>
      {/* Floating top app bar */}
      <TopAppBarLoggedIn appTitle="Form Builder" />
      
      {/* Main content */}
      <DndContext 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Box 
          sx={{ 
            display: "flex", 
            height: "calc(100vh - 48px - 12px)", // Subtract toolbar height and extra spacing
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
              zIndex: 2
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
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column'
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

            {/* Category selector */}
            {currentPage >= 0 && currentPage < pages.length && (
              <FormCategorySelector
                pageId={pages[currentPage].id}
                initialValues={currentPageData.examCategories || {}}
                onChange={handleCategoryChange}
              />
            )}
            
            <Box sx={{ my: 2 }}>
              <AvailableMedia />
            </Box>
            
            <Divider sx={{ my: 2 }} />

            {/* Main form building area */}
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
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
            
            {/* Export button */}
            <Box sx={{ mt: 2 }}>
              <FormExport pages={pages} />
            </Box>
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
              zIndex: 2
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
                zIndex: 5,
                backgroundColor: "rgba(0,0,0,0.03)",
                transition: "opacity 0.2s",
              }}
            />
          )}
        </Box>
      </DndContext>
    </>
  );
};

export default FormBuilderPage;