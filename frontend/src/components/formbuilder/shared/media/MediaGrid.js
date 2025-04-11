// src/components/formbuilder/shared/MediaGrid.js
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Card, CardMedia, CardContent, CardActionArea,
  CircularProgress, Alert, Pagination, TextField, InputAdornment, IconButton,
  Select, MenuItem, FormControl, InputLabel, Chip
} from "@mui/material";
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import VideocamIcon from '@mui/icons-material/Videocam';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import SearchIcon from '@mui/icons-material/Search';
import FolderIcon from '@mui/icons-material/Folder';
import mediaApi from '../../../../api/mediaApi';

const MediaGrid = ({ selectedMedia, onSelectMedia }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mediaItems, setMediaItems] = useState([]);
  const [folderOptions, setFolderOptions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 24,
    total: 0,
    totalPages: 0,
    continuationToken: null
  });
  const [search, setSearch] = useState('');
  const [mediaType, setMediaType] = useState('all');
  const [folder, setFolder] = useState('root');

  // Get the correct file type for filtering based on file extension
  const getFileType = (media) => {
    if (!media.key) return 'unknown';
    
    const extension = media.key.split('.').pop().toLowerCase();
    const fileUrl = media.url || '';
    
    // Check media.type first if available
    if (media.type) {
      if (media.type.startsWith('image/')) return 'image';
      if (media.type.startsWith('audio/')) return 'audio';
      if (media.type.startsWith('video/')) return 'video';
      if (media.type.startsWith('application/')) return 'application';
    }
    
    // Check by extension if type is not reliable
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a'];
    const videoExtensions = ['mp4', 'webm', 'mov', 'avi'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
    
    if (imageExtensions.includes(extension) || fileUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) return 'image';
    if (audioExtensions.includes(extension) || fileUrl.match(/\.(mp3|wav|ogg|m4a)/i)) return 'audio';
    if (videoExtensions.includes(extension) || fileUrl.match(/\.(mp4|webm|mov|avi)/i)) return 'video';
    if (documentExtensions.includes(extension) || fileUrl.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)/i)) return 'application';
    
    return 'unknown';
  };

  // Filter media items by type
  const filterMediaByType = (items, type) => {
    if (type === 'all') return items;
    
    return items.filter(item => {
      const fileType = getFileType(item);
      return fileType === type;
    });
  };

  // Load media from the API
  const loadMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare params for API call
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        folder: folder
      };
      
      // Add search filter if set
      if (search) params.search = search;
      
      // Add type filter if set (for server-side filtering)
      if (mediaType !== 'all') params.type = mediaType;
      
      // Add continuation token for S3 pagination (if available)
      if (pagination.continuationToken) {
        params.continuationToken = pagination.continuationToken;
      }
      
      // Call the API
      const response = await mediaApi.listMedia(params);
      
      if (response.success) {
        // Set the media items
        let items = [];
        if (Array.isArray(response.data)) {
          items = response.data.filter(item => item && !item.key.endsWith('/'));
          
          // If server-side filtering doesn't work, apply client-side filtering
          if (mediaType !== 'all' && items.some(item => getFileType(item) !== mediaType)) {
            items = filterMediaByType(items, mediaType);
          }
          
          setMediaItems(items);
        } else {
          console.error('Unexpected response data format:', response.data);
          setMediaItems([]);
        }
        
        // Update folder options if available
        if (response.folders && Array.isArray(response.folders)) {
          setFolderOptions(response.folders);
        }
        
        // Update pagination info
        if (response.pagination) {
          setPagination({
            ...pagination,
            total: response.pagination.total || 0,
            totalPages: response.pagination.totalPages || 1,
            continuationToken: response.pagination.nextContinuationToken || null
          });
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
  }, [pagination.page, pagination.limit, mediaType, folder]);
  
  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1, continuationToken: null }); // Reset pagination
    loadMedia();
  };
  
  // Handle page change
  const handlePageChange = (event, value) => {
    setPagination({ ...pagination, page: value });
  };
  
  // Handle media type change
  const handleMediaTypeChange = (e) => {
    setMediaType(e.target.value);
    setPagination({ ...pagination, page: 1, continuationToken: null }); // Reset pagination
  };
  
  // Handle folder change
  const handleFolderChange = (e) => {
    setFolder(e.target.value);
    setPagination({ ...pagination, page: 1, continuationToken: null }); // Reset pagination
  };
  
  // Render media thumbnail based on type
  const renderMediaThumbnail = (media) => {
    const fileType = getFileType(media);
    
    if (fileType === 'image') {
      return (
        <CardMedia
          component="img"
          height="120"
          image={media.url}
          alt={media.name}
          sx={{ objectFit: 'contain', p: 1 }}
        />
      );
    } else if (fileType === 'audio') {
      return (
        <Box sx={{ height: 120, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
          <AudiotrackIcon sx={{ fontSize: '3rem', color: 'primary.main' }} />
        </Box>
      );
    } else if (fileType === 'video') {
      return (
        <Box sx={{ height: 120, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
          <VideocamIcon sx={{ fontSize: '3rem', color: 'primary.main' }} />
        </Box>
      );
    } else if (fileType === 'application') {
      return (
        <Box sx={{ height: 120, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
          <InsertDriveFileIcon sx={{ fontSize: '3rem', color: 'primary.main' }} />
        </Box>
      );
    } else {
      // Unknown type
      return (
        <Box sx={{ height: 120, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
          <InsertDriveFileIcon sx={{ fontSize: '3rem', color: 'primary.main' }} />
        </Box>
      );
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Search, folder and type filters */}
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
        
        {/* Folder dropdown */}
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Folder</InputLabel>
          <Select
            value={folder}
            label="Folder"
            onChange={handleFolderChange}
          >
            {folderOptions.map((folderOption) => (
              <MenuItem key={folderOption.path} value={folderOption.path}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FolderIcon 
                    sx={{ 
                      mr: 1, 
                      fontSize: 20, 
                      color: 
                        folderOption.path === 'image' ? '#4CAF50' : 
                        folderOption.path === 'audio' ? '#2196F3' : 
                        folderOption.path === 'video' ? '#FF5722' : 
                        folderOption.path === 'root' ? 'text.primary' : '#9C27B0'
                    }} 
                  />
                  {folderOption.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Type dropdown */}
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={mediaType}
            label="Type"
            onChange={handleMediaTypeChange}
          >
            <MenuItem value="all">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                All Types
              </Box>
            </MenuItem>
            <MenuItem value="image">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ImageIcon sx={{ mr: 1, fontSize: 20, color: '#4CAF50' }} />
                Images
              </Box>
            </MenuItem>
            <MenuItem value="audio">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AudiotrackIcon sx={{ mr: 1, fontSize: 20, color: '#2196F3' }} />
                Audio
              </Box>
            </MenuItem>
            <MenuItem value="video">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <VideocamIcon sx={{ mr: 1, fontSize: 20, color: '#FF5722' }} />
                Video
              </Box>
            </MenuItem>
            <MenuItem value="application">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <InsertDriveFileIcon sx={{ mr: 1, fontSize: 20, color: '#607D8B' }} />
                Documents
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Filter badges */}
      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {folder && (
          <Chip 
            icon={<FolderIcon />} 
            label={`Folder: ${folderOptions.find(f => f.path === folder)?.name || folder}`}
            size="small"
            color="primary"
            variant="outlined"
            onDelete={() => {
              if (folder !== 'root') {
                setFolder('root');
                setPagination({ ...pagination, page: 1, continuationToken: null });
              }
            }}
          />
        )}
        
        {mediaType !== 'all' && (
          <Chip 
            icon={
              mediaType === 'image' ? <ImageIcon /> :
              mediaType === 'audio' ? <AudiotrackIcon /> :
              mediaType === 'video' ? <VideocamIcon /> :
              <InsertDriveFileIcon />
            }
            label={`Type: ${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`}
            size="small"
            color="secondary"
            variant="outlined"
            onDelete={() => {
              setMediaType('all');
              setPagination({ ...pagination, page: 1, continuationToken: null });
            }}
          />
        )}
        
        {search && (
          <Chip 
            icon={<SearchIcon />} 
            label={`Search: ${search}`}
            size="small"
            color="info"
            variant="outlined"
            onDelete={() => {
              setSearch('');
              setPagination({ ...pagination, page: 1, continuationToken: null });
              loadMedia();
            }}
          />
        )}
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
            <Grid item xs={12} sm={6} md={4} lg={3} key={media.id || media.key}>
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
                    {/* File type indicator */}
                    <Chip
                      label={getFileType(media)}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        fontSize: '0.7rem',
                        height: 20,
                        backgroundColor: 
                          getFileType(media) === 'image' ? 'rgba(76, 175, 80, 0.8)' :
                          getFileType(media) === 'audio' ? 'rgba(33, 150, 243, 0.8)' :
                          getFileType(media) === 'video' ? 'rgba(255, 87, 34, 0.8)' :
                          'rgba(96, 125, 139, 0.8)',
                        color: '#fff'
                      }}
                    />
                    
                    {/* Show folder tag if not in the current folder view */}
                    {media.folder && media.folder !== folder && (
                      <Chip
                        label={folderOptions.find(f => f.path === media.folder)?.name || media.folder}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          fontSize: '0.7rem',
                          height: 20,
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          color: '#fff'
                        }}
                      />
                    )}
                  </Box>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" noWrap>{media.name}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {(media.size / 1024).toFixed(1)} KB
                    </Typography>
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

export default MediaGrid;