// src/components/formbuilder/FormDbUpload.js
import React, { useState, forwardRef, useImperativeHandle } from 'react';
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

const FormDbUpload = forwardRef(({ pages = [], title = "Form Builder Export", description = "" }, ref) => {
  const [open, setOpen] = useState(false);
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
  const [formId, setFormId] = useState(null);
  
  // Get counts safely
  const { pageCount, cardCount, contentCount } = safeCountItems(pages);
  
  const handleOpen = () => {
    setOpen(true);
    setResult(null);
    setValidationErrors([]);
  };
  
  const handleClose = () => {
    setOpen(false);
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
  
  const handleUpload = async () => {
    try {
      setLoading(true);
      setResult(null);
      setValidationErrors([]);
      
      // Prepare form data for export
      const formData = transformFormBuilderToExportFormat({
        title: formTitle,
        description: formDescription,
        exportDate: new Date().toISOString(),
        pages,
        questionbank_id: formId // Include the ID if updating
      });
      
      // Add debug logging
      console.log('Submitting form data:', {
        title: formData.title,
        pageCount: formData.pages?.length,
        hasId: !!formData.questionbank_id
      });
      
      // Validate form data
      const validation = validateForm(formData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setLoading(false);
        return;
      }
      
      // Check for duplicate IDs
      const duplicateCheck = checkForDuplicateIds(formData);
      if (duplicateCheck.hasDuplicates) {
        setValidationErrors([
          { field: 'general', message: `Duplicate content IDs found: ${duplicateCheck.duplicateIds.join(', ')}` }
        ]);
        setLoading(false);
        return;
      }
      
      // Perform API call - either update or create
      let response;
      if (formId) {
        response = await formApi.updateForm(formId, formData, isPublished);
      } else {
        response = await formApi.saveForm(formData, isPublished);
      }
      
      // Add debug logging
      console.log('API Response:', response);
      
      // Handle successful response
      if (response && response.data && response.data.success) {
        const newFormId = response.data.form?.id || formId;
        
        setFormId(newFormId);
        setResult({
          success: true,
          message: formId 
            ? `Form updated successfully with ID: ${newFormId}` 
            : `Form saved successfully with ID: ${newFormId}`
        });
      } else {
        // Handle unexpected response format
        throw new Error('Invalid response format from the server');
      }
    } catch (error) {
      console.error('Error uploading form:', error);
      setResult({
        success: false,
        message: error.response?.data?.message || 'Error uploading form to the database',
        error
      });
    } finally {
      setLoading(false);
    }
  };
  
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
          {formId ? 'Update Form in Database' : 'Save Form to Database'}
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
            {loading ? 'Saving...' : (formId ? 'Update Form' : 'Save Form')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

export default FormDbUpload;