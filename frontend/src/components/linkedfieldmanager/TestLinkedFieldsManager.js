// frontend/src/components/linkedfieldmanager/TestLinkedFieldManager.js
import React, { useState } from "react";
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Divider
} from "@mui/material";
import LinkedFieldsTreeView from "./LinkedFieldsTreeView";
import { json as jsonSyntaxHighlight } from 'react-syntax-highlighter/dist/esm/languages/prism';
import { prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import SyntaxHighlighter from 'react-syntax-highlighter';

const TestLinkedFieldManager = ({ initialData, onSaveChanges }) => {
  const [linkedFields, setLinkedFields] = useState(initialData || {});
  const [selectedPath, setSelectedPath] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Handle selecting a node in the tree view
  const handleNodeSelect = (path, node) => {
    setSelectedPath(path);
    setSelectedNode(node);
    setEditValue(node.label || node.id);
  };
  
  // Handle changes to the linkedFields data
  const handleSave = async () => {
    setSaving(true);
    try {
      // Use the provided onSaveChanges function
      const success = await onSaveChanges(linkedFields);
      
      if (success) {
        // Reset edit mode
        setEditMode(false);
      }
    } finally {
      setSaving(false);
    }
  };
  
  // Handle adding a new root category
  const handleAddRootCategory = () => {
    if (!newCategoryId) return;
    
    const newData = {
      ...linkedFields,
      [newCategoryId]: {
        label: newCategoryLabel || newCategoryId,
        options: []
      }
    };
    
    setLinkedFields(newData);
    setShowNewCategoryDialog(false);
    setNewCategoryId("");
    setNewCategoryLabel("");
  };
  
  // Handle adding a new option to a category
  const handleAddOption = () => {
    if (!selectedPath || !newCategoryId) return;
    
    const parts = selectedPath.split('.');
    let newData = JSON.parse(JSON.stringify(linkedFields));
    let current = newData;
    
    // Navigate to the selected node
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === 0) {
        // Root level
        current = current[part];
      } else if (i % 2 === 1) {
        // This is an option ID
        const optionIndex = current.options.findIndex(opt => opt.id === part);
        if (optionIndex !== -1) {
          current = current.options[optionIndex];
        }
      } else {
        // This is a child category
        if (current.children && current.children[part]) {
          current = current.children[part];
        }
      }
    }
    
    // Add the new option
    if (!current.options) {
      current.options = [];
    }
    
    current.options.push({
      id: newCategoryId,
      label: newCategoryLabel || newCategoryId
    });
    
    setLinkedFields(newData);
    setShowNewCategoryDialog(false);
    setNewCategoryId("");
    setNewCategoryLabel("");
  };
  
  // Handle updating a node's label
  const handleUpdateNode = () => {
    if (!selectedPath || !editValue) return;
    
    const parts = selectedPath.split('.');
    let newData = JSON.parse(JSON.stringify(linkedFields));
    let current = newData;
    
    // Navigate to the selected node
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === 0) {
        // Root level
        if (i === parts.length - 1) {
          // This is the node we want to update
          if (newData[part]) {
            newData[part].label = editValue;
          }
          break;
        }
        current = current[part];
      } else if (i % 2 === 1) {
        // This is an option ID
        const optionIndex = current.options.findIndex(opt => opt.id === part);
        if (optionIndex !== -1) {
          if (i === parts.length - 1) {
            // This is the node we want to update
            current.options[optionIndex].label = editValue;
            break;
          }
          current = current.options[optionIndex];
        }
      } else {
        // This is a child category
        if (current.children && current.children[part]) {
          if (i === parts.length - 1) {
            // This is the node we want to update
            current.children[part].label = editValue;
            break;
          }
          current = current.children[part];
        }
      }
    }
    
    setLinkedFields(newData);
    setEditMode(false);
    
    // Update the selectedNode to reflect changes
    if (selectedNode) {
      setSelectedNode({
        ...selectedNode,
        label: editValue
      });
    }
  };
  
  // Handle deleting a node
  const handleDeleteNode = () => {
    if (!selectedPath) return;
    
    const parts = selectedPath.split('.');
    let newData = JSON.parse(JSON.stringify(linkedFields));
    
    // Handle root level deletion
    if (parts.length === 1) {
      delete newData[parts[0]];
      setLinkedFields(newData);
      setSelectedPath("");
      setSelectedNode(null);
      return;
    }
    
    let current = newData;
    let parent = null;
    let lastKey = null;
    
    // Navigate to find the parent of the node to delete
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      parent = current;
      lastKey = part;
      
      if (i === 0) {
        // Root level
        current = current[part];
      } else if (i % 2 === 1) {
        // This is an option ID
        const optionIndex = current.options.findIndex(opt => opt.id === part);
        if (optionIndex !== -1) {
          current = current.options[optionIndex];
        }
      } else {
        // This is a child category
        if (current.children && current.children[part]) {
          current = current.children[part];
        }
      }
    }
    
    // Delete the node based on its position
    const lastPart = parts[parts.length - 1];
    if (parts.length % 2 === 0) {
      // Deleting an option
      if (parent.options) {
        parent.options = parent.options.filter(opt => opt.id !== lastPart);
      }
    } else {
      // Deleting a child category
      if (parent.children) {
        delete parent.children[lastPart];
      }
    }
    
    setLinkedFields(newData);
    setSelectedPath("");
    setSelectedNode(null);
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Exam Field Relationship Manager
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Left Panel - Tree View */}
        <Paper elevation={3} sx={{ p: 2, flex: 1, minWidth: 0 }}>
          <Typography variant="h6" gutterBottom>
            Field Structure
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <LinkedFieldsTreeView 
            data={linkedFields} 
            onNodeSelect={handleNodeSelect} 
          />
        </Paper>
        
        {/* Right Panel - Node Editor */}
        <Paper elevation={3} sx={{ p: 2, flex: 1, minWidth: 0 }}>
          <Typography variant="h6" gutterBottom>
            Node Properties
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {selectedNode ? (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Selected: {selectedNode.label || selectedNode.id}
              </Typography>
              <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                Path: {selectedPath}
              </Typography>
              
              {editMode ? (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Label"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" color="primary" onClick={handleUpdateNode}>
                      Update
                    </Button>
                    <Button variant="outlined" onClick={() => {
                      setEditMode(false);
                      setEditValue(selectedNode.label || selectedNode.id);
                    }}>
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ mb: 2 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => setEditMode(true)}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    onClick={() => setShowNewCategoryDialog(true)}
                    sx={{ mr: 1 }}
                  >
                    Add Child
                  </Button>
                  <Button 
                    variant="contained" 
                    color="error" 
                    onClick={handleDeleteNode}
                  >
                    Delete
                  </Button>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography color="text.secondary">
                Select a node from the tree to view or edit its properties.
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => setShowNewCategoryDialog(true)}
                sx={{ mt: 2 }}
              >
                Add Root Category
              </Button>
            </Box>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          {/* Save Changes Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Box>
        </Paper>
      </Box>
      
      {/* JSON Preview */}
      <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          JSON Preview
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
          <SyntaxHighlighter language={jsonSyntaxHighlight} style={prism}>
            {JSON.stringify(linkedFields, null, 2)}
          </SyntaxHighlighter>
        </Box>
      </Paper>
      
      {/* New Category/Option Dialog */}
      <Dialog open={showNewCategoryDialog} onClose={() => setShowNewCategoryDialog(false)}>
        <DialogTitle>
          {selectedPath ? `Add Child to ${selectedNode?.label || selectedNode?.id}` : 'Add Root Category'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="ID"
            fullWidth
            value={newCategoryId}
            onChange={(e) => setNewCategoryId(e.target.value.replace(/\s+/g, '_').toLowerCase())}
            helperText="Unique identifier (no spaces, lowercase)"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Label"
            fullWidth
            value={newCategoryLabel}
            onChange={(e) => setNewCategoryLabel(e.target.value)}
            helperText="Display name"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewCategoryDialog(false)}>Cancel</Button>
          <Button 
            onClick={selectedPath ? handleAddOption : handleAddRootCategory}
            variant="contained" 
            disabled={!newCategoryId}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TestLinkedFieldManager;