// src/components/formbuilder/FormExportTools.js
import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import FormExport from './FormExport';
import FormDbUpload from './FormDbUpload';

const FormExportTools = ({ pages, title, description }) => {
  return (
    <Box sx={{ mt: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        Export & Save Options
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Export your form as a JSON file or save it to the database for sharing.
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
        <FormExport pages={pages} />
        <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
        <FormDbUpload pages={pages} title={title} description={description} />
      </Box>
    </Box>
  );
};

export default FormExportTools;