// frontend/src/App.js
import React, { useState, useEffect } from "react";
import TestLinkedFieldManager from './components/linkedfieldmanager/TestLinkedFieldsManager.js';
import { Box, CircularProgress, Typography, Snackbar, Alert, Button } from "@mui/material";
import { examFieldsApi } from './services/api';

function App() {
  const [linkedFieldsData, setLinkedFieldsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info"
  });

  // Load the JSON data when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await examFieldsApi.getExamFields();
        setLinkedFieldsData(data);
      } catch (err) {
        console.error("Error loading exam field relationship data:", err);
        setError(err.message || "Failed to load data");
        setSnackbar({
          open: true,
          message: `Failed to load data: ${err.message || "Unknown error"}`,
          severity: "error"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to save changes to the JSON file
  const handleSaveChanges = async (updatedData) => {
    try {
      // Show saving status
      setSnackbar({
        open: true,
        message: "Saving changes...",
        severity: "info"
      });
      
      // Call API to save changes
      await examFieldsApi.saveExamFields(updatedData);
      
      // Update local state
      setLinkedFieldsData(updatedData);
      
      // Show success message
      setSnackbar({
        open: true,
        message: "Changes saved successfully!",
        severity: "success"
      });
      
      return true; // Indicate success
    } catch (err) {
      console.error("Error saving changes:", err);
      setSnackbar({
        open: true,
        message: `Failed to save changes: ${err.message || "Unknown error"}`,
        severity: "error"
      });
      
      return false; // Indicate failure
    }
  };

  // Function to close the snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading exam field relationships...
        </Typography>
      </Box>
    );
  }

  if (error && !linkedFieldsData) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column" }}>
        <Typography variant="h6" color="error" gutterBottom>
          Error Loading Data
        </Typography>
        <Typography variant="body1">
          {error}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ mt: 2 }}
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <div>
      <TestLinkedFieldManager 
        initialData={linkedFieldsData} 
        onSaveChanges={handleSaveChanges} 
      />
      
      {/* Notification Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default App;