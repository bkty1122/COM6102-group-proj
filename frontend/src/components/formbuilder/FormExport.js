// src/components/formbuilder/FormExport.js
import React from 'react';
import { Button, Snackbar, Alert, CircularProgress } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import useApiProgress from '../../api/useApiProgress';
import { extractErrorMessage } from '../../api/errorUtils';
import { transformFormBuilderToExportFormat } from '../../utils/formDataTransformer';

const FormExport = ({ pages, title = "Form Builder Export", description = "" }) => {
  const { loading, error, success, callApi, reset } = useApiProgress();

  // Download form as JSON file directly
  const handleExport = () => {
    try {
      // First, ensure pages are in the right format
      const preparedPages = pages.map(page => {
        // Create structured page data for transformation
        const structuredPage = {
          ...page,
          examCategories: page.examCategories || {
            exam_language: 'en'
          },
          cardContents: {}
        };

        // Set up cards array and cardContents if needed
        if (page.cards) {
          // Handle material and question cards
          if (Array.isArray(page.cards.material)) {
            page.cards.material.forEach(cardId => {
              if (!structuredPage.cardContents[cardId] && page.cardContents && page.cardContents[cardId]) {
                structuredPage.cardContents[cardId] = page.cardContents[cardId];
              }
            });
          }

          if (Array.isArray(page.cards.question)) {
            page.cards.question.forEach(cardId => {
              if (!structuredPage.cardContents[cardId] && page.cardContents && page.cardContents[cardId]) {
                structuredPage.cardContents[cardId] = page.cardContents[cardId];
              }
            });
          }
        }
        
        return structuredPage;
      });

      // Transform data for export
      const formData = transformFormBuilderToExportFormat({
        title: title,
        description: description,
        exportDate: new Date().toISOString(),
        pages: preparedPages
      });
      
      // Log data to confirm transformation worked
      console.log('Exporting form data with contents:', formData);
      
      // Create a download link for the JSON
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${title || 'form'}_export.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      // Show success message
      reset(); // Reset previous state
      callApi(
        () => Promise.resolve({ success: true, message: 'Form downloaded successfully' }),
        {
          successMessage: 'Form downloaded successfully!',
          errorMessage: 'Failed to export form',
          skipApiCall: true // We already handled the download
        }
      );
    } catch (err) {
      console.error('Error exporting form:', err);
      callApi(
        () => Promise.reject(new Error('Failed to export form: ' + err.message)),
        {
          errorMessage: 'Failed to export form',
          skipApiCall: true // We're handling the error here
        }
      );
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <DownloadIcon />}
        onClick={handleExport}
        disabled={loading}
        sx={{ ml: 2 }}
      >
        {loading ? 'Downloading...' : 'Download JSON'}
      </Button>
      
      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={reset}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {error ? (
          <Alert onClose={reset} severity="error" sx={{ width: '100%' }}>
            {extractErrorMessage(error)}
          </Alert>
        ) : (
          <Alert onClose={reset} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        )}
      </Snackbar>
    </>
  );
};

export default FormExport;