// src/components/formbuilder/shared/MediaUploader.js
import React, { useState, useRef } from 'react';
import { 
  Box, Typography, Card, CircularProgress, TextField, MenuItem, Select, FormControl,
  InputLabel, Divider, Button, IconButton, Alert, Grid
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import VideocamIcon from '@mui/icons-material/Videocam';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FolderIcon from '@mui/icons-material/Folder';
import mediaApi from '../../../api/mediaApi';

const MediaUploader = ({ 
  onSelectMedia, 
  showAlert,
  onUploadComplete = () => {}
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [mediaName, setMediaName] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [folder, setFolder] = useState('');
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedMediaInfo, setUploadedMediaInfo] = useState(null);
  
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset states
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress(0);
    setUploadedMediaInfo(null);

    // Determine file type
    let fileType = '';
    if (file.type.startsWith('image/')) {
      fileType = 'image';
    } else if (file.type.startsWith('audio/')) {
      fileType = 'audio';
    } else if (file.type.startsWith('video/')) {
      fileType = 'video';
    } else {
      setUploadError("Unsupported file type. Please upload an image, audio, or video file.");
      if (showAlert) showAlert("Unsupported file type. Please upload an image, audio, or video file.", "error");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File is too large. Maximum size is 10MB.");
      if (showAlert) showAlert("File is too large. Maximum size is 10MB.", "error");
      return;
    }

    // Set file info
    setUploadedFile(file);
    setMediaType(fileType);
    setMediaName(file.name.substring(0, file.name.lastIndexOf('.')) || file.name);
  };

  // Handle upload to S3 via API
  const handleUpload = async () => {
    if (!uploadedFile || !mediaName) {
      setUploadError("Please select a file and provide a name.");
      if (showAlert) showAlert("Please select a file and provide a name.", "error");
      return;
    }

    try {
      setUploadError(null);
      setUploading(true);
      setUploadProgress(0);
      
      // Prepare metadata
      const metadata = {
        name: mediaName,
        type: mediaType,
        folder: folder || undefined
      };
      
      // Upload to S3 via API
      const response = await mediaApi.uploadMedia(
        uploadedFile, 
        metadata, 
        (progress) => setUploadProgress(progress)
      );
      
      if (response.success) {
        setUploadSuccess(true);
        setUploadedMediaInfo(response.data);
        if (showAlert) showAlert("File uploaded successfully!", "success");
        
        // Notify parent component
        onUploadComplete(response.data);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(error.message || 'Upload failed. Please try again.');
      if (showAlert) showAlert(error.message || 'Upload failed. Please try again.', "error");
    } finally {
      setUploading(false);
    }
  };

  // Select the uploaded media
  const handleSelectUploadedMedia = () => {
    if (uploadedMediaInfo) {
      onSelectMedia(uploadedMediaInfo);
      if (showAlert) showAlert("Media selected! Click 'Select' to add it to your content.", "success");
    }
  };

  // Trigger file input click
  const handleTriggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Reset upload states
  const resetUpload = () => {
    setUploadedFile(null);
    setMediaName('');
    setUploadProgress(0);
    setUploading(false);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadedMediaInfo(null);
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
      
      {uploadError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setUploadError(null)}>
          {uploadError}
        </Alert>
      )}
      
      {uploadSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setUploadSuccess(false)}>
          File uploaded successfully!
        </Alert>
      )}
      
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
            
            {!uploading && (
              <>
                <Divider />
                <Box sx={{ p: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
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
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Media Name"
                        value={mediaName}
                        onChange={(e) => setMediaName(e.target.value)}
                        fullWidth
                        margin="dense"
                        required
                      />
                      
                      <FormControl fullWidth margin="dense">
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
                      
                      <FormControl fullWidth margin="dense">
                        <InputLabel>Folder (Optional)</InputLabel>
                        <Select
                          value={folder}
                          label="Folder (Optional)"
                          onChange={(e) => setFolder(e.target.value)}
                          displayEmpty
                        >
                          <MenuItem value="">Root</MenuItem>
                          <MenuItem value="images">Images</MenuItem>
                          <MenuItem value="audio">Audio</MenuItem>
                          <MenuItem value="video">Video</MenuItem>
                          <MenuItem value="custom">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <FolderIcon sx={{ mr: 1, fontSize: 20 }} />
                              Custom Folder
                            </Box>
                          </MenuItem>
                        </Select>
                      </FormControl>
                      
                      {folder === 'custom' && (
                        <TextField
                          label="Custom Folder Path"
                          placeholder="e.g., project/assets"
                          fullWidth
                          margin="dense"
                          onChange={(e) => setFolder(e.target.value)}
                        />
                      )}
                    </Grid>
                  </Grid>
                </Box>
              </>
            )}
          </Card>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="outlined" 
              onClick={handleTriggerFileInput}
              sx={{ mr: 1 }}
              disabled={uploading}
            >
              Change File
            </Button>
            
            {!uploadSuccess ? (
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleUpload}
                disabled={uploading || !mediaName}
                startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
              >
                {uploading ? 'Uploading...' : 'Upload to S3'}
              </Button>
            ) : (
              <Button 
                variant="contained" 
                color="secondary"
                onClick={handleSelectUploadedMedia}
              >
                Use Uploaded Media
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MediaUploader;