// BlankPage.js
import React from "react";
import { Box, Grid } from "@mui/material";
import { useDroppable, useDraggable} from "@dnd-kit/core";
import QuestionMaterialCard from "./QuestionMaterialCard";

const BlankPage = ({ 
  cards = [], 
  removeCard, 
  cardContents = {}, 
  onRemoveContent,
  onReorderContent,
  onUpdateContent
}) => {
  // This component should only use the useDroppable hook to make the area droppable
  // The actual drop logic will be handled in the parent's onDragEnd via the DndContext
  
  return (
    <Box
      sx={{
        p: 4,
        border: "1px solid #ccc",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
        mt: 2,
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* Drag Sources */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 4,
        }}
      >
        <DraggableItem id="question" label="Drag Question" />
        <DraggableItem id="material" label="Drag Material" />
      </Box>

      {/* Dropzone */}
      <DroppableArea>
        <Grid container spacing={2}>
          {cards.map((card, index) => (
            <Grid
              item
              key={`${card}-${index}`}
              xs={cards.length === 1 ? 12 : 6} // Full width if 1 card, half width if 2 cards
            >
              {/* Add CardDroppableArea to make each grid cell a drop target */}
              <CardDroppableArea index={index}>
                <DraggableCard 
                  card={card} 
                  index={index}
                  onRemove={() => removeCard(card)}
                  contents={cardContents[card] || []}
                  onRemoveContent={onRemoveContent}
                  onReorderContent={onReorderContent}
                  onUpdateContent={onUpdateContent}
                />
              </CardDroppableArea>
            </Grid>
          ))}
        </Grid>
      </DroppableArea>
    </Box>
  );
};

// Draggable Item Component
const DraggableItem = ({ id, label }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
  });

  return (
    <Box
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        p: 2,
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "#e3f2fd",
        width: "120px",
        textAlign: "center",
        position: "relative", // Important for proper dragging
        zIndex: isDragging ? 1000 : 1, // Higher z-index when dragging
        cursor: isDragging ? "grabbing" : "grab",
        boxShadow: isDragging ? "0 5px 10px rgba(0,0,0,0.2)" : "none",
      }}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }}
    >
      {label}
    </Box>
  );
};

// Draggable Card Component
const DraggableCard = ({ card, index, onRemove, contents, onRemoveContent, onReorderContent, onUpdateContent }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `card-${card}-${index}`,
    data: {
      type: 'card',
      cardType: card,
      index
    }
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        position: "relative",
        zIndex: isDragging ? 999 : 1,
        opacity: isDragging ? 0.8 : 1,
        cursor: isDragging ? "grabbing" : "grab",
        height: "100%", // Make sure the card fills the container height
      }}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }}
    >
      <Box {...attributes} {...listeners} sx={{ 
        position: "absolute", 
        top: "10px", 
        left: "10px",
        backgroundColor: "rgba(255,255,255,0.8)",
        borderRadius: "4px",
        padding: "4px 8px",
        fontSize: "12px",
        color: "#666",
        cursor: "grab",
        zIndex: 2,
        "&:hover": {
          backgroundColor: "rgba(200,200,200,0.9)",
        }
      }}>
        ⇄ Drag to reorder
      </Box>
      
      <QuestionMaterialCard
        type={card}
        onRemove={onRemove}
        contents={contents}
        onRemoveContent={onRemoveContent}
        onReorderContent={onReorderContent}
        onUpdateContent={onUpdateContent}
      />
    </Box>
  );
};

// Droppable Area Component
const DroppableArea = ({ children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: "dropzone",
  });
  
  return (
    <Box
      ref={setNodeRef}
      sx={{
        p: 4,
        border: "2px dashed #ccc",
        borderRadius: "8px",
        minHeight: "200px",
        backgroundColor: isOver ? "rgba(30, 60, 90, 0.08)" : "transparent", // Light highlight when hovering
        transition: "background-color 0.2s ease",
      }}
    >
      {children}
    </Box>
  );
};

// Droppable Areas for card reordering
const CardDroppableArea = ({ index, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `card-drop-${index}`,
    data: {
      index
    }
  });
  
  return (
    <Box
      ref={setNodeRef}
      sx={{
        height: "100%",
        position: "relative",
        backgroundColor: isOver ? "rgba(25, 118, 210, 0.1)" : "transparent",
        transition: "background-color 0.2s ease",
        border: isOver ? "2px dashedrgb(35, 91, 148)" : "2px dashed transparent",
        borderRadius: "8px",
      }}
    >
      {children}
    </Box>
  );
};

export default BlankPage;