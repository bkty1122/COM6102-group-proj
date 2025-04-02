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
  Typography
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExportIcon from '@mui/icons-material/GetApp';
import DeleteIcon from '@mui/icons-material/Delete';

// Shared Components
import TopAppBarLoggedIn from '../components/shared/TopAppBarLoggedIn';

// Form Editor Components
import FormEditor from '../components/formeditor/FormEditor';

// API for fetching question bank existence
import formExportApi from '../api/formExportApi';

const FormEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questionBankExists, setQuestionBankExists] = useState(false);
  const [questionBankTitle, setQuestionBankTitle] = useState('');
  const [formData, setFormData] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  
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
          setFormData(response.data);
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
    navigate('/dashboard');
  };
  
  // Handle export button click
  const handleExportClick = async () => {
    if (!formData) {
      setExportError('No form data to export');
      return;
    }
    
    setExportLoading(true);
    setExportError(null);
    
    try {
      const response = await formExportApi.exportForm(formData);
      if (response && response.success) {
        // Trigger download of exported JSON
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${questionBankTitle || 'form'}_export.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        
        // Also save to database
        await formExportApi.saveForm(formData);
      } else {
        setExportError('Failed to export form: ' + (response?.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error exporting form:', err);
      setExportError('Error exporting form: ' + (err.message || 'Unknown error'));
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
      }
    } catch (err) {
      console.error('Error deleting question bank:', err);
      setDeleteError('Error deleting question bank: ' + (err.message || 'Unknown error'));
    } finally {
      setDeleteLoading(false);
    }
  };

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
            {/* Export button */}
            <Tooltip title="Export form to JSON">
              <Button
                variant="contained"
                color="primary"
                startIcon={<ExportIcon />}
                onClick={handleExportClick}
                disabled={exportLoading || !formData}
              >
                {exportLoading ? 'Downloading...' : 'Download Form'}
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
          onFormDataChange={(updatedFormData) => setFormData(updatedFormData)}
        />
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
    </>
  );
};

export default FormEditorPage;