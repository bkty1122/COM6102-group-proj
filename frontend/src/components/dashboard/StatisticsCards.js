// src/components/dashboard/StatisticsCards.js
import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';

const StatisticsCards = ({ stats }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={2.4}>
        <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
          <Typography variant="h3" color="primary">{stats.totalMaterials}</Typography>
          <Typography variant="body2" color="text.secondary">Total Materials</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
          <Typography variant="h3" color="success.main">{stats.published}</Typography>
          <Typography variant="body2" color="text.secondary">Published</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
          <Typography variant="h3" color="warning.main">{stats.drafts}</Typography>
          <Typography variant="body2" color="text.secondary">Drafts</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
          <Typography variant="h3" color="info.main">{stats.languages}</Typography>
          <Typography variant="body2" color="text.secondary">Languages</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
          <Typography variant="h3" color="secondary.main">{stats.examTypes}</Typography>
          <Typography variant="body2" color="text.secondary">Exam Systems</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default StatisticsCards;