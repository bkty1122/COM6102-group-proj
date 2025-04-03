// src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Button, CircularProgress } from '@mui/material';
import { Add as AddIcon, List as ListIcon } from '@mui/icons-material';
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
  getAllQuestionBanks,
  getFilterOptions, 
  getCategorizedMaterials,
  getDashboardStats,
  MOCK_MATERIALS // Fallback data
} from '../services/dataService';

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
  
  // Data states
  const [materials, setMaterials] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    uniqueLanguages: [],
    uniqueExamTypes: [],
    uniqueComponents: [],
    uniqueStatuses: []
  });
  const [materialsByLanguage, setMaterialsByLanguage] = useState({});
  const [stats, setStats] = useState({
    totalMaterials: 0,
    published: 0,
    drafts: 0,
    languages: 0,
    examTypes: 0,
    components: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch data from API when component mounts
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all question banks
      const questionBanks = await getAllQuestionBanks();
      setMaterials(questionBanks.length > 0 ? questionBanks : MOCK_MATERIALS);
      
      // Get filter options
      const options = await getFilterOptions(questionBanks);
      setFilterOptions(options);
      
      // Get categorized materials
      const categorized = await getCategorizedMaterials(questionBanks);
      setMaterialsByLanguage(categorized);
      
      // Get dashboard stats
      const dashboardStats = await getDashboardStats(questionBanks);
      setStats(dashboardStats);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load data. Please try again later.');
      
      // Use fallback data
      setMaterials(MOCK_MATERIALS);
      setFilterOptions(await getFilterOptions(MOCK_MATERIALS));
      setMaterialsByLanguage(await getCategorizedMaterials(MOCK_MATERIALS));
      setStats(await getDashboardStats(MOCK_MATERIALS));
    } finally {
      setLoading(false);
    }
  };
  
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
    // Refresh data after edit
    fetchDashboardData();
  };
  
  const handleCreateNew = () => {
    navigate('/form-builder');
  };
  
  const handleViewExports = () => {
    navigate('/form-exports');
  };
  
  // Filter materials based on search query and filters
  const filteredMaterials = materials.filter(material => {
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
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={handleCreateNew}
            >
              Create New Material
            </Button>
            
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<ListIcon />}
              onClick={handleViewExports}
            >
              View Exports
            </Button>
          </Box>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', my: 5 }}>
            <Typography color="error">{error}</Typography>
            <Button 
              variant="contained" 
              color="primary"
              sx={{ mt: 2 }}
              onClick={fetchDashboardData}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <>
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
                materials={materials}
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
          </>
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