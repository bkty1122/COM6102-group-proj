// src/components/formbuilder/shared/MediaPicker.js
import React, { useState } from 'react';
import { 
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, 
  Tabs, Tab, Divider, Alert, Snackbar 
} from "@mui/material";
import MediaGrid from './MediaGrid';
import MediaUploader from './MediaUploader';

const MediaPicker = ({ open, onClose, onSelectMedia }) => {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSelect = (media) => {
    setSelectedMedia(media);
  };

  const handleConfirm = () => {
    if (selectedMedia) {
      onSelectMedia(selectedMedia);
      onClose();
    }
  };

  const showAlert = (message, severity) => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Media Library</DialogTitle>
      <DialogContent>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="media tabs" sx={{ mb: 2 }}>
          <Tab label="Browse Media" />
          <Tab label="Upload New" />
        </Tabs>

        {/* Browse existing media tab */}
        {tabValue === 0 && (
          <MediaGrid 
            selectedMedia={selectedMedia} 
            onSelectMedia={handleSelect} 
          />
        )}

        {/* Upload new media tab */}
        {tabValue === 1 && (
          <MediaUploader 
            onSelectMedia={handleSelect}
            showAlert={showAlert}
          />
        )}
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            {selectedMedia && (
              <Typography variant="body2">
                Selected: <strong>{selectedMedia.name}</strong> ({selectedMedia.type})
              </Typography>
            )}
          </Box>
          <Box>
            <Button onClick={onClose} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleConfirm}
              disabled={!selectedMedia}
            >
              Select
            </Button>
          </Box>
        </Box>
      </DialogContent>
      
      <Snackbar 
        open={alertOpen} 
        autoHideDuration={6000} 
        onClose={() => setAlertOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setAlertOpen(false)} 
          severity={alertSeverity} 
          sx={{ width: '100%' }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default MediaPicker;