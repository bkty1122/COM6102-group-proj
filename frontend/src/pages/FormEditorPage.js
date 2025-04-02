// src/pages/FormEditorPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Alert, 
  CircularProgress,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Typography,
  Snackbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExportIcon from '@mui/icons-material/GetApp';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

// Shared Components
import TopAppBarLoggedIn from '../components/shared/TopAppBarLoggedIn';

// Form Editor Components
import FormEditor from '../components/formeditor/FormEditor';

// We'll use FormDbUpload component directly
import FormDbUpload from '../components/formbuilder/FormDbUpload';

// API for fetching question bank existence
import formExportApi from '../api/formExportApi';
import { exportFormAsJson } from '../components/formbuilder/utils/exportUtils';

const FormEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questionBankExists, setQuestionBankExists] = useState(false);
  const [questionBankTitle, setQuestionBankTitle] = useState('');
  const [questionBankDescription, setQuestionBankDescription] = useState('');
  const [formData, setFormData] = useState(null);
  const [originalFormData, setOriginalFormData] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  
  // Check if question bank exists
  useEffect(() => {
    const checkQuestionBankExists = async () => {
      if (!id) {
        setError('No question bank ID provided');
        setLoading(false);
        return;
      }
      
      try {
        const response = await formExportApi.getFormById(id);
        if (response && response.success && response.data) {
          setQuestionBankExists(true);
          setQuestionBankTitle(response.data.title || id);
          setQuestionBankDescription(response.data.description || '');
          
          // Store the retrieved data
          setFormData(response.data);
          
          // Create deep copy for comparison
          setOriginalFormData(JSON.parse(JSON.stringify(response.data)));
        } else {
          throw new Error('Invalid response from API');
        }
      } catch (err) {
        console.error('Error checking question bank:', err);
        setError('Question bank not found or you do not have permission to access it');
      } finally {
        setLoading(false);
      }
    };
    
    checkQuestionBankExists();
  }, [id]);
  
  // Navigate back to dashboard
  const handleBackClick = () => {
    if (unsavedChanges) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return;
      }
    }
    navigate('/dashboard');
  };
  
  // Track form data changes
  const handleFormDataChange = (updatedFormData) => {
    setFormData(updatedFormData);
    
    // Check if there are changes compared to original data
    if (originalFormData) {
      const hasChanges = JSON.stringify(updatedFormData) !== JSON.stringify(originalFormData);
      setUnsavedChanges(hasChanges);
    }
  };
  
  // Open the FormDbUpload dialog
  const handleSaveClick = () => {
    if (!formData) {
      showSnackbar('No form data to save', 'error');
      return;
    }
    
    setShowSaveDialog(true);
  };
  
  // Handle save complete (success or failure)
  const handleSaveComplete = (success, message) => {
    setShowSaveDialog(false);
    
    if (success) {
      // Update original data to match current state to reset unsaved changes flag
      setOriginalFormData(JSON.parse(JSON.stringify(formData)));
      setUnsavedChanges(false);
      showSnackbar(message || 'Form saved successfully', 'success');
    } else {
      showSnackbar(message || 'Failed to save form', 'error');
    }
  };
  
  // Handle export button click for JSON download
  const handleExportClick = async () => {
    if (!formData) {
      setExportError('No form data to export');
      return;
    }
    
    setExportLoading(true);
    setExportError(null);
    
    try {
      // Use the exportFormAsJson utility
      const success = exportFormAsJson(formData.pages);
      
      if (success) {
        showSnackbar('Form exported successfully', 'success');
      } else {
        throw new Error('Failed to export form');
      }
    } catch (err) {
      console.error('Error exporting form:', err);
      setExportError('Error exporting form: ' + (err.message || 'Unknown error'));
      showSnackbar('Error exporting form', 'error');
    } finally {
      setExportLoading(false);
    }
  };
  
  // Open delete confirmation dialog
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    setDeleteError(null);
  };
  
  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };
  
  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!id) {
      setDeleteError('No question bank ID provided');
      return;
    }
    
    setDeleteLoading(true);
    setDeleteError(null);
    
    try {
      // Call the API to delete the question bank
      const response = await formExportApi.deleteForm(id);
      
      if (response && response.success) {
        // Close dialog and navigate back to dashboard with success message
        setDeleteDialogOpen(false);
        navigate('/dashboard', { 
          state: { 
            notification: {
              type: 'success',
              message: `"${questionBankTitle}" was successfully deleted.`
            }
          }
        });
      } else {
        setDeleteError('Failed to delete question bank: ' + (response?.error || 'Unknown error'));
        showSnackbar('Failed to delete question bank', 'error');
      }
    } catch (err) {
      console.error('Error deleting question bank:', err);
      setDeleteError('Error deleting question bank: ' + (err.message || 'Unknown error'));
      showSnackbar('Error deleting question bank', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };
  
  // Show snackbar notification
  const showSnackbar = (message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  // Warn about unsaved changes before leaving
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [unsavedChanges]);

  // Calculate summary stats for display
  const getSummaryStats = () => {
    if (!formData || !Array.isArray(formData.pages)) {
      return { pageCount: 0, cardCount: 0, contentCount: 0 };
    }
    
    const pageCount = formData.pages.length;
    
    let cardCount = 0;
    let contentCount = 0;
    
    formData.pages.forEach(page => {
      if (Array.isArray(page.cards)) {
        cardCount += page.cards.length;
        
        page.cards.forEach(card => {
          if (Array.isArray(card.contents)) {
            contentCount += card.contents.length;
          }
        });
      }
    });
    
    return { pageCount, cardCount, contentCount };
  };
  
  const { pageCount, cardCount, contentCount } = getSummaryStats();

  return (
    <>
      {/* Top App Bar with logout functionality */}
      <TopAppBarLoggedIn appTitle={`Edit Material: ${questionBankTitle}`} />
      
      {/* Navigation and Action Bar */}
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid #ddd', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackClick}
        >
          Back to Dashboard
        </Button>
        
        {/* Action buttons */}
        {questionBankExists && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Save button */}
            <Tooltip title={unsavedChanges ? "Save changes" : "No changes to save"}>
              <span>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CloudUploadIcon />}
                  onClick={handleSaveClick}
                  disabled={!unsavedChanges}
                >
                  {unsavedChanges ? 'Save Changes*' : 'Save'}
                </Button>
              </span>
            </Tooltip>
            
            {/* Export button */}
            <Tooltip title="Export form to JSON">
              <Button
                variant="outlined"
                color="primary"
                startIcon={<ExportIcon />}
                onClick={handleExportClick}
                disabled={exportLoading || !formData}
              >
                {exportLoading ? 'Downloading...' : 'Download JSON'}
              </Button>
            </Tooltip>
            
            {/* Delete button */}
            <Tooltip title="Delete this question bank permanently">
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteClick}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </Tooltip>
          </Box>
        )}
      </Box>
      
      {/* Export error message */}
      {exportError && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error" onClose={() => setExportError(null)}>
            {exportError}
          </Alert>
        </Box>
      )}
      
      {/* Loading state */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Error state */}
      {!loading && error && (
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={handleBackClick}>
            Return to Dashboard
          </Button>
        </Box>
      )}
      
      {/* Form Editor */}
      {!loading && !error && questionBankExists && (
        <FormEditor 
          questionBankId={id}
          initialData={formData} // Pass the initial data
          onFormDataChange={handleFormDataChange}
        />
      )}
      
      {/* FormDbUpload dialog */}
      {showSaveDialog && formData && (
        <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Save Form Changes
          </DialogTitle>
          
          <DialogContent>
            <DialogContentText>
              Update form details for database storage. This will save your form using a delete-and-recreate approach.
            </DialogContentText>
            
            <Box sx={{ my: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Form data summary:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • {pageCount} page(s) • {cardCount} card(s) • {contentCount} content item(s)
              </Typography>
            </Box>
            
            {/* Embed FormDbUpload component without its button */}
            <Box sx={{ mt: 2 }}>
              <FormDbUpload 
                pages={formData.pages} 
                title={questionBankTitle}
                description={questionBankDescription}
                formId={id}
                onSaveComplete={handleSaveComplete}
                embedded={true} // Signal that this is embedded in another dialog
              />
            </Box>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setShowSaveDialog(false)} color="primary">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Delete Question Bank Permanently?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete <strong>{questionBankTitle}</strong>? This action cannot be undone and all associated data will be permanently removed from the system.
          </DialogContentText>
          
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            autoFocus
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography>Deleting...</Typography>
              </Box>
            ) : (
              'Delete Permanently'
            )}
          </Button>
        </DialogActions>
      </Dialog>
      
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

export default FormEditorPage;