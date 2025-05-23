// src/components/formbuilder/shared/QuestionMedia.js
import React, { useState } from "react";
import { Box, Button, Typography, Tooltip } from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import VideocamIcon from "@mui/icons-material/Videocam";
import DeleteIcon from "@mui/icons-material/Delete";
import { MediaPicker } from "../../media/MediaComponents";
import { getMediaType, getFilenameFromUrl } from "../../../utils/mediaUtils";

const QuestionMedia = ({ 
  media, 
  onMediaChange, 
  label = "Add Media",
  type = "question",
  index = null
}) => {
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  
  // Pass the complete media object to the parent component
  // The hook will extract just the URL
  const handleSelectMedia = (selectedMedia) => {
    onMediaChange(type, selectedMedia, index);
    setMediaDialogOpen(false);
  };
  
  const handleRemoveMedia = () => {
    onMediaChange(type, null, index);
  };
  
  // Get icon based on media type
  const getMediaIcon = () => {
    if (!media) return <ImageIcon />;
    
    const mediaType = getMediaType(media);
    
    switch (mediaType) {
      case 'audio':
        return <AudiotrackIcon />;
      case 'video':
        return <VideocamIcon />;
      default:
        return <ImageIcon />;
    }
  };
  
  // Render media preview
  const renderMediaPreview = () => {
    if (!media) return null;
    
    const mediaType = getMediaType(media);
    const url = String(media);
    
    switch (mediaType) {
      case 'image':
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
      case 'audio':
        return (
          <Box component="audio" controls sx={{ width: '100%' }}>
            <source src={url} />
            Your browser does not support the audio element.
          </Box>
        );
      case 'video':
        return (
          <Box component="video" controls sx={{ width: '100%', maxHeight: '200px' }}>
            <source src={url} />
            Your browser does not support the video element.
          </Box>
        );
      default:
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
              {getFilenameFromUrl(media)} {/* Show filename from URL */}
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