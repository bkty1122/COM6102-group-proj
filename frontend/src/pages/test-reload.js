// src/pages/FormBuilderEditPage.js
import React, { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Typography, Alert } from "@mui/material";

// Hooks
import useFormBuilder from "../components/formbuilder/hooks/useFormBuilder";

// Shared Components
import TopAppBarLoggedIn from '../components/shared/TopAppBarLoggedIn';

// Test JSON data (in a real app, this would be imported or fetched)
import testFormData from "../form-export-2025-03-30(general).json";

const FormBuilderEditPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get the form builder hooks
  const {
    pages,
    currentPage,
    setCurrentPage,
    currentPageData,
    loadFormData
  } = useFormBuilder();
  
  // Load the test data on component mount
  useEffect(() => {
    try {
      console.log("Loading test form data:", testFormData);
      
      // Transform the data to match the expected structure in useFormBuilder
      const formattedData = {
        pages: testFormData.pages.map((page, index) => ({
          id: index + 1,
          examCategories: {
            exam_language: page.exam_language || "en",
            exam_type: page.exam_categories?.exam_type || "",
            component: page.exam_categories?.component || "",
            category: page.exam_categories?.category || ""
          },
          cards: page.cards.map(card => card.card_type),
          cardContents: page.cards.reduce((acc, card) => {
            // Create the content structure expected by the form builder
            acc[card.card_type] = card.contents.map((content, idx) => ({
              ...content,
              order_id: idx
            }));
            return acc;
          }, {})
        }))
      };
      
      console.log("Formatted data for form builder:", formattedData);
      loadFormData(formattedData);
      setLoading(false);
    } catch (err) {
      console.error("Error loading test form data:", err);
      setError("Failed to load test form data: " + err.message);
      setLoading(false);
    }
  }, [loadFormData]);

  // For debugging - log the current state of pages
  useEffect(() => {
    console.log("Current pages state:", pages);
  }, [pages]);

  // Handler for back button - without navigation
  const handleBack = () => {
    // In a real app with routing: navigate("/form-builder")
    alert("Would navigate back to form builder in a real app");
  };

  return (
    <>
      <TopAppBarLoggedIn appTitle="Form Builder - Edit Mode" />
      
      <Box sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <Box>
            <Typography variant="h4" gutterBottom>
              Form Edit Test
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              This is a test page to verify form data loading. It's currently displaying data from a static JSON file.
            </Alert>
            
            <Typography variant="h6" sx={{ mt: 3 }}>
              Form Data Summary:
            </Typography>
            
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography>Total Pages: {pages.length}</Typography>
              <Typography>Current Page: {currentPage + 1}</Typography>
              
              {currentPageData && (
                <>
                  <Typography sx={{ mt: 2 }}>Current Page Details:</Typography>
                  <Typography>
                    Language: {currentPageData.examCategories?.exam_language || "None"}
                  </Typography>
                  <Typography>
                    Type: {currentPageData.examCategories?.exam_type || "None"}
                  </Typography>
                  <Typography>
                    Component: {currentPageData.examCategories?.component || "None"}
                  </Typography>
                  <Typography>
                    Cards: {currentPageData.cards?.join(", ") || "None"}
                  </Typography>
                  
                  <Typography sx={{ mt: 2 }}>
                    Card Contents:
                  </Typography>
                  
                  {currentPageData.cards?.map(cardType => (
                    <Box key={cardType} sx={{ mt: 1 }}>
                      <Typography variant="subtitle2">
                        {cardType} ({(currentPageData.cardContents[cardType] || []).length} items)
                      </Typography>
                      
                      {(currentPageData.cardContents[cardType] || []).map(content => (
                        <Box key={content.id} sx={{ ml: 2, my: 0.5 }}>
                          <Typography variant="body2">
                            ID: {content.id} - Type: {content.type}
                          </Typography>
                          {content.type === 'single-choice' && (
                            <Typography variant="body2" sx={{ ml: 2 }}>
                              Question: {content.question?.substring(0, 50)}...
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  ))}
                </>
              )}
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Button 
                variant="contained" 
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
              >
                Previous Page
              </Button>
              <Button 
                variant="contained" 
                onClick={() => setCurrentPage(prev => Math.min(pages.length - 1, prev + 1))}
                disabled={currentPage === pages.length - 1}
                sx={{ ml: 2 }}
              >
                Next Page
              </Button>
              <Button 
                variant="outlined" 
                color="secondary"
                onClick={handleBack}
                sx={{ ml: 2 }}
              >
                Back to Form Builder
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
};

export default FormBuilderEditPage;