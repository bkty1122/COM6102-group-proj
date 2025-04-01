// src/pages/FormBuilderPage.js
import React, { useRef, useState } from "react";

// MUI Components
import { Box, Divider, Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress } from "@mui/material";
import FileUploadIcon from '@mui/icons-material/FileUpload';

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
import FormExport from "../components/formbuilder/FormExportTools";

// Import test data directly for debugging
import testData from '../form-export-2025-03-30(general).json';

const FormBuilderPage = () => {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
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
    updatePageMetadata,
    loadFormData
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
  
  // Handle file selection click
  const handleFileSelectClick = () => {
    fileInputRef.current.click();
  };
  
  // Handle direct test data loading (for debugging)
  const handleLoadTestData = () => {
    setLoading(true);
    setErrorMsg(null);
    
    try {
      console.log("Loading test data:", testData);
      
      // Transform the data to match the expected structure in useFormBuilder
      const formattedData = {
        pages: testData.pages.map((page, index) => ({
          id: index + 1,
          examCategories: {
            exam_language: page.exam_language || "en",
            exam_type: page.exam_categories?.exam_type || "",
            component: page.exam_categories?.component || "",
            category: page.exam_categories?.category || ""
          },
          cards: page.cards.map(card => card.card_type),
          cardContents: page.cards.reduce((acc, card) => {
            // Create the content structure expected by the form builder
            if (card.contents && Array.isArray(card.contents)) {
              acc[card.card_type] = card.contents.map((content, idx) => ({
                ...content,
                order_id: idx
              }));
            } else {
              acc[card.card_type] = [];
            }
            return acc;
          }, {})
        }))
      };
      
      console.log("Formatted test data:", formattedData);
      loadFormData(formattedData);
      setIsDialogOpen(true);
    } catch (err) {
      console.error("Error loading test data:", err);
      setErrorMsg(`Error loading test data: ${err.message}`);
      setIsDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle file selection change
  const handleFileChange = (event) => {
    setLoading(true);
    setErrorMsg(null);
    
    const file = event.target.files[0];
    if (!file) {
      setLoading(false);
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        console.log("Loaded JSON data:", jsonData);
        
        // Transform the data to match the expected structure in useFormBuilder
        const formattedData = {
          pages: jsonData.pages.map((page, index) => ({
            id: index + 1,
            examCategories: {
              exam_language: page.exam_language || "en",
              exam_type: page.exam_categories?.exam_type || "",
              component: page.exam_categories?.component || "",
              category: page.exam_categories?.category || ""
            },
            cards: page.cards.map(card => card.card_type),
            cardContents: page.cards.reduce((acc, card) => {
              // Create the content structure expected by the form builder
              if (card.contents && Array.isArray(card.contents)) {
                acc[card.card_type] = card.contents.map((content, idx) => ({
                  ...content,
                  order_id: idx
                }));
              } else {
                acc[card.card_type] = [];
              }
              return acc;
            }, {})
          }))
        };
        
        console.log("Formatted data for form builder:", formattedData);
        loadFormData(formattedData);
        setIsDialogOpen(true);
      } catch (err) {
        console.error("Error parsing JSON file:", err);
        setErrorMsg(`Error loading form data: ${err.message}`);
        setIsDialogOpen(true);
      } finally {
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setErrorMsg("Error reading file");
      setLoading(false);
      setIsDialogOpen(true);
    };
    
    reader.readAsText(file);
    
    // Reset the file input
    event.target.value = '';
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

      {/* Add file upload controls */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        padding: 2, 
        backgroundColor: '#f9f9f9',
        borderBottom: '1px solid #ddd'
      }}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        
        {/* Load JSON buttons */}
        <Button
          variant="outlined"
          color="primary"
          startIcon={<FileUploadIcon />}
          onClick={handleFileSelectClick}
          sx={{ mr: 2 }}
          disabled={loading}
        >
          Load JSON File
        </Button>
        
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleLoadTestData}
          sx={{ mr: 2 }}
          disabled={loading}
        >
          Load Test Data
        </Button>
        
        {/* Export button */}
        <FormExport pages={pages} />
      </Box>

      {/* Main Form Builder - Keep the original structure */}
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
      
      {/* Result Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>
          {errorMsg ? "Error Loading Form" : "Form Loaded Successfully"}
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
              Form has been successfully loaded with {pages.length} pages.
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