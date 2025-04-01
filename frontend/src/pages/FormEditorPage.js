// src/pages/FormEditorPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Alert, 
  CircularProgress,
  Button
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Shared Components
import TopAppBarLoggedIn from '../components/shared/TopAppBarLoggedIn';

// Form Editor Components
import FormEditor from '../components/formeditor/FormEditor';

// API for fetching question bank existence
import formExportApi from '../api/formExportApi';

const FormEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questionBankExists, setQuestionBankExists] = useState(false);
  const [questionBankTitle, setQuestionBankTitle] = useState('');
  
  // Check if question bank exists
  useEffect(() => {
    const checkQuestionBankExists = async () => {
      if (!id) {
        setError('No question bank ID provided');
        setLoading(false);
        return;
      }
      
      try {
        const response = await formExportApi.getFormById(id);
        if (response && response.success && response.data) {
          setQuestionBankExists(true);
          setQuestionBankTitle(response.data.title || id);
        } else {
          throw new Error('Invalid response from API');
        }
      } catch (err) {
        console.error('Error checking question bank:', err);
        setError('Question bank not found or you do not have permission to access it');
      } finally {
        setLoading(false);
      }
    };
    
    checkQuestionBankExists();
  }, [id]);
  
  // Navigate back to dashboard
  const handleBackClick = () => {
    navigate('/dashboard');
  };

  return (
    <>
      {/* Top App Bar with logout functionality */}
      <TopAppBarLoggedIn appTitle={`Edit Material: ${questionBankTitle}`} />
      
      {/* Back button */}
      <Box sx={{ p: 2, borderBottom: '1px solid #ddd' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackClick}
        >
          Back to Dashboard
        </Button>
      </Box>
      
      {/* Loading state */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Error state */}
      {!loading && error && (
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={handleBackClick}>
            Return to Dashboard
          </Button>
        </Box>
      )}
      
      {/* Form Editor */}
      {!loading && !error && questionBankExists && (
        <FormEditor questionBankId={id} />
      )}
    </>
  );
};

export default FormEditorPage;