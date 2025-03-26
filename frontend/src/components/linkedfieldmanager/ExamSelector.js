// pages/ExamSelector.js
import React, { useState, useEffect } from 'react';
import { Container, Typography, Box } from '@mui/material';
import LinkedFieldSelector from './LinkedFieldSelector';

const ExamSelector = () => {
  const [linkedFieldsData, setLinkedFieldsData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // In a real application, you would fetch this from your API
    // For now, we'll simulate loading the data
    const fetchData = async () => {
      try {
        // Replace this with your actual data fetching logic
        // const response = await fetch('/api/linked-fields');
        // const data = await response.json();
        
        // For demo purposes, we're using the data structure defined above
        const data = {
          "exam_language": {
            "label": "Exam Language",
            "options": [
              // ... your data structure from above
            ]
          }
        };
        
        setLinkedFieldsData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading linked fields data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) {
    return (
      <Container>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Loading exam configuration...</Typography>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container>
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Exam Configurator
        </Typography>
        
        <Typography variant="body1" paragraph>
          Select the exam parameters from the dropdown menus below. Each selection will 
          filter the available options in the subsequent dropdowns.
        </Typography>
        
        <LinkedFieldSelector linkedFieldsData={linkedFieldsData} />
      </Box>
    </Container>
  );
};

export default ExamSelector;