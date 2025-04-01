// src/components/formbuilder/shared/MediaPreview.js
import React from 'react';
import { Box, Typography, IconButton } from "@mui/material";
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import VideocamIcon from '@mui/icons-material/Videocam';
import DeleteIcon from '@mui/icons-material/Delete';

const MediaPreview = ({ media, onRemove }) => {
  if (!media) return null;
  
  return (
    <Box sx={{ mt: 1, mb: 2, position: 'relative', border: '1px solid #eee', borderRadius: 1, p: 1 }}>
      {media.type === 'image' && (
        <Box sx={{ textAlign: 'center' }}>
          <img 
            src={media.url} 
            alt={media.name} 
            style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain' }} 
          />
        </Box>
      )}
      
      {media.type === 'audio' && (
        <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
          <AudiotrackIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="body2">{media.name}</Typography>
          <audio controls style={{ marginLeft: '8px', height: '30px' }}>
            <source src={media.url} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </Box>
      )}
      
      {media.type === 'video' && (
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <VideocamIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="body2">{media.name}</Typography>
          </Box>
          <video controls width="100%" style={{ maxHeight: '150px' }}>
            <source src={media.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </Box>
      )}
      
      <IconButton 
        size="small" 
        onClick={onRemove}
        sx={{ 
          position: 'absolute',
          top: '5px',
          right: '5px',
          backgroundColor: 'rgba(255,255,255,0.8)',
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' }
        }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default MediaPreview;