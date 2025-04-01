// src/components/dashboard/FilterDialog.js
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button
} from '@mui/material';

const FilterDialog = ({ 
  open, 
  onClose, 
  filters, 
  onFilterChange, 
  onReset, 
  onApply,
  filterOptions 
}) => {
  const { 
    uniqueLanguages, 
    uniqueExamTypes, 
    uniqueComponents 
  } = filterOptions;
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Filter Materials</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Language</InputLabel>
              <Select
                name="exam_language"
                value={filters.exam_language}
                onChange={onFilterChange}
                label="Language"
              >
                <MenuItem value="">Any</MenuItem>
                {uniqueLanguages.map(lang => (
                  <MenuItem key={lang} value={lang}>{lang}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Exam System</InputLabel>
              <Select
                name="exam_type"
                value={filters.exam_type}
                onChange={onFilterChange}
                label="Exam System"
              >
                <MenuItem value="">Any</MenuItem>
                {uniqueExamTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Component</InputLabel>
              <Select
                name="component"
                value={filters.component}
                onChange={onFilterChange}
                label="Component"
              >
                <MenuItem value="">Any</MenuItem>
                {uniqueComponents.map(comp => (
                  <MenuItem key={comp} value={comp}>{comp}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={filters.status}
                onChange={onFilterChange}
                label="Status"
              >
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onReset}>Reset</Button>
        <Button onClick={onApply} variant="contained">Apply Filters</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilterDialog;