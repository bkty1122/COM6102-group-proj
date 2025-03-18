// BlankPage.js
import React, { useState } from "react";
import { Box, Button, Typography, Grid } from "@mui/material";
import NavigationBar from "./NavigationBar";
import QuestionMaterialCard from "./QuestionMaterialCard";

const BlankPage = () => {
  const [pages, setPages] = useState([
    { id: 1, cards: [] }, // Each page starts with no cards
  ]);
  const [currentPage, setCurrentPage] = useState(0);

  // Add a new page
  const addPage = () => {
    setPages((prev) => [...prev, { id: prev.length + 1, cards: [] }]);
    setCurrentPage(pages.length); // Navigate to the newly added page
  };

  // Delete the current page (only if more than one page exists)
  const deletePage = () => {
    if (pages.length > 1) {
      const updatedPages = pages.filter((_, index) => index !== currentPage);
      setPages(updatedPages);
      setCurrentPage((prev) => (prev > 0 ? prev - 1 : 0));
    }
  };

  // Add a card (either "question" or "material")
  const addCard = (type) => {
    // Only add if this type doesn't exist and we have less than 2 cards
    if (!pages[currentPage].cards.includes(type) && pages[currentPage].cards.length < 2) {
      setPages((prev) => {
        // Create a deep clone of the current page's cards array
        const updatedPages = prev.map((page, index) => {
          if (index === currentPage) {
            return { ...page, cards: [...page.cards, type] }; // Immutable update
          }
          return page;
        });
        return updatedPages;
      });
    }
  };

  // Remove a card
  const removeCard = (type) => {
    setPages((prev) => {
      const updatedPages = prev.map((page, index) => {
        if (index === currentPage) {
          return { ...page, cards: page.cards.filter((card) => card !== type) }; // Immutable update
        }
        return page;
      });
      return updatedPages;
    });
  };

  // Get the current page's cards
  const currentCards = pages[currentPage]?.cards || [];

  return (
    <Box>
      {/* Navigation Bar */}
      <NavigationBar
        pages={pages}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        addPage={addPage}
        deletePage={deletePage}
      />

      {/* Page Content */}
      <Box
        sx={{
          p: 4,
          border: "1px solid #ccc",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9",
          mt: 2,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Page {currentPage + 1}
        </Typography>

        {/* Add Card Buttons */}
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            onClick={() => addCard("question")}
            disabled={currentCards.includes("question") || currentCards.length >= 2}
          >
            Add Question
          </Button>
          <Button
            variant="contained"
            onClick={() => addCard("material")}
            disabled={currentCards.includes("material") || currentCards.length >= 2}
          >
            Add Material
          </Button>
        </Box>

        {/* Render Cards */}
        <Grid container spacing={2}>
          {currentCards.map((card, index) => (
            <Grid
              item
              key={index}
              xs={currentCards.length === 1 ? 12 : 6} // Full width if 1 card, half width if 2 cards
            >
              <QuestionMaterialCard
                type={card}
                onRemove={() => removeCard(card)}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default BlankPage;