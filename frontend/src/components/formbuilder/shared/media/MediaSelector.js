// src/components/formbuilder/shared/MediaSelector.js
import React, { useState } from 'react';
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import DeleteIcon from '@mui/icons-material/Delete';
import MediaPicker from './MediaPicker';

const MediaSelector = ({ 
  label = "Add Media", 
  onSelectMedia, 
  currentMedia = null, 
  onRemoveMedia
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const handleSelectMedia = (media) => {
    onSelectMedia(media);
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: currentMedia ? 0 : 2 }}>
        <Button 
          variant="outlined" 
          size="small" 
          startIcon={<ImageIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{ mr: 1 }}
        >
          {label}
        </Button>
        
        {currentMedia && (
          <Tooltip title="Remove media">
            <IconButton 
              size="small" 
              color="error"
              onClick={onRemoveMedia}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      <MediaPicker
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelectMedia={(media) => {
          handleSelectMedia(media);
          setDialogOpen(false);
        }}
      />
    </>
  );
};

export default MediaSelector;