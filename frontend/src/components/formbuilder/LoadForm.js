// /workspaces/COM6102-group-proj/frontend/src/components/formbuilder/LoadForm.js
import React, { useState } from 'react';
import { 
  Button, Dialog, DialogActions, DialogContent, DialogTitle,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, TextField, InputAdornment, CircularProgress,
  Typography, Divider, Box
} from '@mui/material';
import { Search as SearchIcon, Edit as EditIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { formExportApi } from '../../api';
import useApiProgress from '../../api/useApiProgress';
import { extractErrorMessage } from '../../api/errorUtils';

const LoadForm = ({ onFormLoad, buttonSx = {} }) => {
  const [open, setOpen] = useState(false);
  const [forms, setForms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { loading, error, callApi } = useApiProgress();

  const handleOpen = () => {
    setOpen(true);
    loadForms();
  };

  const handleClose = () => {
    setOpen(false);
  };

  const loadForms = async () => {
    callApi(
      async () => {
        const response = await formExportApi.listForms();
        if (response.success && response.data) {
          setForms(response.data);
        }
        return response;
      },
      {
        errorMessage: 'Failed to load saved forms'
      }
    );
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleLoadForm = async (formId) => {
    callApi(
      async () => {
        const response = await formExportApi.loadFormForEditing(formId);
        if (response.success && response.data) {
          onFormLoad(response.data);
          handleClose();
        }
        return response;
      },
      {
        errorMessage: 'Failed to load form for editing'
      }
    );
  };

  // Filter forms based on search query
  const filteredForms = forms.filter(form => 
    form.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Button 
        variant="outlined" 
        color="primary" 
        onClick={handleOpen}
        sx={buttonSx}
      >
        Load Existing Form
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Load Existing Form</DialogTitle>
        
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error" align="center" sx={{ my: 2 }}>
              {extractErrorMessage(error)}
            </Typography>
          ) : forms.length === 0 ? (
            <Typography align="center" sx={{ my: 2 }}>
              No saved forms found
            </Typography>
          ) : (
            <List sx={{ maxHeight: '50vh', overflow: 'auto' }}>
              {filteredForms.map((form) => (
                <React.Fragment key={form.questionbank_id}>
                  <ListItem>
                    <ListItemText 
                      primary={form.title || 'Untitled Form'} 
                      secondary={`Created: ${new Date(form.created_at).toLocaleString()} • Status: ${form.status || 'Draft'}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        color="primary"
                        onClick={() => handleLoadForm(form.questionbank_id)}
                        title="Edit"
                      >
                        <EditIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LoadForm;