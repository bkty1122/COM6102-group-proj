import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, Typography, TextField, Checkbox } from "@mui/material";

const SortableItem = ({ id, question }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: "16px",
    marginBottom: "8px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
  };

  return (
    <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Typography variant="h6" gutterBottom>
        {question.label}
      </Typography>
      {question.type === "text" && <TextField fullWidth />}
      {question.type === "checkbox" && <Checkbox />}
    </Box>
  );
};

export default SortableItem;