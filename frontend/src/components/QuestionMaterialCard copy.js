// QuestionMaterialCard.js 
import React, { useState } from "react";
import { Box, Button, Typography, Grid } from "@mui/material";

const BlankPage = () => {
  const [cards, setCards] = useState([]); // Tracks the current cards ("question" or "material")

  // Add a "Question" card
  const addQuestion = () => {
    if (!cards.includes("question")) {
      setCards((prev) => [...prev, "question"]);
    }
  };

  // Add a "Material" card
  const addMaterial = () => {
    if (!cards.includes("material")) {
      setCards((prev) => [...prev, "material"]);
    }
  };

  // Remove a card (either "question" or "material")
  const removeCard = (type) => {
    setCards((prev) => prev.filter((card) => card !== type));
  };

  return (
    <Box
      sx={{
        p: 4,
        border: "1px solid #ccc",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
        mt: 2,
      }}
    >
      {/* Page Title */}
      <Typography variant="h4" gutterBottom>
        Blanket Page
      </Typography>

      {/* Add Buttons */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          onClick={addQuestion}
          disabled={cards.includes("question") || cards.length >= 2} // Disable if "question" already exists or max cards reached
        >
          Add Question
        </Button>
        <Button
          variant="contained"
          onClick={addMaterial}
          disabled={cards.includes("material") || cards.length >= 2} // Disable if "material" already exists or max cards reached
        >
          Add Material
        </Button>
      </Box>

      {/* Render Cards */}
      <Grid container spacing={2}>
        {cards.map((card, index) => (
          <Grid
            item
            key={index}
            xs={cards.length === 1 ? 12 : 6} // Full width if 1 card, half width if 2 cards
          >
            <Box
              sx={{
                p: 3,
                border: "1px solid #ddd",
                borderRadius: "8px",
                backgroundColor: card === "question" ? "#e3f2fd" : "#fce4ec", // Blue for "Question", Pink for "Material"
                height: "200px", // Fixed card height
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h6">
                {card === "question" ? "Question Card" : "Material Card"}
              </Typography>
              <Button
                variant="outlined"
                color="error"
                onClick={() => removeCard(card)} // Remove the card on click
              >
                Remove {card === "question" ? "Question" : "Material"}
              </Button>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default BlankPage;