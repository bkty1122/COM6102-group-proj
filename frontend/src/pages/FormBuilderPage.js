// src/pages/FormBuilderPage.js
import React, { useState } from "react";

// MUI Components
import { Box, Divider, Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress } from "@mui/material";

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
import FormDbUpload from "../components/formbuilder/FormDbUpload";

const FormBuilderPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
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
    // Use the currentPage index, not the page ID
    if (currentPage >= 0 && pages[currentPage]) {
      updatePageMetadata(pages[currentPage].id, { examCategories: categoryData });
    }
  };
  
  // Close the dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setErrorMsg(null);
  };

  return (
    <>
      {/* Top App Bar with logout functionality */}
      <TopAppBarLoggedIn appTitle="Form Builder" />

      {/* Action buttons */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        padding: 2, 
        backgroundColor: '#f9f9f9',
        borderBottom: '1px solid #ddd'
      }}>
        {/* Save to DB button */}
        <FormDbUpload pages={pages} />
        
        {/* Export button */}
        <FormExport pages={pages} />
      </Box>

      {/* Main Form Builder */}
      <DndContext 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Box 
          sx={{ 
            display: "flex", 
            height: "calc(100vh - 128px)", // Adjust for top bars
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
      </DndContext>
      
      {/* Result Dialog - Keep this for any future notifications */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>
          {errorMsg ? "Error" : "Success"}
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress />
            </Box>
          ) : errorMsg ? (
            <Alert severity="error">{errorMsg}</Alert>
          ) : (
            <Alert severity="success">
              Operation completed successfully
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FormBuilderPage;