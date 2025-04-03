// /workspaces/COM6102-group-proj/frontend/src/pages/FormExportsPage.js
import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Button, 
  CircularProgress, IconButton, Box, Snackbar, Alert,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { formExportApi } from '../api';
import useApiProgress from '../api/useApiProgress';
import { extractErrorMessage } from '../api/errorUtils';

const FormExportsPage = () => {
  const [forms, setForms] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { loading, error, success, callApi, reset } = useApiProgress();

  // Load forms when component mounts
  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    callApi(
      async () => {
        const response = await formExportApi.listForms();
        if (response.success && response.data) {
          setForms(response.data);
        }
        return response;
      },
      {
        errorMessage: 'Failed to load exported forms'
      }
    );
  };

  const handleDownload = (id) => {
    window.open(formExportApi.getDownloadUrl(id), '_blank');
  };

  const confirmDelete = (id) => {
    setDeleteTarget(id);
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    callApi(
      async () => {
        const response = await formExportApi.deleteForm(deleteTarget);
        if (response.success) {
          // Remove the deleted form from the state
          setForms(forms.filter(form => form.questionbank_id !== deleteTarget));
          setDeleteTarget(null);
        }
        return response;
      },
      {
        successMessage: 'Form deleted successfully',
        errorMessage: 'Failed to delete form'
      }
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Exported Forms
        </Typography>
        
        <Button 
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchForms}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      
      {loading && forms.length === 0 ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Export Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {forms.length > 0 ? (
                forms.map((form) => (
                  <TableRow key={form.questionbank_id}>
                    <TableCell>{form.title}</TableCell>
                    <TableCell>
                      {new Date(form.export_date).toLocaleString()}
                    </TableCell>
                    <TableCell>{form.status || 'Draft'}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleDownload(form.questionbank_id)}
                        title="Download"
                      >
                        <DownloadIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => confirmDelete(form.questionbank_id)}
                        title="Delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No forms have been exported yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onClose={cancelDelete}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this form? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification snackbar */}
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
    </Container>
  );
};

export default FormExportsPage;