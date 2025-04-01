// src/components/dashboard/EditMaterialDialog.js
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider
} from '@mui/material';
import { Edit as EditIcon, CloudUpload as PublishIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const EditMaterialDialog = ({ 
  open, 
  onClose, 
  material, 
  onSave,
  filterOptions 
}) => {
  const navigate = useNavigate();
  
  // If no material is provided, don't render anything
  if (!material) return null;
  
  const { 
    uniqueLanguages, 
    uniqueExamTypes, 
    uniqueComponents 
  } = filterOptions;
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Material</DialogTitle>
      <DialogContent>
        <Box sx={{ my: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Material ID: {material.id}
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                label="Title"
                fullWidth
                defaultValue={material.title}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  defaultValue={material.exam_language}
                  label="Language"
                >
                  {uniqueLanguages.map(lang => (
                    <MenuItem key={lang} value={lang}>{lang}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Exam System</InputLabel>
                <Select
                  defaultValue={material.exam_type}
                  label="Exam System"
                >
                  {uniqueExamTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Component</InputLabel>
                <Select
                  defaultValue={material.component}
                  label="Component"
                >
                  {uniqueComponents.map(comp => (
                    <MenuItem key={comp} value={comp}>{comp}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom>
                Material Status
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    defaultValue={material.status}
                    label="Status"
                    size="small"
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="published">Published</MenuItem>
                  </Select>
                </FormControl>
                
                <Button 
                  startIcon={<PublishIcon />}
                  color="success"
                  variant="outlined"
                  disabled={material.status === 'published'}
                >
                  Publish Now
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ 
                backgroundColor: 'grey.50', 
                p: 2, 
                borderRadius: 1,
                mt: 1
              }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Created by: {material.created_by} on {new Date(material.created_at).toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Last updated by: {material.updated_by} on {new Date(material.updated_at).toLocaleString()}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          {/* Note about database connection */}
          <Box sx={{ 
            mt: 2, 
            p: 2,
            backgroundColor: 'warning.light',
            borderRadius: 1
          }}>
            <Typography variant="body2" color="warning.dark">
              <strong>Note:</strong> Database connection not implemented. In production, this form would save changes to the database. This is a UI mockup only.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={() => navigate(`/form-builder`)} 
          variant="outlined"
          startIcon={<EditIcon />}
        >
          Edit in Form Builder
        </Button>
        <Button onClick={onSave} variant="contained">Save Changes</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditMaterialDialog;