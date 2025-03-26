// components/LinkedFieldSelector.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Typography,
  Paper
} from '@mui/material';

const LinkedFieldSelector = ({ linkedFieldsData }) => {
  // State for each level of selection
  const [language, setLanguage] = useState('');
  const [examType, setExamType] = useState('');
  const [component, setComponent] = useState('');
  const [category, setCategory] = useState('');
  
  // Available options for each level based on the selection of the level above
  const [examTypeOptions, setExamTypeOptions] = useState([]);
  const [componentOptions, setComponentOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  
  // Selected full path
  const [selectedPath, setSelectedPath] = useState('');

  // Reset dependent fields when a higher-level field changes
  useEffect(() => {
    if (language) {
      const languageData = linkedFieldsData.exam_language.options.find(
        opt => opt.id === language
      );
      
      if (languageData && languageData.children && languageData.children.exam_types) {
        setExamTypeOptions(languageData.children.exam_types.options);
      } else {
        setExamTypeOptions([]);
      }
      
      // Reset dependent fields
      setExamType('');
      setComponent('');
      setCategory('');
      setComponentOptions([]);
      setCategoryOptions([]);
    } else {
      setExamTypeOptions([]);
      setExamType('');
      setComponent('');
      setCategory('');
      setComponentOptions([]);
      setCategoryOptions([]);
    }
  }, [language, linkedFieldsData]);

  useEffect(() => {
    if (examType && language) {
      const languageData = linkedFieldsData.exam_language.options.find(
        opt => opt.id === language
      );
      
      if (
        languageData &&
        languageData.children &&
        languageData.children.exam_types
      ) {
        const examTypeData = languageData.children.exam_types.options.find(
          opt => opt.id === examType
        );
        
        if (
          examTypeData &&
          examTypeData.children &&
          examTypeData.children.components
        ) {
          setComponentOptions(examTypeData.children.components.options);
        } else {
          setComponentOptions([]);
        }
      }
      
      // Reset dependent fields
      setComponent('');
      setCategory('');
      setCategoryOptions([]);
    } else {
      setComponentOptions([]);
      setComponent('');
      setCategory('');
      setCategoryOptions([]);
    }
  }, [examType, language, linkedFieldsData]);

  useEffect(() => {
    if (component && examType && language) {
      const languageData = linkedFieldsData.exam_language.options.find(
        opt => opt.id === language
      );
      
      if (
        languageData &&
        languageData.children &&
        languageData.children.exam_types
      ) {
        const examTypeData = languageData.children.exam_types.options.find(
          opt => opt.id === examType
        );
        
        if (
          examTypeData &&
          examTypeData.children &&
          examTypeData.children.components
        ) {
          const componentData = examTypeData.children.components.options.find(
            opt => opt.id === component
          );
          
          if (
            componentData &&
            componentData.children &&
            componentData.children.categories
          ) {
            setCategoryOptions(componentData.children.categories.options);
          } else {
            setCategoryOptions([]);
          }
        }
      }
      
      // Reset dependent field
      setCategory('');
    } else {
      setCategoryOptions([]);
      setCategory('');
    }
  }, [component, examType, language, linkedFieldsData]);

  // Update the selected path when any selection changes
  useEffect(() => {
    let path = [];
    if (language) path.push(language);
    if (examType) path.push(examType);
    if (component) path.push(component);
    if (category) path.push(category);
    
    setSelectedPath(path.join(' > '));
  }, [language, examType, component, category]);

  // Get available language options
  const languageOptions = linkedFieldsData?.exam_language?.options || [];

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Exam Selection
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Language Selection */}
        <FormControl fullWidth>
          <InputLabel>Exam Language</InputLabel>
          <Select
            value={language}
            label="Exam Language"
            onChange={(e) => setLanguage(e.target.value)}
          >
            {languageOptions.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Exam Type Selection */}
        <FormControl fullWidth disabled={examTypeOptions.length === 0}>
          <InputLabel>Exam Type</InputLabel>
          <Select
            value={examType}
            label="Exam Type"
            onChange={(e) => setExamType(e.target.value)}
          >
            {examTypeOptions.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Component Selection */}
        <FormControl fullWidth disabled={componentOptions.length === 0}>
          <InputLabel>Exam Component</InputLabel>
          <Select
            value={component}
            label="Exam Component"
            onChange={(e) => setComponent(e.target.value)}
          >
            {componentOptions.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Category Selection */}
        <FormControl fullWidth disabled={categoryOptions.length === 0}>
          <InputLabel>Category</InputLabel>
          <Select
            value={category}
            label="Category"
            onChange={(e) => setCategory(e.target.value)}
          >
            {categoryOptions.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Display Selected Path */}
        {selectedPath && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Selected Path:
            </Typography>
            <Typography>{selectedPath}</Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default LinkedFieldSelector;