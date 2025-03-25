// AvailableMaterials.js - With backward compatibility fix
import React, { useState } from "react";
import { Box, Typography, Paper, Tooltip, Chip } from "@mui/material";
import { useDraggable } from "@dnd-kit/core";
import { 
  FileText, Image, Video, Headphones, MessageSquare, 
  GripHorizontal, Layers, Move
} from "lucide-react";

const AvailableMaterials = () => {
  const materialTypes = [
    { 
      id: "text-material", 
      label: "Text Material",
      description: "Add text passages, instructions, or explanatory content",
      icon: <FileText size={18} />,
      color: "#f06292"
    },
    { 
      id: "image-material", 
      label: "Image Material",
      description: "Add images, diagrams, or visual content",
      icon: <Image size={18} />,
      color: "#ec407a"
    },
    { 
      id: "video-material", 
      label: "Video Material",
      description: "Add videos or animated content",
      icon: <Video size={18} />,
      color: "#d81b60"
    },
    { 
      id: "audio-material", 
      label: "Audio Material",
      description: "Add audio clips, pronunciations, or sound examples",
      icon: <Headphones size={18} />,
      color: "#c2185b"
    },
    { 
      id: "llm-session-material", 
      label: "LLM Interactive Session",
      description: "Add AI-powered interactive discussion sessions",
      icon: <MessageSquare size={18} />,
      color: "#ad1457"
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ pl: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Layers size={20} />
          Materials
        </Typography>
        <Tooltip title="Drag materials to your form">
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
          backgroundColor: "#fff8f8",
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
        {materialTypes.map((material) => (
          <DraggableMaterialItem 
            key={material.id} 
            id={material.id} 
            label={material.label} 
            description={material.description}
            icon={material.icon}
            color={material.color}
          />
        ))}
        
      </Box>
    </Box>
  );
};

const DraggableMaterialItem = ({ id, label, description, icon, color }) => {
  const [isHovering, setIsHovering] = useState(false);
  
  // IMPORTANT: We keep the pure id as the draggable ID for backward compatibility
  // But add the category and type information in the data for newer code
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: {
      type: id, // This is both the id and the type for material items
      category: "material"
    }
  });

  return (
    <Tooltip title={description} placement="right" arrow>
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
        
        {/* Label */}
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
      </Paper>
    </Tooltip>
  );
};

export default AvailableMaterials;