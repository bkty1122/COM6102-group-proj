// src/components/formbuilder/shared/MediaGrid.js
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Card, CardMedia, CardContent, CardActionArea,
  CircularProgress, Alert, Pagination, TextField, InputAdornment, IconButton,
  Select, MenuItem, FormControl, InputLabel
} from "@mui/material";
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import VideocamIcon from '@mui/icons-material/Videocam';
import SearchIcon from '@mui/icons-material/Search';
import FolderIcon from '@mui/icons-material/Folder';
import mediaApi from '../../../../api/mediaApi';

const MediaGrid = ({ selectedMedia, onSelectMedia }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mediaItems, setMediaItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('');
  const [folders, setFolders] = useState([]);
  const [mediaType, setMediaType] = useState('all');

  // Load media from the API
  const loadMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare params for API call
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      
      // Add filters if set
      if (search) params.search = search;
      if (folder) params.folder = folder;
      if (mediaType !== 'all') params.type = mediaType;
      
      // Call the API
      const response = await mediaApi.listMedia(params);
      
      if (response.success) {
        setMediaItems(response.data.items || []);
        
        // Update pagination info
        setPagination({
          ...pagination,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0
        });
        
        // Extract available folders for the folder dropdown
        if (response.data.folders) {
          setFolders(response.data.folders);
        }
      } else {
        throw new Error(response.message || 'Failed to load media');
      }
    } catch (err) {
      console.error('Error loading media:', err);
      setError(err.message || 'Failed to load media. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load media on initial render and when filters change
  useEffect(() => {
    loadMedia();
  }, [pagination.page, pagination.limit, folder, mediaType]);
  
  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 }); // Reset to first page
    loadMedia();
  };
  
  // Handle page change
  const handlePageChange = (event, value) => {
    setPagination({ ...pagination, page: value });
  };
  
  // Handle folder change
  const handleFolderChange = (e) => {
    setFolder(e.target.value);
    setPagination({ ...pagination, page: 1 }); // Reset to first page
  };
  
  // Handle media type change
  const handleMediaTypeChange = (e) => {
    setMediaType(e.target.value);
    setPagination({ ...pagination, page: 1 }); // Reset to first page
  };
  
  // Render media thumbnail based on type
  const renderMediaThumbnail = (media) => {
    if (media.type === 'image') {
      return (
        <CardMedia
          component="img"
          height="120"
          image={media.thumbnail_url || media.url}
          alt={media.name}
          sx={{ objectFit: 'cover', p: 1 }}
        />
      );
    } else if (media.type === 'audio') {
      return (
        <Box sx={{ height: 120, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
          <AudiotrackIcon sx={{ fontSize: '3rem', color: 'primary.main' }} />
        </Box>
      );
    } else if (media.type === 'video') {
      return (
        <Box sx={{ height: 120, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
          <VideocamIcon sx={{ fontSize: '3rem', color: 'primary.main' }} />
        </Box>
      );
    } else {
      // Folder or other type
      return (
        <Box sx={{ height: 120, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
          <FolderIcon sx={{ fontSize: '3rem', color: 'primary.main' }} />
        </Box>
      );
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Search and filters */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
        <form onSubmit={handleSearchSubmit} style={{ flexGrow: 1 }}>
          <TextField
            fullWidth
            placeholder="Search media..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton type="submit" edge="end">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </form>
        
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Folder</InputLabel>
          <Select
            value={folder}
            label="Folder"
            onChange={handleFolderChange}
            displayEmpty
          >
            <MenuItem value="">All Folders</MenuItem>
            {folders.map((f) => (
              <MenuItem key={f.path} value={f.path}>{f.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={mediaType}
            label="Type"
            onChange={handleMediaTypeChange}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="image">Images</MenuItem>
            <MenuItem value="audio">Audio</MenuItem>
            <MenuItem value="video">Videos</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* No results message */}
      {!loading && mediaItems.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No media found. Try adjusting your filters or upload new media.
          </Typography>
        </Box>
      )}
      
      {/* Media grid */}
      {!loading && mediaItems.length > 0 && (
        <Grid container spacing={2}>
          {mediaItems.map((media) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={media.id}>
              <Card 
                sx={{ 
                  border: selectedMedia?.id === media.id ? '2px solid #1976d2' : '1px solid #eee',
                  transition: 'all 0.2s',
                  height: '100%'
                }}
              >
                <CardActionArea 
                  onClick={() => onSelectMedia(media)}
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                  <Box sx={{ position: 'relative', flexGrow: 0 }}>
                    {renderMediaThumbnail(media)}
                  </Box>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" noWrap>{media.name}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {media.type.charAt(0).toUpperCase() + media.type.slice(1)} • {formatFileSize(media.size)}
                    </Typography>
                    {media.folder && (
                      <Typography variant="caption" color="text.secondary" display="block" noWrap>
                        {media.folder}
                      </Typography>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
          <Pagination 
            count={pagination.totalPages} 
            page={pagination.page} 
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default MediaGrid;