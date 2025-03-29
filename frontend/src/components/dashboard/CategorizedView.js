// src/components/dashboard/CategorizedView.js
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

const CategorizedView = ({ materialsByLanguage, onEditMaterial }) => {
  return (
    <Box>
      {Object.keys(materialsByLanguage).map(language => (
        <Paper key={language} sx={{ mb: 3, overflow: 'hidden' }}>
          <Box sx={{ 
            p: 2, 
            backgroundColor: 'primary.main', 
            color: 'white'
          }}>
            <Typography variant="h6">
              {language} ({Object.values(materialsByLanguage[language])
                .flat().length} materials)
            </Typography>
          </Box>
          
          {Object.keys(materialsByLanguage[language]).map(examType => (
            <Box key={examType} sx={{ mb: 2 }}>
              <Box sx={{ 
                p: 1.5, 
                pl: 3,
                backgroundColor: 'grey.100', 
                borderBottom: '1px solid #ddd',
                borderTop: '1px solid #ddd'
              }}>
                <Typography variant="subtitle1">
                  {examType} ({materialsByLanguage[language][examType].length})
                </Typography>
              </Box>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Component</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Questions</TableCell>
                      <TableCell>Updated By</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {materialsByLanguage[language][examType].map(material => (
                      <TableRow key={material.id} hover>
                        <TableCell>{material.id}</TableCell>
                        <TableCell>{material.title}</TableCell>
                        <TableCell>{material.component}</TableCell>
                        <TableCell>
                          <Chip 
                            label={material.status} 
                            color={material.status === 'published' ? 'success' : 'warning'} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{material.question_count}</TableCell>
                        <TableCell>
                          {material.updated_by}
                          <Typography variant="caption" display="block" color="text.secondary">
                            {new Date(material.updated_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => onEditMaterial(material)} title="Edit">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" title="View">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
        </Paper>
      ))}
    </Box>
  );
};

export default CategorizedView;