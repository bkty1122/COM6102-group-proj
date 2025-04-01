// src/components/formbuilder/shared/MediaGrid.js
import React from 'react';
import { 
  Box, Typography, Grid, Card, CardMedia, CardContent, CardActionArea 
} from "@mui/material";
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import VideocamIcon from '@mui/icons-material/Videocam';

// Import mock data
import mediaData from '../../data/media.json';

const MediaGrid = ({ selectedMedia, onSelectMedia }) => {
  return (
    <Grid container spacing={2}>
      {mediaData.media.map((media) => (
        <Grid item xs={12} sm={6} md={4} key={media.id}>
          <Card 
            sx={{ 
              border: selectedMedia?.id === media.id ? '2px solid #1976d2' : '1px solid #eee',
              transition: 'all 0.2s'
            }}
          >
            <CardActionArea onClick={() => onSelectMedia(media)}>
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
  );
};

export default MediaGrid;