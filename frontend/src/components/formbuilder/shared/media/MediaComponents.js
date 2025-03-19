// src/components/formbuilder/shared/MediaComponents.js
import React, { useState } from 'react';
import { 
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, 
  Grid, Card, CardMedia, CardContent, CardActionArea, IconButton, Tooltip 
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import VideocamIcon from '@mui/icons-material/Videocam';
import DeleteIcon from '@mui/icons-material/Delete';

// Import mock data - in a real app, you might want to use Context or a data fetching hook
import mediaData from '../../data/media.json';

// Media Picker Dialog
export const MediaPicker = ({ open, onClose, onSelectMedia }) => {
  const [selectedMedia, setSelectedMedia] = useState(null);

  const handleSelect = (media) => {
    setSelectedMedia(media);
  };

  const handleConfirm = () => {
    if (selectedMedia) {
      onSelectMedia(selectedMedia);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Select Media</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {mediaData.media.map((media) => (
            <Grid item xs={12} sm={6} md={4} key={media.id}>
              <Card 
                sx={{ 
                  border: selectedMedia?.id === media.id ? '2px solid #1976d2' : '1px solid #eee',
                  transition: 'all 0.2s'
                }}
              >
                <CardActionArea onClick={() => handleSelect(media)}>
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="120"
                      image={media.thumbnail}
                      alt={media.name}
                      sx={{ objectFit: media.type === 'image' ? 'cover' : 'contain', p: 1 }}
                    />
                    {media.type === 'audio' && (
                      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                        <AudiotrackIcon sx={{ fontSize: '3rem', color: 'primary.main' }} />
                      </Box>
                    )}
                    {media.type === 'video' && (
                      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                        <VideocamIcon sx={{ fontSize: '3rem', color: 'primary.main' }} />
                      </Box>
                    )}
                  </Box>
                  <CardContent>
                    <Typography variant="body2">{media.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{media.type}</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
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
      </DialogContent>
    </Dialog>
  );
};

// Media Preview Component for displaying selected media
export const MediaPreview = ({ media, onRemove }) => {
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

// Media Selector component with button to open picker
export const MediaSelector = ({ 
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

// Hook to manage media selection
export const useMediaSelection = (defaultMedia = null) => {
  const [media, setMedia] = useState(defaultMedia);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState({ type: null, index: null });

  const openMediaPicker = (type, index = null) => {
    setMediaTarget({ type, index });
    setDialogOpen(true);
  };

  const handleMediaSelect = (selectedMedia) => {
    if (mediaTarget.type === 'main') {
      setMedia(selectedMedia);
    } else if (typeof mediaTarget.handler === 'function') {
      mediaTarget.handler(selectedMedia, mediaTarget.index);
    }
  };

  const removeMedia = () => {
    setMedia(null);
  };

  return {
    media,
    setMedia,
    dialogOpen,
    setDialogOpen,
    openMediaPicker,
    handleMediaSelect,
    removeMedia,
    mediaTarget
  };
};