// AvailableMaterials.js
// This component will render a list of available materials that can be dragged and dropped into the form builder. It will use the useDraggable hook from the @dnd-kit/core library to make the buttons draggable.
// Potential material types
// id: "text", label: "Text"
// id: "image", label: "Image"
// id: "video", label: "Video"
// id: "audio", label: "Audio"
// id: "llm-session", label: "LLM Interactive Session" (for setting the param for the llm discussion session, e.g. response text, requirement, etc.)

import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { useDraggable } from "@dnd-kit/core";

const AvailableMaterials = () => {
  const questionTypes = [
    { id: "text-material", label: "Text Material" },
    { id: "image-material", label: "Image Material" },
    { id: "video-material", label: "Video Material" },
    { id: "audio-material", label: "Audio Material" },
    { id: "llm-session-material", label: "LLM Interactive Session Material" },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Typography variant="h6" sx={{ mb: 2, px: 1 }}>
        Available Question Types
      </Typography>
      
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          padding: 2,
          border: "1px solid #ddd",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          overflowY: "auto",
          flexGrow: 1,
          // Enhanced scrollbar styles
          "&::-webkit-scrollbar": {
            width: "12px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#f1f1f1",
            borderRadius: "8px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#888",
            borderRadius: "8px",
            "&:hover": {
              backgroundColor: "#555",
            },
          },
        }}
      >
        {questionTypes.map((question) => (
          <DraggableButton key={question.id} id={question.id} label={question.label} />
        ))}
      </Box>
    </Box>
  );
};

const DraggableButton = ({ id, label }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
  });

  // To make the draggable element float outside its container:
  // 1. Add position: relative to the button
  // 2. Use a higher z-index when dragging
  // 3. Apply the transform directly to the element's style

  return (
    <Button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      variant="contained"
      sx={{
        backgroundColor: "#1976d2",
        color: "#fff",
        textTransform: "none",
        padding: "10px 16px",
        minHeight: "48px",
        position: isDragging ? "fixed" : "relative", // Use fixed positioning when dragging
        zIndex: isDragging ? 9999 : 1, // Super high z-index when dragging
        cursor: isDragging ? "grabbing" : "grab",
        transition: "background-color 0.2s",
        "&:hover": {
          backgroundColor: "#1565c0",
        },
        width: "100%", // Make buttons full width
        justifyContent: "flex-start", // Align text to left
        // Add visual indicator when dragging
        boxShadow: isDragging 
          ? "0 8px 16px rgba(0, 0, 0, 0.3)" 
          : "0 1px 3px rgba(0, 0, 0, 0.1)",
        opacity: isDragging ? 0.9 : 1,
      }}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        pointerEvents: isDragging ? "none" : "auto", // Prevent interfering with drop targets
      }}
    >
      {/* Add visual cue for dragging state */}
      {isDragging ? `Dragging: ${label}` : label}
    </Button>
  );
};

export default AvailableMaterials;