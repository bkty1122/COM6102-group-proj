// components/LinkedFieldEditor.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  Grid,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Autocomplete
} from "@mui/material";
import {
  Edit,
  Save,
  Trash2,
  Plus,
  Link as LinkIcon,
  FolderPlus,
  X,
  Check
} from "lucide-react";

// Utility to flatten the hierarchy to get all available options
// Enhanced utility to flatten the hierarchy to get all available options and child categories
const getAllOptions = (linkedFields) => {
  const options = [];
  
  const traverse = (node, path, label) => {
    if (!node) return;
    
    // For root categories
    if (typeof node === 'object' && node !== null) {
      if (Object.keys(node).includes('options') && Array.isArray(node.options)) {
        // This is a category with options
        node.options.forEach(option => {
          // Add the option itself
          options.push({
            id: option.id,
            label: option.label || option.id,
            path: path ? `${path}.${option.id}` : option.id,
            fullLabel: label ? `${label} > ${option.label || option.id}` : option.label || option.id,
            type: 'option'
          });
          
          // Check for children categories
          if (option.children) {
            Object.keys(option.children).forEach(childKey => {
              const childCategory = option.children[childKey];
              const childPath = path ? `${path}.${option.id}.${childKey}` : `${option.id}.${childKey}`;
              const childLabel = label ? `${label} > ${option.label || option.id} > ${childCategory.label || childKey}` : `${option.label || option.id} > ${childCategory.label || childKey}`;
              
              // Add the child category as a linkable item
              options.push({
                id: childKey,
                label: childCategory.label || childKey,
                path: childPath,
                fullLabel: childLabel,
                type: 'category'
              });
              
              traverse(childCategory, childPath, childLabel);
            });
          }
        });
      } else {
        // For top-level categories
        Object.keys(node).forEach(key => {
          const category = node[key];
          traverse(category, key, category.label || key);
        });
      }
    }
  };
  
  traverse(linkedFields, '', '');
  return options;
};

const LinkedFieldEditor = ({ selectedPath, selectedNode, linkedFields, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [labelValue, setLabelValue] = useState("");
  const [newOptionId, setNewOptionId] = useState("");
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [availableOptions, setAvailableOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [optionSearch, setOptionSearch] = useState("");
  const [filteredOptions, setFilteredOptions] = useState([]);

  useEffect(() => {
    if (selectedNode?.label) {
      setLabelValue(selectedNode.label);
    } else {
      setLabelValue("");
    }
  }, [selectedNode]);

  useEffect(() => {
    const options = getAllOptions(linkedFields);
    setAvailableOptions(options);
  }, [linkedFields]);
  
  useEffect(() => {
    if (optionSearch) {
      const filtered = availableOptions.filter(option => 
        option.label.toLowerCase().includes(optionSearch.toLowerCase()) ||
        option.id.toLowerCase().includes(optionSearch.toLowerCase()) ||
        option.fullLabel.toLowerCase().includes(optionSearch.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions([]);
    }
  }, [optionSearch, availableOptions]);

  const handleSave = () => {
    onUpdate(selectedPath, { label: labelValue });
    setEditing(false);
  };

  const handleAddOption = () => {
    if (!newOptionId || !newOptionLabel) return;
    
    const newOption = {
      id: newOptionId.trim().toLowerCase().replace(/\s+/g, '_'),
      label: newOptionLabel.trim()
    };
    
    onUpdate(selectedPath, { 
      type: 'add_option',
      option: newOption
    });
    
    setNewOptionId("");
    setNewOptionLabel("");
  };
  
  const handleLinkOption = () => {
    setLinkDialogOpen(true);
  };
  
  // Update handleLinkSubmit to work with both options and categories
  const handleLinkSubmit = () => {
    if (!selectedOption) return;
    
    // Get the selected option details
    const item = availableOptions.find(opt => opt.path === selectedOption);
    if (!item) return;
    
    // Create a new option based on the selected one
    const newOption = {
      id: item.id,
      label: item.label,
      linkedTo: item.path, // Store the path to the original item
      isLinkedCategory: item.type === 'category' // Flag to indicate if it's a linked category
    };
    
    onUpdate(selectedPath, { 
      type: 'add_option',
      option: newOption
    });
    
    setSelectedOption(null);
    setLinkDialogOpen(false);
  };
  
  const handleDelete = () => {
    const isOption = selectedPath.split('.').length % 2 === 0;
    
    onUpdate(selectedPath, { 
      type: isOption ? 'delete_option' : 'delete_category'
    });
  };
  
  const handleAddChildCategory = () => {
    onUpdate(selectedPath, { type: 'add_child_category' });
  };

  // If no node is selected
  if (!selectedPath || !selectedNode) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography variant="h6" color="text.secondary" align="center">
          Select a node from the tree to edit
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
          Click on a category or option to view and edit its properties
        </Typography>
      </Box>
    );
  }

  // Determine if this is a category or an option
  const parts = selectedPath.split('.');
  const isRootCategory = parts.length === 1;
  const isOption = parts.length % 2 === 0;
  
  let canAddOptions = isRootCategory || !isOption;
  let canAddChildCategory = isOption;
  let nodeType = isOption ? "Option" : "Category";
  let nodePath = selectedPath.replace(/\./g, ' > ');

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        Edit {nodeType}: <Chip label={nodePath} size="small" />
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.subtle', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body1" fontWeight="medium">
            {nodeType} Details
          </Typography>
          <Box>
            {editing ? (
              <IconButton size="small" color="primary" onClick={handleSave}>
                <Save size={16} />
              </IconButton>
            ) : (
              <IconButton size="small" color="primary" onClick={() => setEditing(true)}>
                <Edit size={16} />
              </IconButton>
            )}
            <IconButton size="small" color="error" onClick={handleDelete}>
              <Trash2 size={16} />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="ID"
              value={selectedNode.id || ''}
              fullWidth
              disabled
              size="small"
              margin="dense"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Label"
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              fullWidth
              disabled={!editing}
              size="small"
              margin="dense"
            />
          </Grid>
          
          {selectedNode.linkedTo && (
            <Grid item xs={12}>
              <TextField
                label="Linked To"
                value={selectedNode.linkedTo}
                fullWidth
                disabled
                size="small"
                margin="dense"
                helperText="This option is linked to another option"
              />
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Only show add options for categories */}
      {canAddOptions && (
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.subtle', mb: 3 }}>
          <Typography variant="body1" fontWeight="medium" gutterBottom>
            Add Option
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={5}>
              <TextField
                label="Option ID"
                value={newOptionId}
                onChange={(e) => setNewOptionId(e.target.value)}
                fullWidth
                size="small"
                helperText="Unique identifier for this option"
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                label="Option Label"
                value={newOptionLabel}
                onChange={(e) => setNewOptionLabel(e.target.value)}
                fullWidth
                size="small"
                helperText="Display name for this option"
              />
            </Grid>
            <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Plus size={16} />}
                onClick={handleAddOption}
                fullWidth
                disabled={!newOptionId || !newOptionLabel}
                sx={{ mt: '8px' }}
              >
                Add
              </Button>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              startIcon={<LinkIcon size={16} />}
              onClick={handleLinkOption}
              size="small"
            >
              Link Existing Option
            </Button>
          </Box>
        </Paper>
      )}
      
      {/* Option for adding child category to an option */}
      {canAddChildCategory && (
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.subtle' }}>
          <Typography variant="body1" fontWeight="medium" gutterBottom>
            Add Child Category
          </Typography>
          
          <Box sx={{ mt: 1 }}>
            <Button
              variant="outlined"
              startIcon={<FolderPlus size={16} />}
              onClick={handleAddChildCategory}
              size="small"
            >
              Add New Child Category
            </Button>
          </Box>
        </Paper>
      )}
      
      {/* Dialog for linking existing option */}
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Link Existing Option
          <IconButton
            aria-label="close"
            onClick={() => setLinkDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Search and select an option to link to this category
          </Typography>
          
          <Autocomplete
            value={optionSearch}
            onChange={(event, newValue) => {
              setOptionSearch(newValue);
            }}
            freeSolo
            options={availableOptions.map(option => option.fullLabel)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search options"
                margin="normal"
                variant="outlined"
                fullWidth
              />
            )}
          />
          
          {/* // Modify the link dialog to show item type (option or category)
          // Inside the Dialog component: */}
          <List sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
            {filteredOptions.map((item) => (
              <ListItem 
                key={item.path}
                button
                selected={selectedOption === item.path}
                onClick={() => setSelectedOption(item.path)}
                sx={{
                  borderLeft: selectedOption === item.path ? '3px solid #1976d2' : '3px solid transparent',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {selectedOption === item.path && <Check size={18} color="#1976d2" />}
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {item.label}
                      <Chip 
                        size="small" 
                        label={item.type === 'category' ? 'Category' : 'Option'} 
                        color={item.type === 'category' ? 'secondary' : 'primary'}
                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                  }
                  secondary={item.fullLabel}
                />
              </ListItem>
            ))}
            
            {optionSearch && filteredOptions.length === 0 && (
              <ListItem>
                <ListItemText 
                  primary="No matching items found"
                  secondary="Try a different search term"
                />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleLinkSubmit}
            disabled={!selectedOption}
          >
            Link Option
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LinkedFieldEditor;