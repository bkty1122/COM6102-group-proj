// src/components/formbuilder/FormDbUpload.js
import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Box,
  Typography
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { formApi } from '../../api/formApi';
import formExportApi from '../../api/formExportApi';
import { validateForm, checkForDuplicateIds } from '../../utils/formValidation';
import { transformFormBuilderToExportFormat } from '../../utils/formDataTransformer';

// Safely count items in pages structure
const safeCountItems = (pages) => {
  if (!Array.isArray(pages)) {
    return { pageCount: 0, cardCount: 0, contentCount: 0 };
  }
  
  const pageCount = pages.length;
  
  // Count cards safely
  const cardCount = pages.reduce((count, page) => {
    if (!page || !Array.isArray(page.cards)) return count;
    return count + page.cards.length;
  }, 0);
  
  // Count contents safely
  const contentCount = pages.reduce((count, page) => {
    if (!page || !page.cardContents) return count;
    
    // Sum the lengths of all content arrays in cardContents
    return count + Object.values(page.cardContents).reduce((cardContentCount, contents) => {
      if (!Array.isArray(contents)) return cardContentCount;
      return cardContentCount + contents.length;
    }, 0);
  }, 0);
  
  return { pageCount, cardCount, contentCount };
};

const FormDbUpload = forwardRef(({ 
  pages = [], 
  title = "Form Builder Export", 
  description = "",
  formId = null,  // Form ID for update operations
  onSaveComplete = null,  // Callback when save is complete
  embedded = false  // Whether this component is embedded in another dialog
  }, ref) => {
  const [open, setOpen] = useState(embedded);
  
  // Expose methods to parent component through ref
  useImperativeHandle(ref, () => ({
    click: () => handleOpen()
  }));

  const [formTitle, setFormTitle] = useState(title);
  const [formDescription, setFormDescription] = useState(description);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [internalFormId, setInternalFormId] = useState(formId); // Create internal state for the form ID
  
  // Update state when props change
  useEffect(() => {
    setFormTitle(title);
    setFormDescription(description);
    setInternalFormId(formId);
  }, [title, description, formId]);
  
  // Get counts safely
  const { pageCount, cardCount, contentCount } = safeCountItems(pages);
  
  const handleOpen = () => {
    setOpen(true);
    setResult(null);
    setValidationErrors([]);
  };
  
  const handleClose = () => {
    setOpen(false);
    // If there's a callback and we're embedded, let the parent know we're closing
    if (embedded && onSaveComplete) {
      onSaveComplete(false, "Cancelled");
    }
  };
  
  const handleTitleChange = (e) => {
    setFormTitle(e.target.value);
  };
  
  const handleDescriptionChange = (e) => {
    setFormDescription(e.target.value);
  };
  
  const handlePublishedChange = (e) => {
    setIsPublished(e.target.checked);
  };
  
  // Handle form upload to database
  const handleUpload = async () => {
    try {
      setLoading(true);
      setResult(null);
      setValidationErrors([]);
      
      // Use either internal ID or prop ID
      const currentFormId = internalFormId || formId;
      
      // Prepare form data for export
      const formData = transformFormBuilderToExportFormat({
        title: formTitle,
        description: formDescription,
        exportDate: new Date().toISOString(),
        pages,
        questionbank_id: currentFormId // Include the ID if updating
      });
      
      // Add debug logging
      console.log('Submitting form data:', {
        title: formData.title,
        pageCount: formData.pages?.length,
        hasId: !!currentFormId
      });
      
      // Validate form data
      const validation = validateForm(formData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setLoading(false);
        
        // Call callback with failure
        if (onSaveComplete) {
          onSaveComplete(false, "Validation failed: " + validation.errors.map(e => e.message).join(", "));
        }
        return;
      }
      
      // Check for duplicate IDs
      const duplicateCheck = checkForDuplicateIds(formData);
      if (duplicateCheck.hasDuplicates) {
        const errorMessage = `Duplicate content IDs found: ${duplicateCheck.duplicateIds.join(', ')}`;
        setValidationErrors([
          { field: 'general', message: errorMessage }
        ]);
        setLoading(false);
        
        // Call callback with failure
        if (onSaveComplete) {
          onSaveComplete(false, errorMessage);
        }
        return;
      }
      
      let response;
      
      // If we're updating an existing form, delete it first to avoid duplicate ID issues
      if (currentFormId) {
        try {
          console.log('Deleting existing form before update:', currentFormId);
          
          // Delete the existing form
          const deleteResponse = await formExportApi.deleteForm(currentFormId);
          
          if (!deleteResponse || !deleteResponse.success) {
            throw new Error('Failed to delete existing form before update');
          }
          
          console.log('Successfully deleted form before update');
          
          // Small delay to ensure deletion is processed
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Now save as a new form but with the same ID
          response = await formApi.saveForm(formData, isPublished);
        } catch (deleteError) {
          console.error('Error deleting existing form:', deleteError);
          throw new Error('Failed to delete existing form: ' + deleteError.message);
        }
      } else {
        // If it's a new form, just save it
        response = await formApi.saveForm(formData, isPublished);
      }
      
      // Add debug logging
      console.log('API Response:', response);
      
      // Handle successful response
      if (response && response.data && response.data.success) {
        const newFormId = response.data.form?.id || currentFormId;
        
        // Update internal form ID
        setInternalFormId(newFormId);
        
        // Create success message
        const successMessage = currentFormId 
          ? `Form updated successfully with ID: ${newFormId}` 
          : `Form saved successfully with ID: ${newFormId}`;
          
        // Update UI with success
        setResult({
          success: true,
          message: successMessage
        });
        
        // Call callback with success
        if (onSaveComplete) {
          onSaveComplete(true, successMessage);
        }
        
        // Close dialog if embedded
        if (embedded) {
          setTimeout(() => setOpen(false), 1500);
        }
      } else {
        // Handle unexpected response format
        throw new Error('Invalid response format from the server');
      }
    } catch (error) {
      console.error('Error uploading form:', error);
      
      // Create error message
      const errorMessage = error.response?.data?.message || error.message || 'Error uploading form to the database';
      
      // Update UI with error
      setResult({
        success: false,
        message: errorMessage,
        error
      });
      
      // Call callback with failure
      if (onSaveComplete) {
        onSaveComplete(false, errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // If embedded, return just the form without the button and dialog wrapper
  if (embedded) {
    return (
      <>
        {validationErrors.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="error">
              <Typography variant="subtitle1">Please fix the following errors:</Typography>
              <ul>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </Alert>
          </Box>
        )}
        
        {result && (
          <Alert severity={result.success ? "success" : "error"} sx={{ mb: 2 }}>
            {result.message}
          </Alert>
        )}
        
        <TextField
          autoFocus
          margin="dense"
          id="title"
          label="Form Title"
          type="text"
          fullWidth
          variant="outlined"
          value={formTitle}
          onChange={handleTitleChange}
          sx={{ mb: 2 }}
        />
        
        <TextField
          margin="dense"
          id="description"
          label="Form Description"
          type="text"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={formDescription}
          onChange={handleDescriptionChange}
          sx={{ mb: 2 }}
        />
        
        <FormControlLabel
          control={
            <Switch 
              checked={isPublished} 
              onChange={handlePublishedChange} 
              color="primary" 
            />
          }
          label="Publish form (makes it available to users)"
        />
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Form data preview:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • {pageCount} page(s)  
            • {cardCount} card(s)  
            • {contentCount} content item(s)
          </Typography>
        </Box>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            onClick={handleUpload} 
            color="primary" 
            variant="contained"
            disabled={loading || !formTitle}
            startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          >
            {loading ? 'Saving...' : (internalFormId || formId ? 'Update Form' : 'Save Form')}
          </Button>
        </Box>
      </>
    );
  }
  
  // Regular non-embedded mode with button and dialog
  return (
    <>
      <Button
        variant="contained"
        color="secondary"
        startIcon={<CloudUploadIcon />}
        onClick={handleOpen}
        sx={{ ml: 2 }}
      >
        Save to DB
      </Button>
      
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {internalFormId || formId ? 'Update Form in Database' : 'Save Form to Database'}
        </DialogTitle>
        
        <DialogContent>
          {validationErrors.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="error">
                <Typography variant="subtitle1">Please fix the following errors:</Typography>
                <ul>
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error.message}</li>
                  ))}
                </ul>
              </Alert>
            </Box>
          )}
          
          {result && (
            <Alert severity={result.success ? "success" : "error"} sx={{ mb: 2 }}>
              {result.message}
            </Alert>
          )}
          
          <DialogContentText>
            Enter form details for database storage. This will save your form to the server.
          </DialogContentText>
          
          <TextField
            autoFocus
            margin="dense"
            id="title"
            label="Form Title"
            type="text"
            fullWidth
            variant="outlined"
            value={formTitle}
            onChange={handleTitleChange}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            id="description"
            label="Form Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formDescription}
            onChange={handleDescriptionChange}
            sx={{ mb: 2 }}
          />
          
          <FormControlLabel
            control={
              <Switch 
                checked={isPublished} 
                onChange={handlePublishedChange} 
                color="primary" 
              />
            }
            label="Publish form (makes it available to users)"
          />
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Form data preview:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • {pageCount} page(s)  
              • {cardCount} card(s)  
              • {contentCount} content item(s)
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            color="primary" 
            variant="contained"
            disabled={loading || !formTitle}
            startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          >
            {loading ? 'Saving...' : (internalFormId || formId ? 'Update Form' : 'Save Form')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

export default FormDbUpload;