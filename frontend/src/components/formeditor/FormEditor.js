// src/components/formeditor/FormEditor.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Divider, 
  Button, 
  Alert, 
  CircularProgress,
  Snackbar
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
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

// Import the form editor API
import formEditorApi from '../../api/formEditorApi';

const FormEditor = ({ questionBankId }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Keep track of incremental changes that need saving
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
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
  const handleCategoryChange = async (categoryData) => {
    // Check if currentPage is valid
    if (currentPage >= 0 && pages[currentPage]) {
      // Update local state first
      updatePageMetadata(pages[currentPage].id, { examCategories: categoryData });
      
      try {
        // Then update on the server
        const response = await formEditorApi.updatePageMetadata(
          questionBankId,
          currentPage + 1, // API uses 1-indexed page numbers
          {
            exam_language: categoryData.exam_language || 'en',
            exam_type: categoryData.exam_type || '',
            component: categoryData.component || '',
            category: categoryData.category || ''
          }
        );
        
        if (response.success) {
          showSnackbar('Page metadata updated', 'success');
        } else {
          showSnackbar('Failed to update page metadata', 'error');
        }
      } catch (error) {
        console.error('Error updating page metadata:', error);
        showSnackbar('Failed to update page metadata', 'error');
      }
    }
  };
  
  // Handle adding a new page
  const handleAddPage = async () => {
    // Call the local function to update UI immediately
    const newPageId = addPage();
    
    // Then sync with the server
    try {
      const pageData = {
        exam_language: 'en'
      };
      
      const response = await formEditorApi.addPage(questionBankId, pageData);
      
      if (response.success) {
        showSnackbar('Page added successfully', 'success');
      } else {
        showSnackbar('Failed to add page on server', 'warning');
      }
    } catch (error) {
      console.error('Error adding page on server:', error);
      showSnackbar('Failed to add page on server', 'warning');
    }
    
    return newPageId;
  };
  
  // Handle deleting a page
  const handleDeletePage = async (pageId, pageIndex) => {
    // Get API page index (1-based)
    const apiPageIndex = pageIndex + 1;
    
    try {
      // Delete on the server first
      const response = await formEditorApi.deletePage(questionBankId, apiPageIndex);
      
      if (response.success) {
        // Then update local state
        deletePage(pageId);
        showSnackbar('Page deleted successfully', 'success');
        return true;
      } else {
        showSnackbar('Failed to delete page on server', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error deleting page on server:', error);
      showSnackbar('Failed to delete page on server', 'error');
      return false;
    }
  };
  
  // Handle adding a card
  const handleAddCard = async (pageId, cardType, position) => {
    // Find the page index for the given pageId
    const pageIndex = pages.findIndex(page => page.id === pageId);
    
    if (pageIndex === -1) {
      console.error(`Page with ID ${pageId} not found`);
      return null;
    }
    
    // Convert to 1-based index for API
    const apiPageIndex = pageIndex + 1;
    
    try {
      // Add card on the server
      const response = await formEditorApi.addCard(
        questionBankId,
        apiPageIndex,
        {
          card_type: cardType,
          position: position
        }
      );
      
      if (response.success) {
        // Then update local state
        const cardId = addCard(pageId, cardType, position);
        showSnackbar(`${cardType} card added`, 'success');
        return cardId;
      } else {
        showSnackbar('Failed to add card on server', 'error');
        return null;
      }
    } catch (error) {
      console.error('Error adding card on server:', error);
      showSnackbar('Failed to add card on server', 'error');
      return null;
    }
  };
  
  // Handle removing a card
  const handleRemoveCard = async (pageId, cardId, cardIndex) => {
    // Find the page index for the given pageId
    const pageIndex = pages.findIndex(page => page.id === pageId);
    
    if (pageIndex === -1) {
      console.error(`Page with ID ${pageId} not found`);
      return false;
    }
    
    // Convert to 1-based index for API
    const apiPageIndex = pageIndex + 1;
    
    try {
      // Delete card on the server
      const response = await formEditorApi.deleteCard(
        questionBankId,
        apiPageIndex,
        cardIndex
      );
      
      if (response.success) {
        // Then update local state
        removeCard(pageId, cardId);
        showSnackbar('Card removed successfully', 'success');
        return true;
      } else {
        showSnackbar('Failed to remove card on server', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error removing card on server:', error);
      showSnackbar('Failed to remove card on server', 'error');
      return false;
    }
  };
  
  // Handle adding content to a card
  const handleAddCardContent = async (pageId, cardId, contentType, contentData) => {
    // Find page index and card index
    const pageIndex = pages.findIndex(page => page.id === pageId);
    if (pageIndex === -1) return null;
    
    // Convert to 1-based index for API
    const apiPageIndex = pageIndex + 1;
    
    // Find the card information
    const page = pages[pageIndex];
    const cardType = page.cards.material.includes(cardId) ? 'material' : 'question';
    const cardList = page.cards[cardType];
    const cardPosition = cardList.indexOf(cardId);
    
    if (cardPosition === -1) return null;
    
    try {
      // Prepare content data for API
      const apiContentData = {
        ...contentData,
        type: contentType
      };
      
      // Add content on the server
      const response = await formEditorApi.addCardContent(
        questionBankId,
        apiPageIndex,
        cardPosition,
        apiContentData
      );
      
      if (response.success) {
        // Update local state with the server-generated content ID
        const contentId = response.data.content_id;
        addCardContent(pageId, cardId, contentType, { ...contentData, id: contentId });
        showSnackbar('Content added successfully', 'success');
        return contentId;
      } else {
        showSnackbar('Failed to add content on server', 'error');
        return null;
      }
    } catch (error) {
      console.error('Error adding content on server:', error);
      showSnackbar('Failed to add content on server', 'error');
      return null;
    }
  };
  
  // Handle updating content
  const handleUpdateContent = async (pageId, cardId, contentId, contentType, updatedData) => {
    try {
      // Prepare data for API
      const apiContentData = {
        ...updatedData,
        type: contentType,
        id: contentId
      };
      
      // Update on the server
      const response = await formEditorApi.updateCardContent(
        questionBankId,
        contentId,
        apiContentData
      );
      
      if (response.success) {
        // Update local state
        updateCardContent(pageId, cardId, contentId, updatedData);
        showSnackbar('Content updated successfully', 'success');
        return true;
      } else {
        showSnackbar('Failed to update content on server', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error updating content on server:', error);
      showSnackbar('Failed to update content on server', 'error');
      return false;
    }
  };
  
  // Handle removing content
  const handleRemoveContent = async (pageId, cardId, contentId, contentType) => {
    try {
      // Remove from server
      const response = await formEditorApi.deleteCardContent(
        questionBankId,
        contentId,
        contentType
      );
      
      if (response.success) {
        // Update local state
        removeCardContent(pageId, cardId, contentId);
        showSnackbar('Content removed successfully', 'success');
        
        // If the card was also removed (it was the last content), update UI
        if (response.data.card_removed) {
          // Refresh the page display or handle card removal
          // This might require additional state updates depending on your UI
        }
        
        return true;
      } else {
        showSnackbar('Failed to remove content on server', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error removing content on server:', error);
      showSnackbar('Failed to remove content on server', 'error');
      return false;
    }
  };
  
  // Handle save action - this will do a full form save
  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    
    try {
      // Collect the current form builder data
      const currentFormData = {
        title: questionBank?.title || 'Question Bank',
        description: questionBank?.description || '',
        questionbank_id: questionBankId,
        pages: pages.map(page => ({
          ...page
        }))
      };
      
      // Save to the API using the comprehensive update method
      const response = await formEditorApi.updateCompleteForm(questionBankId, currentFormData);
      
      if (response.success) {
        setHasUnsavedChanges(false);
        setSaveSuccess(true);
        showSnackbar('Question bank saved successfully', 'success');
      } else {
        setSaveError(response.message || 'Failed to save question bank');
        showSnackbar(response.message || 'Failed to save question bank', 'error');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      setSaveError(error.message || 'Failed to save question bank');
      showSnackbar(error.message || 'Failed to save question bank', 'error');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Load form data when it's available
  useEffect(() => {
    if (formData && formData.pages) {
      loadFormData(formData);
    }
  }, [formData]);
  
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
  
  // Close the dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };
  
  // Track unsaved changes
  const markUnsavedChanges = () => {
    setHasUnsavedChanges(true);
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
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <>
      {/* Save Button */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        padding: 2, 
        backgroundColor: '#f9f9f9',
        borderBottom: '1px solid #ddd'
      }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={isSaving ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={isSaving || questionBankLoading}
          sx={{ ml: 2 }}
        >
          {isSaving ? 'Saving...' : (hasUnsavedChanges ? 'Save Changes*' : 'Save Changes')}
        </Button>
      </Box>

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
              addPage={handleAddPage}  // Use our new handler
              deletePage={handleDeletePage}  // Use our new handler
            />
            
            <Divider sx={{ my: 2 }} />

            {/* Category selector */}
            {currentPage >= 0 && currentPage < pages.length && (
              <FormCategorySelector
                pageId={pages[currentPage].id}
                initialValues={currentPageData.examCategories || {}}
                onChange={handleCategoryChange}  // Updated handler
              />
            )}
            
            <Box sx={{ my: 2 }}>
              <AvailableMedia />
            </Box>
            
            <Divider sx={{ my: 2 }} />

            {/* Main form building area */}
            <BlankPage 
              cards={currentPageData.cards} 
              addCard={handleAddCard}  // Use our new handler
              removeCard={handleRemoveCard}  // Use our new handler
              cardContents={currentPageData.cardContents}
              reorderCards={reorderCards}
              onRemoveContent={handleRemoveContent}  // Use our new handler
              onReorderContent={reorderContent}
              onUpdateContent={handleUpdateContent}  // Use our new handler
              onContentChange={() => markUnsavedChanges()}  // Track changes
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