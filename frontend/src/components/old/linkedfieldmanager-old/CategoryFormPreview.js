// components/CategoryFormPreview.js
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Paper,
  Grid,
  Chip,
  Stack
} from "@mui/material";
import { findCategoryInHierarchy, findNestedCategory, findOptionInCategory } from "./utils/hierarchyUtils";

const CategoryFormPreview = ({ linkedFields }) => {
  const [selectedValues, setSelectedValues] = useState({});
  const [availableOptions, setAvailableOptions] = useState({});
  
  // First level is always visible
  const rootCategories = Object.keys(linkedFields);
  
  // Handle selection of an option
  const handleSelectionChange = (category, value) => {
    // Clear all dependent values
    const newSelectedValues = { ...selectedValues };
    const categories = Object.keys(newSelectedValues);
    
    // Find the index of the current category in the selection path
    let categoryFound = false;
    const categoriesToClear = [];
    
    for (const cat of categories) {
      if (cat === category) {
        categoryFound = true;
        continue;
      }
      
      if (categoryFound) {
        categoriesToClear.push(cat);
      }
    }
    
    // Clear all dependent categories
    for (const cat of categoriesToClear) {
      delete newSelectedValues[cat];
    }
    
    // Set the new value
    if (value) {
      newSelectedValues[category] = value;
    } else {
      delete newSelectedValues[category];
    }
    
    setSelectedValues(newSelectedValues);
    
    // Update available options for the next level
    updateAvailableOptions(newSelectedValues);
  };
  
  // Update the available options based on the current selections
  const updateAvailableOptions = (selections) => {
    const newAvailableOptions = {};
    
    // Start with root categories
    rootCategories.forEach(rootCat => {
      newAvailableOptions[rootCat] = linkedFields[rootCat].options;
    });
    
    // Follow the selection path to get available options for each level
    let current = linkedFields;
    const selectionPath = [];
    
    for (const [category, value] of Object.entries(selections)) {
      selectionPath.push(category);
      selectionPath.push(value);
      
      // Navigate through the hierarchy
      let pointer = current;
      for (let i = 0; i < selectionPath.length; i++) {
        const part = selectionPath[i];
        if (i % 2 === 0) {
          // This is a category key
          pointer = pointer[part];
        } else {
          // This is an option value
          const option = pointer.options.find(opt => opt.id === part);
          if (option && option.children) {
            pointer = option;
            
            // Add available options for each child category
            Object.keys(option.children).forEach(childCat => {
              newAvailableOptions[childCat] = option.children[childCat].options;
            });
          } else {
            // No more children
            break;
          }
        }
      }
    }
    
    setAvailableOptions(newAvailableOptions);
  };
  
  // Initialize available options for root level
  useEffect(() => {
    updateAvailableOptions({});
  }, [linkedFields]);
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Category Selection Form Preview
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <Grid container spacing={3}>
        {/* Display selectors for each available category */}
        {Object.keys(availableOptions).map(category => {
          const options = availableOptions[category];
          const categoryObj = linkedFields[category] || 
                             // Try to find it in a nested path
                             Object.values(linkedFields).reduce((found, rootCat) => {
                               if (found) return found;
                               return findNestedCategory(rootCat, category);
                             }, null);
          
          const label = categoryObj?.label || category;
          
          return (
            <Grid item xs={12} sm={6} md={4} key={category}>
              <FormControl fullWidth>
                <InputLabel>{label}</InputLabel>
                <Select
                  value={selectedValues[category] || ''}
                  onChange={(e) => handleSelectionChange(category, e.target.value)}
                  label={label}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {options?.map(option => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          );
        })}
      </Grid>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Selected Path:
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f8f8ff' }}>
          {Object.keys(selectedValues).length > 0 ? (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {Object.entries(selectedValues).map(([category, value]) => {
                const categoryObj = findCategoryInHierarchy(linkedFields, category);
                const categoryLabel = categoryObj?.label || category;
                
                const optionObj = findOptionInCategory(linkedFields, category, value);
                const optionLabel = optionObj?.label || value;
                
                return (
                  <Chip 
                    key={category} 
                    label={`${categoryLabel}: ${optionLabel}`} 
                    onDelete={() => handleSelectionChange(category, null)}
                    sx={{ m: 0.5 }}
                  />
                );
              })}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No categories selected
            </Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default CategoryFormPreview;