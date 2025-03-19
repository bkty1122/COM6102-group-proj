// src/components/formbuilder/shared/AvailableMedia.js
import React, { useState } from 'react';
import { Box, Typography, Button } from "@mui/material";
import { useDraggable } from '@dnd-kit/core';
import ImageIcon from '@mui/icons-material/Image';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { MediaPicker } from './MediaComponents';

const AddMediaButton = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: "media",
    data: {
      type: 'media-component'
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <>
      <Box
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
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
          cursor: isDragging ? 'grabbing' : 'grab',
          opacity: isDragging ? 0.6 : 1,
          boxShadow: isDragging ? 3 : 1,
          transition: 'box-shadow 0.2s, opacity 0.2s',
          width: '100%'
        }}
      >
        <ImageIcon sx={{ fontSize: '2rem', mb: 1 }} />
        <Typography variant="subtitle2">Add Media</Typography>
        <Typography variant="caption" color="text.secondary">
          Drag to add images, audio, or video
        </Typography>
      </Box>

      <Button
        variant="outlined"
        color="primary"
        startIcon={<CloudUploadIcon />}
        onClick={() => setDialogOpen(true)}
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