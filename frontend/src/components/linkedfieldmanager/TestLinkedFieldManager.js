// TestLinkedFieldManager.js
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import LinkedFieldManager from './LinkedFieldManager';

const TestLinkedFieldManager = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5">
          Testing LinkedFieldManager
        </Typography>
      </Paper>
      
      <LinkedFieldManager />
    </Box>
  );
};

export default TestLinkedFieldManager;