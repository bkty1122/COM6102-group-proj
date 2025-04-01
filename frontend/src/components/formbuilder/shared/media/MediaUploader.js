// src/components/formbuilder/shared/MediaUploader.js
import React, { useState, useRef } from 'react';
import { 
  Box, Typography, Card, CircularProgress, TextField, MenuItem, Select, FormControl,
  InputLabel, Divider, Button, IconButton
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import VideocamIcon from '@mui/icons-material/Videocam';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const MediaUploader = ({ 
  onSelectMedia, 
  showAlert 
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [mediaName, setMediaName] = useState('');
  const [mediaType, setMediaType] = useState('image');
  
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    let fileType = '';
    if (file.type.startsWith('image/')) {
      fileType = 'image';
    } else if (file.type.startsWith('audio/')) {
      fileType = 'audio';
    } else if (file.type.startsWith('video/')) {
      fileType = 'video';
    } else {
      showAlert("Unsupported file type. Please upload an image, audio, or video file.", "error");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      showAlert("File is too large. Maximum size is 10MB.", "error");
      return;
    }

    setUploadedFile(file);
    setMediaType(fileType);
    setMediaName(file.name.substring(0, file.name.lastIndexOf('.')) || file.name);
    
    // Simulate upload
    simulateUpload();
  };

  const simulateUpload = () => {
    setUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          showAlert("File uploaded successfully!", "success");
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleUpload = () => {
    if (!uploadedFile || !mediaName) {
      showAlert("Please select a file and provide a name.", "error");
      return;
    }

    // Create a new media object
    const newMedia = {
      id: `uploaded-${Date.now()}`,
      name: mediaName,
      type: mediaType,
      url: URL.createObjectURL(uploadedFile),
      thumbnail: mediaType === 'image' 
        ? URL.createObjectURL(uploadedFile) 
        : mediaType === 'audio' 
          ? 'https://via.placeholder.com/300x200?text=Audio+File' 
          : 'https://via.placeholder.com/300x200?text=Video+File'
    };

    // Select the newly uploaded media
    onSelectMedia(newMedia);
    showAlert("Media ready to use! Click 'Select' to add it to your content.", "success");
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current.click();
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setMediaName('');
    setUploadProgress(0);
    setUploading(false);
  };

  return (
    <Box sx={{ py: 2 }}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        accept="image/*,audio/*,video/*"
      />
      
      {!uploadedFile ? (
        <Box 
          sx={{ 
            border: '2px dashed #ccc', 
            borderRadius: 2, 
            p: 4, 
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: '#f8f8f8',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: '#f0f7ff'
            }
          }}
          onClick={handleTriggerFileInput}
        >
          <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6">Click to select a file</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Supports images, audio, and video files (max 10MB)
          </Typography>
        </Box>
      ) : (
        <Box>
          <Card sx={{ mb: 3 }}>
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
              {uploading ? (
                <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
                  <CircularProgress variant="determinate" value={uploadProgress} />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {`${Math.round(uploadProgress)}%`}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                mediaType === 'image' ? (
                  <ImageIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                ) : mediaType === 'audio' ? (
                  <AudiotrackIcon sx={{ fontSize: 40, mr: 2, color: 'secondary.main' }} />
                ) : (
                  <VideocamIcon sx={{ fontSize: 40, mr: 2, color: 'tertiary.main' }} />
                )
              )}
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1">{uploadedFile.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • {mediaType.toUpperCase()} File
                </Typography>
              </Box>
              <IconButton onClick={resetUpload} disabled={uploading}>
                <DeleteIcon />
              </IconButton>
            </Box>
            
            {uploadProgress === 100 && (
              <>
                <Divider />
                <Box sx={{ p: 3 }}>
                  {mediaType === 'image' && uploadedFile && (
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                      <img 
                        src={URL.createObjectURL(uploadedFile)} 
                        alt="Preview" 
                        style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} 
                      />
                    </Box>
                  )}
                  
                  {mediaType === 'audio' && uploadedFile && (
                    <Box sx={{ mb: 2 }}>
                      <audio controls style={{ width: '100%' }}>
                        <source src={URL.createObjectURL(uploadedFile)} />
                        Your browser does not support the audio element.
                      </audio>
                    </Box>
                  )}
                  
                  {mediaType === 'video' && uploadedFile && (
                    <Box sx={{ mb: 2 }}>
                      <video controls style={{ width: '100%', maxHeight: '200px' }}>
                        <source src={URL.createObjectURL(uploadedFile)} />
                        Your browser does not support the video element.
                      </video>
                    </Box>
                  )}
                  
                  <TextField
                    label="Media Name"
                    value={mediaName}
                    onChange={(e) => setMediaName(e.target.value)}
                    fullWidth
                    margin="normal"
                  />
                  
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Media Type</InputLabel>
                    <Select
                      value={mediaType}
                      label="Media Type"
                      onChange={(e) => setMediaType(e.target.value)}
                    >
                      <MenuItem value="image">Image</MenuItem>
                      <MenuItem value="audio">Audio</MenuItem>
                      <MenuItem value="video">Video</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </>
            )}
          </Card>
          
          {uploadProgress === 100 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                color="secondary" 
                onClick={handleTriggerFileInput}
                sx={{ mr: 1 }}
              >
                Change File
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleUpload}
              >
                Use Media
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default MediaUploader;