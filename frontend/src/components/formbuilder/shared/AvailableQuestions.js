// AvailableQuestions.js - With backward compatibility fix
import React, { useState } from "react";
import { Box, Typography, Paper, Tooltip, Chip } from "@mui/material";
import { useDraggable } from "@dnd-kit/core";
import { 
  CircleDot, ListChecks, ArrowRightLeft, TextCursorInput, 
  FileText, Mic, GripHorizontal, HelpCircle, Move
} from "lucide-react";

const AvailableQuestions = () => {
  const questionTypes = [
    { 
      id: "single-choice", 
      label: "Single Choice",
      description: "Question with one correct answer from multiple options",
      icon: <CircleDot size={18} />,
      color: "#2196f3",
    },
    { 
      id: "fill-in-the-blank", 
      label: "Fill in the Blank",
      description: "Questions where students enter specific words or phrases",
      icon: <TextCursorInput size={18} />,
      color: "#1e88e5"
    },
    { 
      id: "multiple-choice", 
      label: "Multiple Choice",
      description: "Question with multiple correct answers to select",
      icon: <ListChecks size={18} />,
      color: "#1976d2"
    },
    { 
      id: "matching", 
      label: "Matching Question",
      description: "Match items in one column with corresponding items in another",
      icon: <ArrowRightLeft size={18} />,
      color: "#1565c0"
    },
    { 
      id: "long-text", 
      label: "Long Text Question",
      description: "Extended written response question for detailed answers",
      icon: <FileText size={18} />,
      color: "#0d47a1"
    },
    { 
      id: "audio", 
      label: "Audio Question",
      description: "Students record audio responses to questions",
      icon: <Mic size={18} />,
      color: "#0a2351"
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ pl: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <HelpCircle size={20} />
          Questions
        </Typography>
        <Tooltip title="Drag questions to your form">
          <Chip 
            size="small" 
            icon={<Move size={14} />} 
            label="Drag to use" 
            variant="outlined" 
            sx={{ height: '24px' }} 
          />
        </Tooltip>
      </Box>
      
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          padding: 2,
          borderRadius: "12px",
          backgroundColor: "#f8f9ff",
          boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.05)",
          overflowY: "auto",
          flexGrow: 1,
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#f7f7f7",
            borderRadius: "8px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#e0e0e0",
            borderRadius: "8px",
            "&:hover": {
              backgroundColor: "#d0d0d0",
            },
          },
        }}
      >
        {questionTypes.map((question) => (
          <DraggableQuestionItem 
            key={question.id} 
            id={question.id} 
            label={question.label} 
            description={question.description}
            icon={question.icon}
            color={question.color}
          />
        ))}
      </Box>
    </Box>
  );
};

const DraggableQuestionItem = ({ id, label, description, icon, color }) => {
  const [isHovering, setIsHovering] = useState(false);
  
  // IMPORTANT: We keep the pure id as the draggable ID for backward compatibility
  // But add the category and type information in the data for newer code
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: {
      type: id, // This is both the id and the type for question items
      category: "question"
    }
  });

  const renderLabel = () => {

    // No badge
    return (
      <Typography 
        variant="body2" 
        fontWeight={500} 
        sx={{ 
          flex: 1, 
          opacity: isDragging ? 0.9 : 1,
          transition: 'opacity 0.2s ease'
        }}
      >
        {isDragging ? `Adding: ${label}` : label}
      </Typography>
    );
  };

  return (
    <Tooltip title={description} placement="left" arrow>
      <Paper
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        elevation={isDragging ? 6 : isHovering ? 2 : 0}
        sx={{
          display: "flex",
          alignItems: "center",
          p: "12px 16px",
          backgroundColor: isDragging ? color : isHovering ? `${color}15` : "#fff",
          color: isDragging ? "#fff" : isHovering ? color : "text.primary",
          borderRadius: "8px",
          border: `1px solid ${isDragging ? 'transparent' : isHovering ? color : '#e0e0e0'}`,
          position: isDragging ? "fixed" : "relative",
          zIndex: isDragging ? 9999 : 1,
          cursor: isDragging ? "grabbing" : "grab",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          gap: 1.5,
          maxWidth: "100%",
          userSelect: "none",
          boxShadow: isDragging 
            ? "0 12px 24px rgba(0,0,0,0.15), 0 6px 12px rgba(0,0,0,0.1)" 
            : isHovering 
              ? "0 3px 6px rgba(0,0,0,0.1)" 
              : "none",
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{
          transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
          pointerEvents: isDragging ? "none" : "auto",
        }}
      >
        {/* Drag indicator */}
        <Box 
          sx={{ 
            display: 'flex', 
            color: isDragging ? 'rgba(255,255,255,0.8)' : isHovering ? color : '#bdbdbd',
            transition: 'color 0.2s ease'
          }}
        >
          <GripHorizontal size={16} />
        </Box>
        
        {/* Icon */}
        <Box 
          sx={{ 
            backgroundColor: isDragging ? 'rgba(255,255,255,0.2)' : isHovering ? `${color}25` : `${color}10`,
            p: 0.75,
            borderRadius: '6px',
            display: 'flex',
            transition: 'all 0.2s ease'
          }}
        >
          {icon}
        </Box>
        
        {/* Label with optional badge */}
        {renderLabel()}
      </Paper>
    </Tooltip>
  );
};

export default AvailableQuestions;