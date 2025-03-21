// src/components/formbuilder/shared/AvailableMedia.js
import React, { useState } from 'react';
import { Box, Typography, Button, Paper } from "@mui/material";
import ImageIcon from '@mui/icons-material/Image';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { MediaPicker } from './MediaComponents';

const AddMediaButton = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const handleOpenMediaDialog = () => {
    setDialogOpen(true);
  };

  return (
    <>
      <Paper
        elevation={1}
        onClick={handleOpenMediaDialog}
        sx={{
          p: 2,
          mb: 2,
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#e3f2fd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          cursor: 'pointer',
          transition: 'box-shadow 0.2s, transform 0.2s',
          width: '100%',
          '&:hover': {
            boxShadow: 3,
            transform: 'translateY(-2px)',
            backgroundColor: '#d0e8fd',
          },
          '&:active': {
            transform: 'translateY(0px)',
          }
        }}
      >
        <ImageIcon sx={{ fontSize: '2rem', mb: 1 }} />
        <Typography variant="subtitle2">Add Media</Typography>
        <Typography variant="caption" color="text.secondary">
          Click to upload images, audio, or video
        </Typography>
      </Paper>

      <Button
        variant="outlined"
        color="primary"
        startIcon={<CloudUploadIcon />}
        onClick={handleOpenMediaDialog}
        fullWidth
        sx={{ mb: 2 }}
      >
        Browse Media
      </Button>

      <MediaPicker
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelectMedia={(media) => {
          console.log("Media selected:", media);
          setDialogOpen(false);
        }}
      />
    </>
  );
};

const AvailableMedia = () => {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Media</Typography>
      <AddMediaButton />
    </Box>
  );
};

export default AvailableMedia;