// src/components/formeditor/FormEditor.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Divider, 
  Alert, 
  CircularProgress,
  Snackbar
} from '@mui/material';
import { DndContext } from '@dnd-kit/core';

// Import the question bank hook
import useQuestionBank from '../../hooks/useQuestionBank';

// Import form builder components and hooks
import useFormBuilder from '../formbuilder/hooks/useFormBuilder';
import { createDragHandlers } from '../formbuilder/utils/dragAndDropUtils';
import NavigationBar from '../formbuilder/shared/NavigationBar';
import FormCategorySelector from '../formbuilder/shared/FormCategorySelector';
import AvailableMedia from '../formbuilder/shared/media/AvailableMedia';
import BlankPage from '../formbuilder/shared/BlankPage';
import AvailableQuestions from '../formbuilder/shared/AvailableQuestions';
import AvailableMaterials from '../formbuilder/shared/AvailableMaterials';

const FormEditor = ({ questionBankId, onFormDataChange }) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  
  // Get question bank data using the custom hook
  const {
    loading: questionBankLoading,
    error: questionBankError,
    questionBank,
    formData,
  } = useQuestionBank(questionBankId);
  
  // Set up form builder state and functions
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
    loadFormData,
    getFormData
  } = useFormBuilder();

  // Create drag handlers
  const { handleDragStart, handleDragEnd } = createDragHandlers(
    setIsDragging,
    addCard,
    addCardContent,
    reorderCards
  );

  // Load form data when it's available
  useEffect(() => {
    if (formData && formData.pages) {
      loadFormData(formData);
    }
  }, [formData]);
  
  // Notify parent component when data changes
  useEffect(() => {
    if (!questionBankLoading && pages.length > 0) {
      const currentFormData = {
        title: questionBank?.title || 'Question Bank',
        description: questionBank?.description || '',
        questionbank_id: questionBankId,
        pages: pages.map(page => ({
          ...page,
          // Include metadata for the API
          exam_language: page.examCategories?.exam_language || 'en',
          exam_type: page.examCategories?.exam_type || '',
          component: page.examCategories?.component || '',
          category: page.examCategories?.category || ''
        }))
      };
      
      if (onFormDataChange) {
        onFormDataChange(currentFormData);
      }
    }
  }, [pages, currentPage, currentPageData, questionBank]);
  
  // Handler for category changes
  const handleCategoryChange = (categoryData) => {
    // Only update local state - parent will handle saving
    if (currentPage >= 0 && pages[currentPage]) {
      updatePageMetadata(pages[currentPage].id, { examCategories: categoryData });
    }
  };
  
  // Show a snackbar notification
  const showSnackbar = (message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Render loading state
  if (questionBankLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (questionBankError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {questionBankError}
        </Alert>
      </Box>
    );
  }

  return (
    <>
      {/* Main Form Editor */}
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
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default FormEditor;