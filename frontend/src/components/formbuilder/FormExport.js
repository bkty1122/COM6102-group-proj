// /workspaces/COM6102-group-proj/frontend/src/components/formbuilder/FormExport.js
import React from 'react';
import { Button, Snackbar, Alert, CircularProgress } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { formExportApi } from '../../api';
import useApiProgress from '../../api/useApiProgress';
import { extractErrorMessage } from '../../api/errorUtils';

const FormExport = ({ pages, title }) => {
  const { loading, error, success, callApi, reset } = useApiProgress();

  // Modified handleExport function
  const handleExport = async () => {
    // Prepare the form data
    const formData = {
      title: title || 'Form Builder Export',
      pages
    };
    
    callApi(
      () => formExportApi.exportForm(formData),
      {
        successMessage: 'Form exported successfully!',
        errorMessage: 'Failed to export form',
        onSuccess: (result) => {
          if (result.success) {
            // If export was successful, navigate to the exports page
            setTimeout(() => navigate('/form-exports'), 1500);
          }
        }
      }
    );
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
        {loading ? 'Exporting...' : 'Export JSON'}
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