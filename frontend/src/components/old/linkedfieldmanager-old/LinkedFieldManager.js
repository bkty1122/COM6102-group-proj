// LinkedFieldManager.js
import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Snackbar,
  Alert,
  Grid,
  Tabs,
  Tab
} from "@mui/material";
import {
  Plus,
  FileText,
  DownloadCloud,
  UploadCloud,
  Save
} from "lucide-react";
import LinkedFieldsTreeView from "./LinkedFieldsTreeView";
import LinkedFieldEditor from "./LinkedFieldEditor";
import CategoryFormPreview from "./CategoryFormPreview";
import { flattenHierarchy } from "./utils/hierarchyUtils";
import { fetchLinkedFields, saveLinkedFields } from "./services/fieldService";
import SearchPanel from "./SearchPanel";
import JsonEditorDialog from "./JsonEditorDialog";
import AddCategoryDialog from "./AddCategoryDialog";

// Initial mock data structure - will be replaced with API data
const INITIAL_LINKED_FIELDS = {};

const LinkedFieldManager = () => {
  const [linkedFields, setLinkedFields] = useState(INITIAL_LINKED_FIELDS);
  const [selectedPath, setSelectedPath] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [jsonEditorOpen, setJsonEditorOpen] = useState(false);
  const [jsonValue, setJsonValue] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchLinkedFields();
        setLinkedFields(data);
        setSnackbar({
          open: true,
          message: 'Linked fields configuration loaded successfully',
          severity: 'success'
        });
      } catch (error) {
        console.error("Error loading linked fields:", error);
        setSnackbar({
          open: true,
          message: 'Error loading configuration. Using default values.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Flatten the hierarchical structure for search
  const flattenedHierarchy = flattenHierarchy(linkedFields);

  // Handle node selection in the tree view
  const handleNodeSelect = (path, node) => {
    setSelectedPath(path);
    setSelectedNode(node);
  };

  // Save current configuration to backend
  const handleSaveConfiguration = async () => {
    try {
      setSaving(true);
      await saveLinkedFields(linkedFields);
      setSaving(false);
      setSnackbar({
        open: true,
        message: 'Configuration saved successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error("Error saving linked fields:", error);
      setSaving(false);
      setSnackbar({
        open: true,
        message: 'Error saving configuration',
        severity: 'error'
      });
    }
  };

  // Update the linked fields structure
// Update the linked fields structure
const updateLinkedFields = (path, update) => {
  // If this is a simple label update
  if (update.label !== undefined) {
    const parts = path.split('.');
    let newLinkedFields = JSON.parse(JSON.stringify(linkedFields));
    let current = newLinkedFields;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === 0) {
        // Root level key
        if (current[part]) {
          current[part].label = update.label;
        }
        break;
      } else if (i % 2 === 1) {
        // This is an option ID
        if (current.options) {
          const option = current.options.find(opt => opt.id === part);
          if (option) {
            if (i === parts.length - 1) {
              option.label = update.label;
            } else {
              current = option;
            }
          }
        }
      } else {
        // This is a child key
        if (current.children && current.children[part]) {
          if (i === parts.length - 1) {
            current.children[part].label = update.label;
          } else {
            current = current.children[part];
          }
        }
      }
    }
    
    setLinkedFields(newLinkedFields);
    setSnackbar({
      open: true,
      message: 'Field updated successfully',
      severity: 'success'
    });
    return;
  }
  
  // Handle more complex updates
  if (update.type === 'add_option') {
    // Code for adding option (unchanged)
    const parts = path.split('.');
    let newLinkedFields = JSON.parse(JSON.stringify(linkedFields));
    let current = newLinkedFields;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === 0) {
        // Root level key
        current = current[part];
      } else if (i % 2 === 1) {
        // This is an option ID
        const option = current.options.find(opt => opt.id === part);
        if (option) {
          current = option;
        }
      } else {
        // This is a child key
        current = current.children[part];
      }
    }
    
    // Add the new option
    if (!current.options) {
      current.options = [];
    }
    
    // Check if ID already exists
    if (current.options.some(opt => opt.id === update.option.id)) {
      setSnackbar({
        open: true,
        message: 'Option ID already exists',
        severity: 'error'
      });
      return;
    }
    
    current.options.push(update.option);
    setLinkedFields(newLinkedFields);
    setSnackbar({
      open: true,
      message: 'Option added successfully',
      severity: 'success'
    });
  } else if (update.type === 'delete_option') {
    // Fix for delete_option
    const parts = path.split('.');
    let newLinkedFields = JSON.parse(JSON.stringify(linkedFields));
    let current = newLinkedFields;
    let parent = null;
    let optionIdToRemove = parts[parts.length - 1];
    let parentPath = parts.slice(0, parts.length - 1);
    
    console.log("Deleting option:", optionIdToRemove);
    console.log("Parent path:", parentPath);
    
    // Handle root level deletion
    if (parts.length === 1) {
      if (newLinkedFields[optionIdToRemove]) {
        delete newLinkedFields[optionIdToRemove];
        
        setLinkedFields(newLinkedFields);
        setSelectedPath("");
        setSelectedNode(null);
        setSnackbar({
          open: true,
          message: 'Category deleted successfully',
          severity: 'success'
        });
        return;
      }
    }
    
    // Find the parent
    try {
      for (let i = 0; i < parentPath.length; i++) {
        const part = parentPath[i];
        if (i === 0) {
          // Root level key
          parent = newLinkedFields;
          if (!parent[part]) {
            throw new Error(`Root category not found: ${part}`);
          }
          current = current[part];
        } else if (i % 2 === 1) {
          // This is an option ID
          parent = current;
          if (!current.options) {
            throw new Error(`No options array found at path: ${parentPath.slice(0, i).join('.')}`);
          }
          const option = current.options.find(opt => opt.id === part);
          if (!option) {
            throw new Error(`Option not found: ${part} at path: ${parentPath.slice(0, i).join('.')}`);
          }
          current = option;
        } else {
          // This is a child key
          parent = current;
          if (!current.children || !current.children[part]) {
            throw new Error(`Child category not found: ${part} at path: ${parentPath.slice(0, i).join('.')}`);
          }
          current = current.children[part];
        }
      }
      
      // Remove the option based on path pattern
      if (parts.length % 2 === 0) {
        // It's an option to remove
        if (!parent.options) {
          throw new Error(`No options array found at path: ${parentPath.join('.')}`);
        }
        
        const optionIndex = parent.options.findIndex(opt => opt.id === optionIdToRemove);
        if (optionIndex === -1) {
          throw new Error(`Option not found: ${optionIdToRemove} at path: ${parentPath.join('.')}`);
        }
        
        parent.options.splice(optionIndex, 1);
      } else {
        // It's a category to remove
        if (!parent.children) {
          throw new Error(`No children object found at path: ${parentPath.join('.')}`);
        }
        
        if (!parent.children[optionIdToRemove]) {
          throw new Error(`Child category not found: ${optionIdToRemove} at path: ${parentPath.join('.')}`);
        }
        
        delete parent.children[optionIdToRemove];
      }
      
      setLinkedFields(newLinkedFields);
      setSelectedPath("");
      setSelectedNode(null);
      setSnackbar({
        open: true,
        message: 'Item deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      setSnackbar({
        open: true,
        message: `Error deleting item: ${error.message}`,
        severity: 'error'
      });
    }
  } else if (update.type === 'add_child_category') {
    setAddCategoryDialogOpen(true);
  } else if (update.type === 'delete_category') {
    // Code for delete_category (similar fix as delete_option)
    const parts = path.split('.');
    let newLinkedFields = JSON.parse(JSON.stringify(linkedFields));
    let current = newLinkedFields;
    let parent = null;
    let categoryToRemove = parts[parts.length - 1];
    
    try {
      // Find the parent
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (i === 0) {
          // Root level key
          parent = newLinkedFields;
          if (!parent[part]) {
            throw new Error(`Root category not found: ${part}`);
          }
          current = current[part];
        } else if (i % 2 === 1) {
          // This is an option ID
          parent = current;
          if (!current.options) {
            throw new Error(`No options array found at path: ${parts.slice(0, i).join('.')}`);
          }
          const option = current.options.find(opt => opt.id === part);
          if (!option) {
            throw new Error(`Option not found: ${part} at path: ${parts.slice(0, i).join('.')}`);
          }
          current = option;
        } else {
          // This is a child key
          parent = current;
          if (!current.children || !current.children[part]) {
            throw new Error(`Child category not found: ${part} at path: ${parts.slice(0, i).join('.')}`);
          }
          current = current.children[part];
        }
      }
      
      // Remove the category
      if (current.children) {
        delete current.children[categoryToRemove];
        
        setLinkedFields(newLinkedFields);
        setSnackbar({
          open: true,
          message: 'Category deleted successfully',
          severity: 'success'
        });
      } else {
        throw new Error(`No children object found at path: ${parts.slice(0, parts.length - 1).join('.')}`);
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      setSnackbar({
        open: true,
        message: `Error deleting category: ${error.message}`,
        severity: 'error'
      });
    }
  }
};
  
// Update handleAddRootCategory in LinkedFieldManager.js
const handleAddRootCategory = () => {
  if (!newCategoryId || !newCategoryName) return;
  
  const newCategoryKey = newCategoryId.trim().toLowerCase().replace(/\s+/g, '_');
  
  // Check if the key already exists
  if (linkedFields[newCategoryKey]) {
    setSnackbar({
      open: true,
      message: 'Category ID already exists',
      severity: 'error'
    });
    return;
  }
  
  // Create a properly structured new category
  const newCategory = {
    label: newCategoryName,
    options: []
  };
  
  // Use setState with a callback to ensure state is properly updated
  setLinkedFields(prevFields => {
    const updatedFields = { 
      ...prevFields, 
      [newCategoryKey]: newCategory 
    };
    
    console.log("Updated linked fields:", updatedFields);
    return updatedFields;
  });
  
  setAddCategoryDialogOpen(false);
  setNewCategoryId("");
  setNewCategoryName("");
  setSnackbar({
    open: true,
    message: 'Root category added successfully',
    severity: 'success'
  });
};
  
  // Handle adding a child category to an option
  const handleAddChildCategory = () => {
    if (!newCategoryId || !newCategoryName || !selectedPath) return;
    
    const parts = selectedPath.split('.');
    let newLinkedFields = JSON.parse(JSON.stringify(linkedFields));
    let current = newLinkedFields;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === 0) {
        // Root level key
        current = current[part];
      } else if (i % 2 === 1) {
        // This is an option ID
        const option = current.options.find(opt => opt.id === part);
        if (option) {
          current = option;
        }
      } else {
        // This is a child key
        current = current.children[part];
      }
    }
    
    // Add the new child category
    if (!current.children) {
      current.children = {};
    }
    
    // Check if category already exists
    if (current.children[newCategoryId]) {
      setSnackbar({
        open: true,
        message: 'Category ID already exists',
        severity: 'error'
      });
      return;
    }
    
    current.children[newCategoryId] = {
      label: newCategoryName,
      options: []
    };
    
    setLinkedFields(newLinkedFields);
    setAddCategoryDialogOpen(false);
    setNewCategoryId("");
    setNewCategoryName("");
    setSnackbar({
      open: true,
      message: 'Child category added successfully',
      severity: 'success'
    });
  };
  
  // Handle search in the hierarchy
  const handleSearch = (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    const results = Object.keys(flattenedHierarchy).filter(path => {
      const node = flattenedHierarchy[path];
      return (
        node.label.toLowerCase().includes(query.toLowerCase()) ||
        node.id.toLowerCase().includes(query.toLowerCase())
      );
    }).map(path => ({
      path,
      ...flattenedHierarchy[path]
    }));
    
    setSearchResults(results);
  };
  
  // Handle opening the JSON editor
  const handleOpenJsonEditor = () => {
    setJsonValue(JSON.stringify(linkedFields, null, 2));
    setJsonEditorOpen(true);
  };
  
  // Handle saving the JSON editor
  const handleSaveJson = () => {
    try {
      const parsed = JSON.parse(jsonValue);
      setLinkedFields(parsed);
      setJsonEditorOpen(false);
      setSnackbar({
        open: true,
        message: 'JSON updated successfully',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Invalid JSON format',
        severity: 'error'
      });
    }
  };

  // Export the linked fields configuration
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(linkedFields, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "linked_fields_config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
  
  // Import linked fields configuration from file
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        setLinkedFields(parsed);
        setSnackbar({
          open: true,
          message: 'Configuration imported successfully',
          severity: 'success'
        });
      } catch (err) {
        setSnackbar({
          open: true,
          message: 'Invalid JSON file',
          severity: 'error'
        });
      }
    };
    reader.readAsText(file);
  };
  
  // Reset to initial configuration
  const handleReset = async () => {
    try {
      setLoading(true);
      const data = await fetchLinkedFields(true); // Pass true to reset to default
      setLinkedFields(data);
      setSelectedPath("");
      setSelectedNode(null);
      setSnackbar({
        open: true,
        message: 'Reset to default configuration',
        severity: 'info'
      });
    } catch (error) {
      console.error("Error resetting linked fields:", error);
      setSnackbar({
        open: true,
        message: 'Error resetting configuration',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Linked Field Manager
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure hierarchical category relationships for question materials
        </Typography>
      </Paper>
      
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<Plus size={16} />}
            onClick={() => setAddCategoryDialogOpen(true)}
          >
            Add Root Category
          </Button>
          
          <Button 
            variant="outlined" 
            startIcon={<FileText size={16} />}
            onClick={handleOpenJsonEditor}
          >
            Edit JSON
          </Button>
          
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<Save size={16} />}
            onClick={handleSaveConfiguration}
            disabled={saving || loading}
          >
            {saving ? "Saving..." : "Save to Server"}
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<DownloadCloud size={16} />}
            onClick={handleExport}
          >
            Export
          </Button>
          
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadCloud size={16} />}
          >
            Import
            <input
              type="file"
              hidden
              accept=".json"
              onChange={handleImport}
            />
          </Button>
          
          <Button 
            variant="outlined" 
            color="error"
            onClick={handleReset}
          >
            Reset
          </Button>
        </Box>
      </Box>
      
      {/* Search Panel */}
      <SearchPanel 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        handleSearch={handleSearch}
        flattenedHierarchy={flattenedHierarchy}
        setSelectedPath={setSelectedPath}
        setSelectedNode={setSelectedNode}
        setSearchResults={setSearchResults}
      />
      
      <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Tree View" />
        <Tab label="Preview" />
      </Tabs>
      
      {loading ? (
        <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">Loading...</Typography>
        </Paper>
      ) : currentTab === 0 ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ height: '600px', overflow: 'auto', p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Category Structure
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <LinkedFieldsTreeView 
                data={linkedFields}
                onNodeSelect={handleNodeSelect}
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ height: '600px', overflow: 'auto' }}>
              <LinkedFieldEditor
                selectedPath={selectedPath}
                selectedNode={selectedNode}
                linkedFields={linkedFields}
                onUpdate={updateLinkedFields}
              />
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Paper elevation={1} sx={{ p: 3 }}>
          <CategoryFormPreview linkedFields={linkedFields} />
        </Paper>
      )}
      
      {/* Dialog for adding new category */}
      <AddCategoryDialog
        open={addCategoryDialogOpen}
        onClose={() => setAddCategoryDialogOpen(false)}
        selectedPath={selectedPath}
        newCategoryId={newCategoryId}
        setNewCategoryId={setNewCategoryId}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
        handleAddRootCategory={handleAddRootCategory}
        handleAddChildCategory={handleAddChildCategory}
      />
      
      {/* Dialog for JSON editor */}
      <JsonEditorDialog
        open={jsonEditorOpen}
        onClose={() => setJsonEditorOpen(false)}
        jsonValue={jsonValue}
        setJsonValue={setJsonValue}
        handleSaveJson={handleSaveJson}
      />
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LinkedFieldManager;