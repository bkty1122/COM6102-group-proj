// src/components/formbuilder/shared/FormCategorySelector.js
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
  // Selected values state
  const [examLanguage, setExamLanguage] = useState(initialValues.exam_language || '');
  const [examType, setExamType] = useState(initialValues.exam_type || '');
  const [component, setComponent] = useState(initialValues.component || '');
  const [category, setCategory] = useState(initialValues.category || '');
  
  // Store previous values to check for changes
  const [prevInitialValues, setPrevInitialValues] = useState(initialValues);

  // Available options based on selected values
  const [availableExamTypes, setAvailableExamTypes] = useState([]);
  const [availableComponents, setAvailableComponents] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);

  // Get all exam languages - adjust this to match your JSON structure
  const examLanguages = relationshipDataFile.exam_language?.options || [];

  // Update local state when initialValues change (e.g., when switching pages)
  useEffect(() => {
    // Only update if initialValues have actually changed to prevent loops
    if (
      JSON.stringify(initialValues) !== JSON.stringify(prevInitialValues)
    ) {
      setExamLanguage(initialValues.exam_language || '');
      setExamType(initialValues.exam_type || '');
      setComponent(initialValues.component || '');
      setCategory(initialValues.category || '');
      setPrevInitialValues(initialValues);
    }
  }, [initialValues, prevInitialValues]);

  // Update available exam types when exam language changes
  useEffect(() => {
    if (!examLanguage) {
      setAvailableExamTypes([]);
      return;
    }

    // Find the selected language in the data structure
    const languageData = examLanguages.find(
      lang => lang.id === examLanguage
    );

    if (languageData?.children?.exam_types?.options) {
      setAvailableExamTypes(languageData.children.exam_types.options);
    } else {
      setAvailableExamTypes([]);
    }

    // Only reset dependent fields if user manually changed the language
    // (Don't reset during initialization from props)
    if (examLanguage !== initialValues.exam_language) {
      setExamType('');
      setComponent('');
      setCategory('');
    }
  }, [examLanguage, examLanguages, initialValues.exam_language]);

  // Update available components when exam type changes
  useEffect(() => {
    if (!examLanguage || !examType) {
      setAvailableComponents([]);
      return;
    }

    // Find the selected language
    const languageData = examLanguages.find(
      lang => lang.id === examLanguage
    );

    if (!languageData?.children?.exam_types?.options) {
      setAvailableComponents([]);
      return;
    }

    // Find the selected exam type
    const typeData = languageData.children.exam_types.options.find(
      type => type.id === examType
    );

    if (typeData?.children?.components?.options) {
      setAvailableComponents(typeData.children.components.options);
    } else {
      setAvailableComponents([]);
    }

    // Only reset dependent fields if user manually changed the type
    if (examType !== initialValues.exam_type) {
      setComponent('');
      setCategory('');
    }
  }, [examLanguage, examType, examLanguages, initialValues.exam_type]);

  // Update available categories when component changes
  useEffect(() => {
    if (!examLanguage || !examType || !component) {
      setAvailableCategories([]);
      return;
    }

    // Find the selected language
    const languageData = examLanguages.find(
      lang => lang.id === examLanguage
    );

    if (!languageData?.children?.exam_types?.options) {
      setAvailableCategories([]);
      return;
    }

    // Find the selected exam type
    const typeData = languageData.children.exam_types.options.find(
      type => type.id === examType
    );

    if (!typeData?.children?.components?.options) {
      setAvailableCategories([]);
      return;
    }

    // Find the selected component
    const componentData = typeData.children.components.options.find(
      comp => comp.id === component
    );

    if (componentData?.children?.categories?.options) {
      setAvailableCategories(componentData.children.categories.options);
    } else {
      setAvailableCategories([]);
    }

    // Only reset dependent field if user manually changed the component
    if (component !== initialValues.component) {
      setCategory('');
    }
  }, [examLanguage, examType, component, examLanguages, initialValues.component]);

  // Memoize the notifyChange function to prevent unnecessary renders
  const notifyChange = useCallback(() => {
    if (onChange) {
      const currentValues = {
        exam_language: examLanguage,
        exam_type: examType,
        component: component,
        category: category
      };
      
      // Only call onChange if values have actually changed
      if (JSON.stringify(currentValues) !== JSON.stringify(prevInitialValues)) {
        onChange(currentValues);
      }
    }
  }, [examLanguage, examType, component, category, onChange, prevInitialValues]);

  // Use a separate effect for calling the onChange function
  useEffect(() => {
    // Skip initial render and only run on subsequent updates
    if (prevInitialValues !== initialValues) {
      notifyChange();
    }
  }, [examLanguage, examType, component, category, notifyChange, prevInitialValues, initialValues]);

  // Log the relevant data structures for debugging
  useEffect(() => {
    console.log('examLanguages:', examLanguages);
    console.log('availableExamTypes:', availableExamTypes);
    console.log('availableComponents:', availableComponents);
    console.log('availableCategories:', availableCategories);
  }, [examLanguages, availableExamTypes, availableComponents, availableCategories]);

  // Handlers to update the selections
  const handleLanguageChange = (e) => {
    setExamLanguage(e.target.value);
  };

  const handleTypeChange = (e) => {
    setExamType(e.target.value);
  };

  const handleComponentChange = (e) => {
    setComponent(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
  };

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
            value={examLanguage}
            label="Exam Language"
            onChange={handleLanguageChange}
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
        <FormControl fullWidth size="small" disabled={!examLanguage || disabled}>
          <InputLabel id="exam-type-label">Exam Type</InputLabel>
          <Select
            labelId="exam-type-label"
            value={examType}
            label="Exam Type"
            onChange={handleTypeChange}
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
          {examLanguage && availableExamTypes.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              No exam types available for this language
            </Typography>
          )}
        </FormControl>

        {/* Component */}
        <FormControl fullWidth size="small" disabled={!examType || disabled}>
          <InputLabel id="component-label">Component</InputLabel>
          <Select
            labelId="component-label"
            value={component}
            label="Component"
            onChange={handleComponentChange}
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
          {examType && availableComponents.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              No components available for this exam type
            </Typography>
          )}
        </FormControl>

        {/* Category */}
        <FormControl fullWidth size="small" disabled={!component || disabled}>
          <InputLabel id="category-label">Category</InputLabel>
          <Select
            labelId="category-label"
            value={category}
            label="Category"
            onChange={handleCategoryChange}
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
          {component && availableCategories.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              No categories available for this component
            </Typography>
          )}
        </FormControl>
      </Box>

      {/* Selection Summary */}
      {(examLanguage || examType || component || category) && (
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed #e0e0e0' }}>
          <Typography variant="subtitle2" gutterBottom>
            Current Selection:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {examLanguage && (
              <Chip 
                size="small" 
                label={`Language: ${examLanguages.find(l => l.id === examLanguage)?.label || examLanguage}`}
                color="primary"
                variant="outlined"
              />
            )}
            {examType && (
              <Chip 
                size="small" 
                label={`Type: ${availableExamTypes.find(t => t.id === examType)?.label || examType}`}
                color="primary"
                variant="outlined"
              />
            )}
            {component && (
              <Chip 
                size="small" 
                label={`Component: ${availableComponents.find(c => c.id === component)?.label || component}`}
                color="primary"
                variant="outlined"
              />
            )}
            {category && (
              <Chip 
                size="small" 
                label={`Category: ${availableCategories.find(c => c.id === category)?.label || category}`}
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default FormCategorySelector;