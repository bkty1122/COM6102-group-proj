// QuestionMaterialCard.js
import React, { useState, useEffect, useCallback, memo } from "react";
import { Box, Button, Typography, IconButton, Tooltip } from "@mui/material";
import { useDroppable, DndContext, closestCenter, 
         DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import SingleChoiceQuestion from "./content/SingleChoiceQuestion";
import FillInTheBlankQuestion from "./content/FillInTheBlankQuestion";
import MultipleChoiceQuestion from "./content/MultipleChoiceQuestion";
import { ArrowUp, ArrowDown, GripVertical } from "lucide-react"; 
import AnswerIdManager from '../utils/answerIdManager';

const QuestionMaterialCard = ({ type, onRemove, contents = [], onRemoveContent, onReorderContent, onUpdateContent }) => {
  // Create a unique ID for this droppable area
  const droppableId = `droppable-${type}`;
  const [activeId, setActiveId] = useState(null);
  
  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Only start dragging after moving 5px
      },
    })
  );
  
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
  });

  // Initialize AnswerIdManager with current contents on mount and updates
  useEffect(() => {
    // Create a structure similar to what AnswerIdManager expects
    const pageData = {
      cardContents: {
        [type]: contents
      }
    };
    
    // Register all current answer_ids with the manager
    AnswerIdManager.trackPageContent(pageData);
  }, [contents, type]);

  // Ensure contents have correct order_id values - only run when contents change
  useEffect(() => {
    // Check if order_id values need to be updated
    const needsUpdate = contents.some((content, index) => content.order_id !== index);
    
    if (needsUpdate && onUpdateContent) {
      // Batch updates by creating an array of updated contents
      const updatedContents = contents.map((content, index) => ({
        ...content,
        order_id: index
      }));
      
      // Process updates in a single batch if possible
      updatedContents.forEach(content => {
        onUpdateContent(type, content);
      });
    }
  }, [contents, onUpdateContent, type]);

  // Memoize event handlers to prevent recreation on every render
  const handleRemoveContent = useCallback((contentId) => {
    if (onRemoveContent) {
      onRemoveContent(type, contentId);
    }
  }, [onRemoveContent, type]);

  const handleReorderContent = useCallback((contentId, direction) => {
    if (onReorderContent) {
      onReorderContent(type, contentId, direction);
    }
  }, [onReorderContent, type]);

  // Handle content updates from child components and pass to parent
  const handleContentUpdate = useCallback((updatedContent) => {
    // Before updating, check for answer_id conflicts and fix them
    if (updatedContent.type === 'fill-in-the-blank' && updatedContent.blanks) {
      // Check each blank to ensure it has a unique answer_id
      const existingAnswerIds = new Set();
      
      // First collect all answer_ids from other content items
      contents.forEach(content => {
        if (content.id !== updatedContent.id) {
          // For single-choice, register the answer_id
          if (content.type === 'single-choice' && content.answer_id !== undefined) {
            existingAnswerIds.add(content.answer_id);
          }

          // For multiple-choice, similar logic as single-choice
          if (content.type === 'multiple-choice' && content.answer_id !== undefined) {
            existingAnswerIds.add(content.answer_id);
          }

          // For fill-in-the-blank, register each blank's answer_id
          if (content.type === 'fill-in-the-blank' && content.blanks) {
            content.blanks.forEach(blank => {
              if (blank.answer_id !== undefined) {
                existingAnswerIds.add(blank.answer_id);
              }
            });
          }
        }
      });
      
      // Then fix any answer_id conflicts in the updated content
      const seenInThisContent = new Set();
      let modified = false;
      
      updatedContent.blanks = updatedContent.blanks.map(blank => {
        // If this blank has no answer_id or has a duplicate, assign a new one
        if (blank.answer_id === undefined || 
            existingAnswerIds.has(blank.answer_id) || 
            seenInThisContent.has(blank.answer_id)) {
            
          // Get a new unique ID
          const newAnswerId = AnswerIdManager.getNextId();
          modified = true;
          return {
            ...blank,
            answer_id: newAnswerId
          };
        }
        
        // Register this answer_id as seen
        seenInThisContent.add(blank.answer_id);
        return blank;
      });
    }
    
    // For single-choice and multiple-choice questions, check and fix answer_id conflicts
    if ((updatedContent.type === 'single-choice' || updatedContent.type === 'multiple-choice') && 
        updatedContent.answer_id !== undefined) {
      let hasConflict = false;
      
      // Check if this answer_id conflicts with any existing fill-in-the-blank blanks
      contents.forEach(content => {
        if (content.id !== updatedContent.id && content.type === 'fill-in-the-blank' && content.blanks) {
          content.blanks.forEach(blank => {
            if (blank.answer_id === updatedContent.answer_id) {
              hasConflict = true;
            }
          });
        }
      });
      
      // If there's a conflict, assign a new answer_id
      if (hasConflict) {
        const newAnswerId = AnswerIdManager.getNextId();
        updatedContent.answer_id = newAnswerId;
        
        // Update all options with the new answer_id
        if (updatedContent.options) {
          updatedContent.options = updatedContent.options.map(option => ({
            ...option,
            answer_id: newAnswerId
          }));
        }
      }
    }
    
    // Now we can safely update the content
    if (onUpdateContent) {
      onUpdateContent(type, updatedContent);
    }
  }, [contents, onUpdateContent, type]);

  // Handler for drag start
  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  // Handler for drag end - reorder content based on drag result
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (over && active.id !== over.id) {
      // Find the indices
      const activeIndex = contents.findIndex(item => item.id === active.id);
      const overIndex = contents.findIndex(item => item.id === over.id);
      
      // Call the reorderContent function with appropriate direction
      if (activeIndex !== -1 && overIndex !== -1) {
        onReorderContent(type, active.id, 'custom', overIndex);
      }
    }
  }, [contents, onReorderContent, type]);

  // Helper to check if this content can be moved up or down
  const canMoveUp = useCallback((index) => index > 0, []);
  const canMoveDown = useCallback((index) => index < contents.length - 1, [contents.length]);

  return (
    <Box
      sx={{
        p: 3,
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: type === "question" ? "#e3f2fd" : "#fce4ec", 
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
        
        {/* Simplified debug info */}
        <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#666' }}>
          Next answer ID: {AnswerIdManager.getCurrentNextId()}
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
            backgroundColor: isOver ? "#e8f4ff" : "#ffffff60",
            transition: "background-color 0.2s ease"
          }}
        >
          {Array.isArray(contents) && contents.length > 0 ? (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <SortableContext 
                items={contents.map(item => item.id)} 
                strategy={verticalListSortingStrategy}
              >
                {contents.map((content, index) => (
                  <SortableContentItem
                    key={content.id || `${type}-content-${index}`}
                    content={content}
                    index={index}
                    totalItems={contents.length}
                    onMoveUp={() => handleReorderContent(content.id, 'up')}
                    onMoveDown={() => handleReorderContent(content.id, 'down')}
                    onRemove={() => handleRemoveContent(content.id)}
                    canMoveUp={canMoveUp(index)}
                    canMoveDown={canMoveDown(index)}
                    onContentUpdate={handleContentUpdate}
                  />
                ))}
              </SortableContext>

              {/* Drag overlay for visual feedback during dragging */}
              <DragOverlay adjustScale={false}>
                {activeId ? (
                  <Box
                    sx={{
                      p: 2,
                      border: "1px solid #1976d2",
                      borderRadius: "8px",
                      backgroundColor: "#fff",
                      boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
                      width: "100%",
                      opacity: 0.8,
                    }}
                  >
                    <Typography>Moving item...</Typography>
                  </Box>
                ) : null}
              </DragOverlay>
            </DndContext>
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

// Memoize the SortableContentItem to prevent unnecessary re-renders
const SortableContentItem = memo(({ 
  content, 
  index,
  onMoveUp, 
  onMoveDown, 
  onRemove,
  canMoveUp,
  canMoveDown,
  onContentUpdate
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: content.id });

  // Check if order_id needs updating, but with a dependency array to reduce updates
  useEffect(() => {
    if (content.order_id !== index) {
      // Update the content with the correct order_id
      onContentUpdate({
        ...content,
        order_id: index
      });
    }
  }, [index, content.order_id, onContentUpdate, content.id]);

  // Define the handleContentUpdate function to pass updates to parent
  const handleContentUpdate = useCallback((updatedData) => {
    // Check for answer_id conflicts in the component itself
    if (updatedData.type === 'fill-in-the-blank' && updatedData.blanks) {
      const seenIds = new Set();
      let modified = false;
      
      // Fix any duplicate answer_ids within this component
      updatedData.blanks = updatedData.blanks.map(blank => {
        if (blank.answer_id === undefined || seenIds.has(blank.answer_id)) {
          // Assign a new answer_id
          const newAnswerId = AnswerIdManager.getNextId();
          modified = true;
          return {
            ...blank,
            answer_id: newAnswerId
          };
        }
        
        seenIds.add(blank.answer_id);
        return blank;
      });
    }
    
    // Ensure we preserve the order_id when updating content
    const updatedContent = {
      ...updatedData,
      order_id: index // Always use the current index as order_id
    };
    
    if (onContentUpdate) {
      onContentUpdate(updatedContent);
    }
  }, [index, onContentUpdate]);

  // Helper to extract media from options - memoized to prevent recalculation
  const getOptionMediaFromOptions = useCallback((options) => {
    if (!options || !Array.isArray(options)) return {};
    
    const mediaMap = {};
    options.forEach((option, index) => {
      if (typeof option === 'object') {
        if (option.option_image) {
          mediaMap[index] = option.option_image;
        } else if (option.option_audio) {
          mediaMap[index] = option.option_audio;
        } else if (option.option_video) {
          mediaMap[index] = option.option_video;
        }
      }
    });
    
    return mediaMap;
  }, []);

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  // Determine which media to use for the question
  const questionMedia = content.question_image || content.question_audio || content.question_video || null;
  const optionMedia = getOptionMediaFromOptions(content.options);
  
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
        pt: 3, // Extra padding top for the reorder buttons
        backgroundColor: isDragging ? "#f0f8ff" : "#fff",
        cursor: isDragging ? "grabbing" : "default",
        "&:hover": {
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        },
      }}
    >
      {/* Minimal debug info */}
      <Box sx={{ position: "absolute", top: "5px", left: "30px", fontSize: "10px", color: "#999" }}>
        {(content.type === 'single-choice' || content.type === 'multiple-choice') && 
          `Answer ID: ${content.answer_id}`}
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
        <Tooltip title="Remove Question">
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
      
      {/* Render the component based on type */}
      {content.type === "single-choice" ? (
        <SingleChoiceQuestion
          questionId={content.id}
          defaultQuestion={content.question || "Enter your question here..."}
          defaultOptions={content.options || ["Option 1", "Option 2"]}
          defaultQuestionMedia={questionMedia}
          defaultOptionMedia={optionMedia}
          defaultCorrectAnswer={content.correctAnswer}
          defaultInstruction={content.instruction || "Select the correct answer from the options below."}
          onRemove={onRemove}
          order_id={content.order_id} 
          answer_id={content.answer_id}
          onUpdate={handleContentUpdate}
          useAnswerIdManager={true}
        />
      ) : content.type === "multiple-choice" ? (
        <MultipleChoiceQuestion
          questionId={content.id}
          defaultQuestion={content.question || "Enter your question here..."}
          defaultOptions={content.options || ["Option 1", "Option 2"]}
          defaultQuestionMedia={questionMedia}
          defaultOptionMedia={optionMedia}
          defaultCorrectAnswers={content.correctAnswers || []}
          defaultInstruction={content.instruction || "Select all correct answers from the options below."}
          onRemove={onRemove}
          order_id={content.order_id} 
          answer_id={content.answer_id}
          onUpdate={handleContentUpdate}
          useAnswerIdManager={true}
        />
      ) : content.type === "fill-in-the-blank" ? (
        <FillInTheBlankQuestion
          questionId={content.id}
          defaultQuestion={content.question || "Enter your question here..."}
          defaultBlanks={content.blanks || content.options || []}
          defaultInstruction={content.instruction || "Fill in the blanks with the correct words."}
          onRemove={onRemove}
          order_id={content.order_id} 
          startingAnswerId={content.answer_id || AnswerIdManager.getCurrentNextId()}
          onUpdate={handleContentUpdate}
          useAnswerIdManager={true}
        />
      ) : (
        <Typography>Unknown content type: {content.type}</Typography>
      )}
    </Box>
  );
});

export default QuestionMaterialCard;