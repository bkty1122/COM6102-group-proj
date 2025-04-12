// src/components/formbuilder/shared/QuestionMedia.js
import React, { useState } from "react";
import { Box, Button, Typography, Tooltip } from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import VideocamIcon from "@mui/icons-material/Videocam";
import DeleteIcon from "@mui/icons-material/Delete";
import { MediaPicker } from "../../media/MediaComponents";

const QuestionMedia = ({ 
  media, 
  onMediaChange, 
  label = "Add Media",
  type = "question",
  index = null
}) => {
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  
  // This function handles extracting just the URL from the media object
  const handleSelectMedia = (selectedMedia) => {
    // If the selectedMedia is a full object with url property, extract just the URL
    const mediaUrl = typeof selectedMedia === 'object' && selectedMedia !== null 
      ? selectedMedia.url // Extract just the URL from the media object
      : selectedMedia;    // If it's already a string or null, use as is
    
    onMediaChange(type, mediaUrl, index);
    setMediaDialogOpen(false);
  };
  
  const handleRemoveMedia = () => {
    onMediaChange(type, null, index);
  };
  
  // Get icon based on media type
  const getMediaIcon = () => {
    if (!media) return <ImageIcon />;
    
    // Check if the URL ends with common extensions
    const url = media.toString().toLowerCase();
    if (url.match(/\.(mp3|wav|ogg|aac)$/)) {
      return <AudiotrackIcon />;
    } else if (url.match(/\.(mp4|webm|mov|avi)$/)) {
      return <VideocamIcon />;
    } else {
      return <ImageIcon />;
    }
  };
  
  // Render media preview
  const renderMediaPreview = () => {
    if (!media) return null;
    
    const url = media.toString();
    
    // Simple extension check to determine type
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      return (
        <Box
          component="img"
          src={url}
          alt="Question media"
          sx={{
            maxWidth: '100%',
            maxHeight: '200px',
            objectFit: 'contain',
            borderRadius: '4px'
          }}
        />
      );
    } else if (url.match(/\.(mp3|wav|ogg|aac)$/i)) {
      return (
        <Box component="audio" controls sx={{ width: '100%' }}>
          <source src={url} />
          Your browser does not support the audio element.
        </Box>
      );
    } else if (url.match(/\.(mp4|webm|mov|avi)$/i)) {
      return (
        <Box component="video" controls sx={{ width: '100%', maxHeight: '200px' }}>
          <source src={url} />
          Your browser does not support the video element.
        </Box>
      );
    } else {
      // If we can't determine the type, show the URL
      return (
        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
          {url}
        </Typography>
      );
    }
  };
  
  return (
    <>
      {!media ? (
        // Show selector when no media is selected
        <Button
          variant="outlined"
          startIcon={getMediaIcon()}
          onClick={() => setMediaDialogOpen(true)}
          size="small"
          sx={{ mb: 2 }}
        >
          {label}
        </Button>
      ) : (
        // Show preview when media is selected
        <Box 
          sx={{ 
            mt: 2,
            mb: 2,
            position: 'relative',
            border: '1px solid #eee',
            borderRadius: '4px',
            p: 1
          }}
        >
          <Box sx={{ mb: 1 }}>
            {renderMediaPreview()}
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {media.split('/').pop()} {/* Show filename from URL */}
            </Typography>
            
            <Box>
              <Tooltip title="Change media">
                <Button 
                  size="small" 
                  onClick={() => setMediaDialogOpen(true)}
                >
                  Change
                </Button>
              </Tooltip>
              
              <Tooltip title="Remove media">
                <Button 
                  size="small" 
                  color="error"
                  onClick={handleRemoveMedia}
                >
                  <DeleteIcon fontSize="small" />
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      )}
      
      {/* Media picker dialog */}
      <MediaPicker
        open={mediaDialogOpen}
        onClose={() => setMediaDialogOpen(false)}
        onSelectMedia={handleSelectMedia}
        title={`Select ${type} Media`}
        forQuestionMedia={true} // Important - tell MediaPicker this is for question media
      />
    </>
  );
};

export default QuestionMedia;