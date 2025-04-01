import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Paper, 
  Divider,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
// Import the JSON file directly
import relationshipDataFile from '../../../api/examFieldRelationship.json';

const FormCategorySelector = ({ 
  pageId, 
  initialValues = {}, 
  onChange,
  disabled = false
}) => {
  // Use a single state object for all values to avoid synchronization issues
  const [values, setValues] = useState({
    exam_language: initialValues.exam_language || '',
    exam_type: initialValues.exam_type || '',
    component: initialValues.component || '',
    category: initialValues.category || ''
  });

  // Available options based on selected values
  const [availableExamTypes, setAvailableExamTypes] = useState([]);
  const [availableComponents, setAvailableComponents] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);

  // Get all exam languages - adjust this to match your JSON structure
  const examLanguages = relationshipDataFile.exam_language?.options || [];

  // Update local state when initialValues change (e.g., when switching pages)
  useEffect(() => {
    console.log("FormCategorySelector: initialValues changed for pageId", pageId, initialValues);
    
    // Update all values at once to maintain consistency
    setValues({
      exam_language: initialValues.exam_language || '',
      exam_type: initialValues.exam_type || '',
      component: initialValues.component || '',
      category: initialValues.category || ''
    });
  }, [pageId, initialValues]);

  // Update available exam types when exam language changes
  useEffect(() => {
    if (!values.exam_language) {
      setAvailableExamTypes([]);
      return;
    }

    // Find the selected language in the data structure
    const languageData = examLanguages.find(
      lang => lang.id === values.exam_language
    );

    if (languageData?.children?.exam_types?.options) {
      setAvailableExamTypes(languageData.children.exam_types.options);
    } else {
      setAvailableExamTypes([]);
    }
  }, [values.exam_language, examLanguages]);

  // Update available components when exam type changes
  useEffect(() => {
    if (!values.exam_language || !values.exam_type) {
      setAvailableComponents([]);
      return;
    }

    // Find the selected language
    const languageData = examLanguages.find(
      lang => lang.id === values.exam_language
    );

    if (!languageData?.children?.exam_types?.options) {
      setAvailableComponents([]);
      return;
    }

    // Find the selected exam type
    const typeData = languageData.children.exam_types.options.find(
      type => type.id === values.exam_type
    );

    if (typeData?.children?.components?.options) {
      setAvailableComponents(typeData.children.components.options);
    } else {
      setAvailableComponents([]);
    }
  }, [values.exam_language, values.exam_type, examLanguages]);

  // Update available categories when component changes
  useEffect(() => {
    if (!values.exam_language || !values.exam_type || !values.component) {
      setAvailableCategories([]);
      return;
    }

    // Find the selected language
    const languageData = examLanguages.find(
      lang => lang.id === values.exam_language
    );

    if (!languageData?.children?.exam_types?.options) {
      setAvailableCategories([]);
      return;
    }

    // Find the selected exam type
    const typeData = languageData.children.exam_types.options.find(
      type => type.id === values.exam_type
    );

    if (!typeData?.children?.components?.options) {
      setAvailableCategories([]);
      return;
    }

    // Find the selected component
    const componentData = typeData.children.components.options.find(
      comp => comp.id === values.component
    );

    if (componentData?.children?.categories?.options) {
      setAvailableCategories(componentData.children.categories.options);
    } else {
      setAvailableCategories([]);
    }
  }, [values.exam_language, values.exam_type, values.component, examLanguages]);

  // Generic handler for all field changes that maintains relationships
  const handleFieldChange = useCallback((field, value) => {
    // Create updated values based on the changed field
    const updatedValues = { ...values };
    
    // Update the specified field
    updatedValues[field] = value;
    
    // Reset dependent fields when a parent field changes
    if (field === 'exam_language') {
      updatedValues.exam_type = '';
      updatedValues.component = '';
      updatedValues.category = '';
    } else if (field === 'exam_type') {
      updatedValues.component = '';
      updatedValues.category = '';
    } else if (field === 'component') {
      updatedValues.category = '';
    }
    
    // Log the change
    console.log(`FormCategorySelector: ${field} changed to ${value}. Updated values:`, updatedValues);
    
    // Update state
    setValues(updatedValues);
    
    // Notify parent component
    onChange(updatedValues);
  }, [values, onChange]);

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2,
        mb: 3,
        border: '1px solid #e0e0e0',
        borderRadius: 1
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Exam Classification
        </Typography>
        <Tooltip title="These fields define the classification hierarchy for this form page">
          <IconButton size="small">
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Exam Language */}
        <FormControl fullWidth size="small" disabled={disabled}>
          <InputLabel id="exam-language-label">Exam Language</InputLabel>
          <Select
            labelId="exam-language-label"
            value={values.exam_language}
            label="Exam Language"
            onChange={(e) => handleFieldChange('exam_language', e.target.value)}
          >
            <MenuItem value="">
              <em>Select a language</em>
            </MenuItem>
            {examLanguages.map((language) => (
              <MenuItem key={language.id} value={language.id}>
                {language.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Exam Type */}
        <FormControl fullWidth size="small" disabled={!values.exam_language || disabled}>
          <InputLabel id="exam-type-label">Exam Type</InputLabel>
          <Select
            labelId="exam-type-label"
            value={values.exam_type}
            label="Exam Type"
            onChange={(e) => handleFieldChange('exam_type', e.target.value)}
          >
            <MenuItem value="">
              <em>Select an exam type</em>
            </MenuItem>
            {availableExamTypes.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
          {values.exam_language && availableExamTypes.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              No exam types available for this language
            </Typography>
          )}
        </FormControl>

        {/* Component */}
        <FormControl fullWidth size="small" disabled={!values.exam_type || disabled}>
          <InputLabel id="component-label">Component</InputLabel>
          <Select
            labelId="component-label"
            value={values.component}
            label="Component"
            onChange={(e) => handleFieldChange('component', e.target.value)}
          >
            <MenuItem value="">
              <em>Select a component</em>
            </MenuItem>
            {availableComponents.map((comp) => (
              <MenuItem key={comp.id} value={comp.id}>
                {comp.label}
              </MenuItem>
            ))}
          </Select>
          {values.exam_type && availableComponents.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              No components available for this exam type
            </Typography>
          )}
        </FormControl>

        {/* Category */}
        <FormControl fullWidth size="small" disabled={!values.component || disabled}>
          <InputLabel id="category-label">Category</InputLabel>
          <Select
            labelId="category-label"
            value={values.category}
            label="Category"
            onChange={(e) => handleFieldChange('category', e.target.value)}
          >
            <MenuItem value="">
              <em>Select a category</em>
            </MenuItem>
            {availableCategories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.label}
              </MenuItem>
            ))}
          </Select>
          {values.component && availableCategories.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              No categories available for this component
            </Typography>
          )}
        </FormControl>
      </Box>

      {/* Selection Summary */}
      {(values.exam_language || values.exam_type || values.component || values.category) && (
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed #e0e0e0' }}>
          <Typography variant="subtitle2" gutterBottom>
            Current Selection:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {values.exam_language && (
              <Chip 
                size="small" 
                label={`Language: ${examLanguages.find(l => l.id === values.exam_language)?.label || values.exam_language}`}
                color="primary"
                variant="outlined"
              />
            )}
            {values.exam_type && (
              <Chip 
                size="small" 
                label={`Type: ${availableExamTypes.find(t => t.id === values.exam_type)?.label || values.exam_type}`}
                color="primary"
                variant="outlined"
              />
            )}
            {values.component && (
              <Chip 
                size="small" 
                label={`Component: ${availableComponents.find(c => c.id === values.component)?.label || values.component}`}
                color="primary"
                variant="outlined"
              />
            )}
            {values.category && (
              <Chip 
                size="small" 
                label={`Category: ${availableCategories.find(c => c.id === values.category)?.label || values.category}`}
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      )}

      {/* Debug information - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #e0e0e0', fontSize: '10px', color: '#999' }}>
          <Typography variant="caption">Debug Info (pageId: {pageId})</Typography>
          <pre style={{ fontSize: '10px', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(values, null, 2)}
          </pre>
        </Box>
      )}
    </Paper>
  );
};

export default FormCategorySelector;