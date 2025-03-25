// SortableContentItem.js
import React, { useState, useEffect, useCallback, memo } from "react";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import { useSortable } from "@dnd-kit/sortable";
import { ArrowUp, ArrowDown, GripVertical } from "lucide-react"; 
import AnswerIdManager from '../utils/answerIdManager';
import { QuestionComponentRenderer } from './QuestionTypeMap';
import { MaterialComponentRenderer } from './MaterialTypeMap';

// Memoize the SortableContentItem to prevent unnecessary re-renders
const SortableContentItem = memo(({ 
  content, 
  index,
  onMoveUp, 
  onMoveDown, 
  onRemove,
  canMoveUp,
  canMoveDown,
  onContentUpdate,
  cardType,
  questionTypeMap,
  materialTypeMap
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: content.id });

  // Update order_id if needed
  useEffect(() => {
    if (content.order_id !== index) {
      onContentUpdate({
        ...content,
        order_id: index
      });
    }
  }, [index, content.order_id, onContentUpdate, content.id]);

  // Handle content updates
  const handleContentUpdate = useCallback((updatedData) => {
    // Handle question-specific logic for question cards
    if (cardType === "question") {
      // Handle duplicate answer_ids in blanks
      if (updatedData.blanks) {
        const seenIds = new Set();
        
        updatedData.blanks = updatedData.blanks.map(blank => {
          if (blank.answer_id === undefined || seenIds.has(blank.answer_id)) {
            return {
              ...blank,
              answer_id: AnswerIdManager.getNextId()
            };
          }
          
          seenIds.add(blank.answer_id);
          return blank;
        });
      }
      
      // Convert matching pairs to blanks format
      if (updatedData.type === 'matching' && updatedData.pairs && !updatedData.blanks) {
        updatedData.blanks = updatedData.pairs.map((pair, idx) => ({
          id: idx,
          answer_id: pair.answer_id || AnswerIdManager.getNextId(),
          label: pair.leftItem || `Blank ${idx + 1}`,
          correctAnswers: [pair.rightItem || ""],
          placeholder: pair.placeholder || "Enter your answer"
        }));
        
        delete updatedData.pairs;
      }
    }
    
    onContentUpdate({
      ...updatedData,
      order_id: index // Always use the current index as order_id
    });
  }, [index, onContentUpdate, cardType]);

  // Helper to extract media from options
  const getOptionMediaFromOptions = useCallback((options) => {
    if (!options || !Array.isArray(options)) return {};
    
    const mediaMap = {};
    options.forEach((option, index) => {
      if (typeof option === 'object') {
        if (option.option_image) mediaMap[index] = option.option_image;
        else if (option.option_audio) mediaMap[index] = option.option_audio;
        else if (option.option_video) mediaMap[index] = option.option_video;
      }
    });
    
    return mediaMap;
  }, []);

  // Get debug info text
  const getDebugInfo = useCallback(() => {
    if (cardType === "material") {
      return `Material Type: ${content.type}`;
    }
    
    if (content.type === 'single-choice' || content.type === 'multiple-choice') {
      return `Answer ID: ${content.answer_id}`;
    } else if (content.type === 'matching' || content.type === 'fill-in-the-blank') {
      const blankCount = content.blanks?.length || content.pairs?.length || 0;
      return `Blanks: ${blankCount}`;
    } else if (content.type === 'long-text') {
      return `Rows: ${content.rows || 4}`;
    } else if (content.type === 'audio') {
      return `Max: ${content.maxSeconds || 60}s`;
    }
    return `Type: ${content.type}`;
  }, [content, cardType]);

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  // Determine which media to use (only for question types)
  const questionMedia = content.question_image || content.question_audio || content.question_video || null;
  const optionMedia = cardType === "question" ? getOptionMediaFromOptions(content.options) : {};
  
  // Create normalized content with proper structure
  const normalizedContent = {...content};
  
  // Convert legacy matching format (only for questions)
  if (cardType === "question" && normalizedContent.type === 'matching' && normalizedContent.pairs && !normalizedContent.blanks) {
    normalizedContent.blanks = normalizedContent.pairs.map((pair, idx) => ({
      id: idx,
      answer_id: pair.answer_id || AnswerIdManager.getNextId(),
      label: pair.leftItem || `Blank ${idx + 1}`,
      correctAnswers: [pair.rightItem || ""],
      placeholder: pair.placeholder || "Enter your answer"
    }));
    
    delete normalizedContent.pairs;
  }
  
  return (
    <Box 
      ref={setNodeRef}
      style={style}
      sx={{ 
        position: "relative", 
        mb: 3,
        border: "1px solid #eee",
        borderRadius: "8px",
        p: 1,
        pt: 3, // Extra padding top for controls
        backgroundColor: isDragging ? "#f0f8ff" : "#fff",
        cursor: isDragging ? "grabbing" : "default",
        "&:hover": {
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        },
      }}
    >
      {/* Debug info */}
      <Box sx={{ position: "absolute", top: "5px", left: "30px", fontSize: "10px", color: "#999" }}>
        {getDebugInfo()}
      </Box>
      
      {/* Drag handle */}
      <Box 
        {...attributes} 
        {...listeners}
        sx={{ 
          position: "absolute", 
          top: "8px", 
          left: "8px",
          display: "flex",
          padding: "2px 4px",
          borderRadius: "4px",
          cursor: "grab",
          color: "#666",
          "&:hover": {
            backgroundColor: "rgba(0,0,0,0.05)",
          }
        }}
      >
        <GripVertical size={16} />
      </Box>
      
      {/* Reorder Controls */}
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
        <Tooltip title={canMoveUp ? "Move Up" : "Already at top"}>
          <span>
            <IconButton 
              size="small" 
              disabled={!canMoveUp} 
              onClick={onMoveUp}
              sx={{ 
                p: "3px",
                color: canMoveUp ? "primary.main" : "text.disabled",
                "&:hover": { backgroundColor: canMoveUp ? "rgba(0,0,0,0.08)" : undefined }
              }}
              data-testid={`move-up-${content.id}`}
            >
              <ArrowUp size={16} />
            </IconButton>
          </span>
        </Tooltip>
        
        <Tooltip title={canMoveDown ? "Move Down" : "Already at bottom"}>
          <span>
            <IconButton 
              size="small" 
              disabled={!canMoveDown} 
              onClick={onMoveDown}
              sx={{ 
                p: "3px",
                color: canMoveDown ? "primary.main" : "text.disabled",
                "&:hover": { backgroundColor: canMoveDown ? "rgba(0,0,0,0.08)" : undefined }
              }}
              data-testid={`move-down-${content.id}`}
            >
              <ArrowDown size={16} />
            </IconButton>
          </span>
        </Tooltip>
        
        {/* Remove button */}
        <Tooltip title="Remove Item">
          <IconButton 
            size="small" 
            onClick={onRemove}
            sx={{ 
              p: "3px",
              color: "error.main",
              "&:hover": { backgroundColor: "rgba(211,47,47,0.08)" }
            }}
            data-testid={`remove-${content.id}`}
          >
            <Box sx={{ fontSize: '16px', fontWeight: 'bold' }}>×</Box>
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* Render the appropriate component based on card type */}
      {cardType === "question" ? (
        <QuestionComponentRenderer
          normalizedContent={normalizedContent}
          questionMedia={questionMedia}
          optionMedia={optionMedia}
          onRemove={onRemove}
          handleContentUpdate={handleContentUpdate}
          questionTypeMap={questionTypeMap}
        />
      ) : (
        <MaterialComponentRenderer
          normalizedContent={normalizedContent}
          onRemove={onRemove}
          handleContentUpdate={handleContentUpdate}
          materialTypeMap={materialTypeMap}
        />
      )}
    </Box>
  );
});

export default SortableContentItem;