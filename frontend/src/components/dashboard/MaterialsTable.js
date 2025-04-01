// src/components/dashboard/MaterialsTable.js
import React from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Typography,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  ContentCopy as DuplicateIcon
} from '@mui/icons-material';

const MaterialsTable = ({
  materials,
  filteredMaterials,
  page,
  rowsPerPage,
  searchQuery,
  filters,
  onPageChange,
  onRowsPerPageChange,
  onSearchChange,
  onOpenFilterDialog,
  onResetFilters,
  onEditMaterial
}) => {
  const paginatedMaterials = filteredMaterials.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, borderBottom: '1px solid #eee' }}>
        <TextField
          placeholder="Search materials..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={onSearchChange}
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <Button 
          startIcon={<FilterListIcon />} 
          onClick={onOpenFilterDialog}
          variant="outlined"
        >
          Filters
          {Object.values(filters).some(v => v) && (
            <Chip 
              size="small" 
              label={Object.values(filters).filter(v => v).length} 
              color="primary" 
              sx={{ ml: 1 }} 
            />
          )}
        </Button>
      </Box>
      
      <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Language</TableCell>
              <TableCell>Exam System</TableCell>
              <TableCell>Component</TableCell>
              <TableCell>Questions</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedMaterials.map((material) => (
              <TableRow key={material.id} hover>
                <TableCell>{material.id}</TableCell>
                <TableCell>{material.title}</TableCell>
                <TableCell>{material.exam_language}</TableCell>
                <TableCell>{material.exam_type}</TableCell>
                <TableCell>{material.component}</TableCell>
                <TableCell>{material.question_count}</TableCell>
                <TableCell>
                  <Chip 
                    label={material.status} 
                    color={material.status === 'published' ? 'success' : 'warning'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  {new Date(material.updated_at).toLocaleDateString()}
                  <Typography variant="caption" display="block" color="text.secondary">
                    by {material.updated_by}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => onEditMaterial(material)} title="Edit">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" title="View">
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" title="Duplicate">
                    <DuplicateIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            
            {paginatedMaterials.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No materials found matching your criteria
                  </Typography>
                  <Button 
                    variant="text" 
                    sx={{ mt: 1 }}
                    onClick={onResetFilters}
                  >
                    Clear filters
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredMaterials.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </Paper>
  );
};

export default MaterialsTable;