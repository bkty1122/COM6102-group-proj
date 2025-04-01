// src/components/formbuilder/FormExport.js
import React from 'react';
import { Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { exportFormAsJson } from './utils/exportUtils';

const FormExport = ({ pages }) => {
  const handleExport = () => {
    // Log form data for debugging
    console.log("Exporting form data:", pages);
    
    // Export the form data
    exportFormAsJson(pages);
  };

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<DownloadIcon />}
      onClick={handleExport}
      sx={{ ml: 2 }}
    >
      Export JSON
    </Button>
  );
};

export default FormExport;