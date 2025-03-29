// src/pages/DashboardPage.js
import React, { useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Components
import TopAppBarLoggedIn from '../components/shared/TopAppBarLoggedIn';
import StatisticsCards from '../components/dashboard/StatisticsCards';
import MaterialsTable from '../components/dashboard/MaterialsTable';
import CategorizedView from '../components/dashboard/CategorizedView';
import FilterDialog from '../components/dashboard/FilterDialog';
import EditMaterialDialog from '../components/dashboard/EditMaterialDialog';

// Services
import { 
  MOCK_MATERIALS, 
  getFilterOptions, 
  getCategorizedMaterials,
  getDashboardStats
} from '../services/mockDataService';

const DashboardPage = () => {
  const navigate = useNavigate();
  
  // States
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [filters, setFilters] = useState({
    exam_language: '',
    exam_type: '',
    component: '',
    status: ''
  });
  
  // Get filter options and categorized data
  const filterOptions = getFilterOptions(MOCK_MATERIALS);
  const materialsByLanguage = getCategorizedMaterials(MOCK_MATERIALS);
  const stats = getDashboardStats(MOCK_MATERIALS);
  
  // Event handlers
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };
  
  const handleFilterChange = (event) => {
    setFilters({
      ...filters,
      [event.target.name]: event.target.value
    });
  };
  
  const handleResetFilters = () => {
    setFilters({
      exam_language: '',
      exam_type: '',
      component: '',
      status: ''
    });
    setFilterDialogOpen(false);
  };
  
  const handleApplyFilters = () => {
    setPage(0);
    setFilterDialogOpen(false);
  };
  
  const handleEditMaterial = (material) => {
    setSelectedMaterial(material);
    setEditDialogOpen(true);
  };
  
  const handleSaveEdit = () => {
    // Here we would update the material in the database
    setEditDialogOpen(false);
    setSelectedMaterial(null);
  };
  
  const handleCreateNew = () => {
    navigate('/form-builder');
  };
  
  // Filter materials based on search query and filters
  const filteredMaterials = MOCK_MATERIALS.filter(material => {
    // Search filter
    const matchesSearch = 
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filters
    const matchesLanguage = !filters.exam_language || material.exam_language === filters.exam_language;
    const matchesType = !filters.exam_type || material.exam_type === filters.exam_type;
    const matchesComponent = !filters.component || material.component === filters.component;
    const matchesStatus = !filters.status || material.status === filters.status;
    
    return matchesSearch && matchesLanguage && matchesType && matchesComponent && matchesStatus;
  });
  
  return (
    <>
      <TopAppBarLoggedIn appTitle="Question Material Dashboard" />
      
      <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
        {/* Dashboard Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Question Materials Dashboard
          </Typography>
          
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
          >
            Create New Material
          </Button>
        </Box>
        
        {/* Stats Cards */}
        <StatisticsCards stats={stats} />
        
        {/* View Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="All Materials" />
            <Tab label="Categorized View" />
          </Tabs>
        </Paper>
        
        {/* Table View */}
        {tabValue === 0 && (
          <MaterialsTable 
            materials={MOCK_MATERIALS}
            filteredMaterials={filteredMaterials}
            page={page}
            rowsPerPage={rowsPerPage}
            searchQuery={searchQuery}
            filters={filters}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            onSearchChange={handleSearchChange}
            onOpenFilterDialog={() => setFilterDialogOpen(true)}
            onResetFilters={handleResetFilters}
            onEditMaterial={handleEditMaterial}
          />
        )}
        
        {/* Categorized View */}
        {tabValue === 1 && (
          <CategorizedView 
            materialsByLanguage={materialsByLanguage}
            onEditMaterial={handleEditMaterial}
          />
        )}
      </Box>
      
      {/* Dialogs */}
      <FilterDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        onApply={handleApplyFilters}
        filterOptions={filterOptions}
      />
      
      <EditMaterialDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        material={selectedMaterial}
        onSave={handleSaveEdit}
        filterOptions={filterOptions}
      />
    </>
  );
};

export default DashboardPage;