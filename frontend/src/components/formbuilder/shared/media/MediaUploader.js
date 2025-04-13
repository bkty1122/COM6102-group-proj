// src/components/formbuilder/shared/MediaUploader.js
import React, { useState } from 'react';
import { 
  Box, Typography, Button, FormControl, InputLabel, Select, MenuItem,
  TextField, LinearProgress, Alert, Paper
} from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FolderIcon from '@mui/icons-material/Folder';
import mediaApi from '../../../../api/mediaApi';

const MediaUploader = ({ onSelectMedia, showAlert }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [folder, setFolder] = useState('root');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  // Handle file selection
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
      
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  // Handle upload process
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setProgress(0);
      
      // Upload the file
      const response = await mediaApi.uploadMedia(
        file,
        {
          name: fileName !== file.name ? fileName : undefined,
          folder: folder
        },
        (progress) => setProgress(progress)
      );
      
      // Handle successful upload
      if (response.success) {
        // Reset fields
        setFile(null);
        setFileName('');
        setPreview(null);
        
        // Show success message
        showAlert('File uploaded successfully!', 'success');
        
        // Select this media
        if (response.data) {
          onSelectMedia(response.data);
        }
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err.message || 'Error uploading file. Please try again.');
      showAlert('Upload failed: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setUploading(false);
    }
  };

  // Get custom file input ID
  const fileInputId = 'media-file-upload';

  return (
    <Box>
      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Upload form */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* File selection section */}
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 3, 
            textAlign: 'center',
            border: '1px dashed',
            borderColor: 'divider',
            backgroundColor: 'background.default'
          }}
        >
          <input
            accept="image/*,audio/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.*"
            id={fileInputId}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <label htmlFor={fileInputId}>
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
              disabled={uploading}
              sx={{ mb: 2 }}
            >
              Select File
            </Button>
          </label>
          
          {file ? (
            <Box>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
              </Typography>
              
              {/* Image preview */}
              {preview && (
                <Box 
                  sx={{ 
                    mt: 2, 
                    mx: 'auto', 
                    width: '100%', 
                    maxWidth: 240, 
                    height: 160, 
                    overflow: 'hidden',
                    borderRadius: 1,
                    boxShadow: 1
                  }}
                >
                  <img 
                    src={preview} 
                    alt="Preview" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain' 
                    }} 
                  />
                </Box>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Drag and drop a file here, or click to select a file
            </Typography>
          )}
        </Paper>
        
        {/* File settings */}
        {file && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="File Name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              fullWidth
              disabled={uploading}
            />
            
            <FormControl fullWidth>
              <InputLabel>Folder</InputLabel>
              <Select
                value={folder}
                label="Folder"
                onChange={(e) => setFolder(e.target.value)}
                disabled={uploading}
              >
                <MenuItem value="root">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FolderIcon sx={{ mr: 1, fontSize: 20 }} />
                    Root
                  </Box>
                </MenuItem>
                <MenuItem value="image">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FolderIcon sx={{ mr: 1, fontSize: 20, color: '#4CAF50' }} />
                    Image
                  </Box>
                </MenuItem>
                <MenuItem value="audio">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FolderIcon sx={{ mr: 1, fontSize: 20, color: '#2196F3' }} />
                    Audio
                  </Box>
                </MenuItem>
                <MenuItem value="video">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FolderIcon sx={{ mr: 1, fontSize: 20, color: '#FF5722' }} />
                    Video
                  </Box>
                </MenuItem>
                {/* <MenuItem value="custom">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FolderIcon sx={{ mr: 1, fontSize: 20, color: '#9C27B0' }} />
                    Custom Folder
                  </Box>
                </MenuItem> */}
              </Select>
            </FormControl>
            
            {folder === 'custom' && (
              <TextField
                label="Custom Folder Path"
                placeholder="e.g., documents/pdfs"
                fullWidth
                disabled={uploading}
                onChange={(e) => setFolder(e.target.value)}
              />
            )}
            
            {/* Upload progress */}
            {uploading && (
              <Box sx={{ width: '100%' }}>
                <Typography variant="body2" gutterBottom>
                  Uploading: {progress}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ height: 10, borderRadius: 1 }}
                />
              </Box>
            )}
            
            {/* Upload button */}
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={uploading || !file}
              startIcon={<CloudUploadIcon />}
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MediaUploader;