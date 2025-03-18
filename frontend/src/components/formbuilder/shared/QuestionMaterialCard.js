// QuestionMaterialCard.js
import React from "react";
import { Box, Button, Typography, IconButton, Tooltip } from "@mui/material";
import { useDroppable } from "@dnd-kit/core";
import SingleChoiceQuestion from "./SingleChoiceQuestion";
import { ArrowUp, ArrowDown } from "lucide-react"; // Import icons for reordering

const QuestionMaterialCard = ({ type, onRemove, contents = [], onRemoveContent, onReorderContent }) => {
  // Create a unique ID for this droppable area
  const droppableId = `droppable-${type}`;
  
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
  });

  // Handler for removing a specific content item
  const handleRemoveContent = (contentId) => {
    if (onRemoveContent) {
      onRemoveContent(type, contentId);
    }
  };

  // Handler for reordering content items
  const handleReorderContent = (contentId, direction) => {
    console.log(`Attempting to reorder: ${contentId} in direction: ${direction}`);
    if (onReorderContent) {
      onReorderContent(type, contentId, direction);
    }
  };

  // Helper to check if this content can be moved up or down
  const canMoveUp = (index) => index > 0;
  const canMoveDown = (index) => index < contents.length - 1;

  return (
    <Box
      sx={{
        p: 3,
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: type === "question" ? "#b3d9f5" : "#fce4ec", // Blue for Question, Pink for Material
        height: "auto",
        minHeight: "200px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {type === "question" ? "Question Card" : "Material Card"}
        </Typography>
        
        {/* Droppable area for components */}
        <Box 
          ref={setNodeRef}
          sx={{ 
            p: 2, 
            border: "2px dashed #ccc", 
            borderRadius: "8px",
            minHeight: "100px",
            mb: 2,
            backgroundColor: isOver ? "#e8f4ff" : "#ffffff60", // Highlight when dragging over
            transition: "background-color 0.5s ease"
          }}
        >
          {Array.isArray(contents) && contents.length > 0 ? (
            contents.map((content, index) => {
              // Log content for debugging
              console.log(`Rendering content ${index} in ${type} card:`, content);
              
              return (
                <Box 
                  key={content.id || `${type}-content-${index}`} 
                  sx={{ 
                    position: "relative", 
                    mb: 3,
                    border: "1px solid #eee",
                    borderRadius: "8px",
                    p: 1,
                    pt: 3, // Extra padding top for the reorder buttons
                    backgroundColor: "#fff"
                  }}
                >
                  {/* Reorder Controls - Always render both buttons but disable as needed */}
                  <Box 
                    sx={{ 
                      position: "absolute", 
                      top: "8px", 
                      right: "8px", 
                      display: "flex",
                      gap: "4px",
                      backgroundColor: "rgba(245,245,255,0.9)",
                      borderRadius: "4px", 
                      padding: "2px",
                      zIndex: 10
                    }}
                  >
                    <Tooltip title={canMoveUp(index) ? "Move Up" : "Already at top"}>
                      <span> {/* Wrap in span so tooltip works even when button is disabled */}
                        <IconButton 
                          size="small" 
                          disabled={!canMoveUp(index)} 
                          onClick={() => handleReorderContent(content.id, 'up')}
                          sx={{ 
                            p: "3px",
                            color: canMoveUp(index) ? "primary.main" : "text.disabled",
                            "&:hover": { backgroundColor: canMoveUp(index) ? "rgba(0,0,0,0.08)" : undefined }
                          }}
                          data-testid={`move-up-${content.id}`}
                        >
                          <ArrowUp size={16} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    
                    <Tooltip title={canMoveDown(index) ? "Move Down" : "Already at bottom"}>
                      <span> {/* Wrap in span so tooltip works even when button is disabled */}
                        <IconButton 
                          size="small" 
                          disabled={!canMoveDown(index)} 
                          onClick={() => handleReorderContent(content.id, 'down')}
                          sx={{ 
                            p: "3px",
                            color: canMoveDown(index) ? "primary.main" : "text.disabled",
                            "&:hover": { backgroundColor: canMoveDown(index) ? "rgba(0,0,0,0.08)" : undefined }
                          }}
                          data-testid={`move-down-${content.id}`}
                        >
                          <ArrowDown size={16} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    
                    {/* Remove button can be added here or in SingleChoiceQuestion */}
                    <Tooltip title="Remove Question">
                      <IconButton 
                        size="medium" 
                        onClick={() => handleRemoveContent(content.id)}
                        sx={{ 
                          p: "5px",
                          color: "error.main",
                          "&:hover": { backgroundColor: "rgba(211,47,47,0.08)" }
                        }}
                        data-testid={`remove-${content.id}`}
                      >
                        <Box sx={{ fontSize: '16px', fontWeight: 'bold' }}>×</Box>
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  {/* Render the component based on type */}
                  {content.type === "single-choice" ? (
                    <SingleChoiceQuestion
                      questionId={content.id}
                      defaultQuestion={content.question || "Enter your question here..."}
                      defaultOptions={content.options || ["Option 1", "Option 2"]}
                      onRemove={() => handleRemoveContent(content.id)}
                    />
                  ) : (
                    <Typography>Unknown content type: {content.type}</Typography>
                  )}
                </Box>
              );
            })
          ) : (
            <Typography variant="body2" sx={{ color: "#666", textAlign: "center", py: 2 }}>
              {type === "question" 
                ? "Drag question components here" 
                : "Drag material components here"}
            </Typography>
          )}
        </Box>
      </Box>
      
      <Button
        variant="outlined"
        color="error"
        onClick={onRemove}
        sx={{ mt: 1 }}
      >
        Remove {type === "question" ? "Question" : "Material"}
      </Button>
    </Box>
  );
};

export default QuestionMaterialCard;