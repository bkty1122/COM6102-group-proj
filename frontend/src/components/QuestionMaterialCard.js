// QuestionMaterialCard.js
import React from "react";
import { Box, Button, Typography } from "@mui/material";

const QuestionMaterialCard = ({ type, onRemove }) => {
  return (
    <Box
      sx={{
        p: 3,
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: type === "question" ? "#e3f2fd" : "#fce4ec", // Blue for "Question", Pink for "Material"
        height: "200px", // Fixed card height
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Typography variant="h6">
        {type === "question" ? "Question Card" : "Material Card"}
      </Typography>
      <Button
        variant="outlined"
        color="error"
        onClick={onRemove}
      >
        Remove {type === "question" ? "Question" : "Material"}
      </Button>
    </Box>
  );
};

export default QuestionMaterialCard;