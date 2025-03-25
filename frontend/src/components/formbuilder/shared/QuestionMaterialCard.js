import React, { useState, useEffect, useCallback } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useDroppable, DndContext, closestCenter, 
         DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import AnswerIdManager from '../utils/answerIdManager';
import SortableContentItem from './SortableContentItem';
import { QUESTION_TYPE_MAP } from './QuestionTypeMap';

const QuestionMaterialCard = ({ type, onRemove, contents = [], onRemoveContent, onReorderContent, onUpdateContent }) => {
  const droppableId = `droppable-${type}`;
  const [activeId, setActiveId] = useState(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );
  
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  // Initialize AnswerIdManager with current contents
  useEffect(() => {
    AnswerIdManager.trackPageContent({
      cardContents: { [type]: contents }
    });
  }, [contents, type]);

  // Ensure contents have correct order_id values
  useEffect(() => {
    const needsUpdate = contents.some((content, index) => content.order_id !== index);
    
    if (needsUpdate && onUpdateContent) {
      const updatedContents = contents.map((content, index) => ({
        ...content,
        order_id: index
      }));
      
      updatedContents.forEach(content => {
        onUpdateContent(type, content);
      });
    }
  }, [contents, onUpdateContent, type]);

  const handleRemoveContent = useCallback((contentId) => {
    if (onRemoveContent) onRemoveContent(type, contentId);
  }, [onRemoveContent, type]);

  const handleReorderContent = useCallback((contentId, direction) => {
    if (onReorderContent) onReorderContent(type, contentId, direction);
  }, [onReorderContent, type]);

  // Handle content updates from child components
  const handleContentUpdate = useCallback((updatedContent) => {
    const existingAnswerIds = new Set();
    
    // Collect all answer_ids from other content items
    contents.forEach(content => {
      if (content.id !== updatedContent.id) {
        // For single/multiple choice questions
        if ((content.type === 'single-choice' || content.type === 'multiple-choice') && 
            content.answer_id !== undefined) {
          existingAnswerIds.add(content.answer_id);
        }

        // For any question type with blanks
        if (content.blanks) {
          content.blanks.forEach(blank => {
            if (blank.answer_id !== undefined) {
              existingAnswerIds.add(blank.answer_id);
            }
          });
        }
      }
    });
    
    // Handle questions with blanks
    if (updatedContent.blanks) {
      const seenInThisContent = new Set();
      
      updatedContent.blanks = updatedContent.blanks.map(blank => {
        if (blank.answer_id === undefined || 
            existingAnswerIds.has(blank.answer_id) || 
            seenInThisContent.has(blank.answer_id)) {
          return {
            ...blank,
            answer_id: AnswerIdManager.getNextId()
          };
        }
        
        seenInThisContent.add(blank.answer_id);
        return blank;
      });
    }
    
    // Convert legacy matching with pairs format to blanks format
    if (updatedContent.type === 'matching' && updatedContent.pairs) {
      const blanks = updatedContent.pairs.map((pair, index) => ({
        id: index,
        answer_id: pair.answer_id || AnswerIdManager.getNextId(),
        label: pair.leftItem || `Blank ${index + 1}`,
        correctAnswers: [pair.rightItem || ""],
        placeholder: pair.placeholder || "Enter your answer"
      }));
      
      updatedContent.blanks = blanks;
      delete updatedContent.pairs;
    }
    
    // Handle single/multiple choice conflicts
    if ((updatedContent.type === 'single-choice' || updatedContent.type === 'multiple-choice') && 
        updatedContent.answer_id !== undefined && existingAnswerIds.has(updatedContent.answer_id)) {
      
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
    
    if (onUpdateContent) {
      onUpdateContent(type, updatedContent);
    }
  }, [contents, onUpdateContent, type]);

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (over && active.id !== over.id) {
      const activeIndex = contents.findIndex(item => item.id === active.id);
      const overIndex = contents.findIndex(item => item.id === over.id);
      
      if (activeIndex !== -1 && overIndex !== -1) {
        onReorderContent(type, active.id, 'custom', overIndex);
      }
    }
  }, [contents, onReorderContent, type]);

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
        
        <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#666' }}>
          Next answer ID: {AnswerIdManager.getCurrentNextId()}
        </Typography>
        
        <Box 
          ref={setNodeRef}
          sx={{ 
            p: 2, 
            border: "2px dashed #ccc", 
            borderRadius: "8px",
            minHeight: "100px",
            mb: 2,
            backgroundColor: isOver ? "#97dba6" : "#ffffff60",
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
                    onMoveUp={() => handleReorderContent(content.id, 'up')}
                    onMoveDown={() => handleReorderContent(content.id, 'down')}
                    onRemove={() => handleRemoveContent(content.id)}
                    canMoveUp={canMoveUp(index)}
                    canMoveDown={canMoveDown(index)}
                    onContentUpdate={handleContentUpdate}
                    questionTypeMap={QUESTION_TYPE_MAP}
                  />
                ))}
              </SortableContext>

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
              {type === "question" ? "Drag question components here" : "Drag material components here"}
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