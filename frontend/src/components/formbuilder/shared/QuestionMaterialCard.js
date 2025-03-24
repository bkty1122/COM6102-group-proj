import React, { useState, useEffect, useCallback, memo } from "react";
import { Box, Button, Typography, IconButton, Tooltip } from "@mui/material";
import { useDroppable, DndContext, closestCenter, 
         DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import SingleChoiceQuestion from "./content/SingleChoiceQuestion";
import FillInTheBlankQuestion from "./content/FillInTheBlankQuestion";
import MultipleChoiceQuestion from "./content/MultipleChoiceQuestion";
import MatchingQuestion from "./content/MatchingQuestion";
import LongTextQuestion from "./content/LongTextQuestion";
import AudioQuestion from "./content/AudioQuestion";
import { ArrowUp, ArrowDown, GripVertical } from "lucide-react"; 
import AnswerIdManager from '../utils/answerIdManager';

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
    
    onContentUpdate({
      ...updatedData,
      order_id: index // Always use the current index as order_id
    });
  }, [index, onContentUpdate]);

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
  }, [content]);

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  // Determine which media to use
  const questionMedia = content.question_image || content.question_audio || content.question_video || null;
  const optionMedia = getOptionMediaFromOptions(content.options);
  
  // Create normalized content with proper structure
  const normalizedContent = {...content};
  
  // Convert legacy matching format
  if (normalizedContent.type === 'matching' && normalizedContent.pairs && !normalizedContent.blanks) {
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
      
      {/* Render the question component based on type */}
      {normalizedContent.type === "single-choice" ? (
        <SingleChoiceQuestion
          questionId={normalizedContent.id}
          defaultQuestion={normalizedContent.question || "Enter your question here..."}
          defaultOptions={normalizedContent.options || ["Option 1", "Option 2"]}
          defaultQuestionMedia={questionMedia}
          defaultOptionMedia={optionMedia}
          defaultCorrectAnswer={normalizedContent.correctAnswer}
          defaultInstruction={normalizedContent.instruction || "Select the correct answer from the options below."}
          defaultDifficulty={normalizedContent.difficulty || 'medium'}
          defaultMarks={normalizedContent.marks || 1}
          onRemove={onRemove}
          order_id={normalizedContent.order_id} 
          answer_id={normalizedContent.answer_id}
          onUpdate={handleContentUpdate}
          useAnswerIdManager={true}
        />
      ) : normalizedContent.type === "multiple-choice" ? (
        <MultipleChoiceQuestion
          questionId={normalizedContent.id}
          defaultQuestion={normalizedContent.question || "Enter your question here..."}
          defaultOptions={normalizedContent.options || ["Option 1", "Option 2"]}
          defaultQuestionMedia={questionMedia}
          defaultOptionMedia={optionMedia}
          defaultCorrectAnswers={normalizedContent.correctAnswers || []}
          defaultInstruction={normalizedContent.instruction || "Select all correct answers from the options below."}
          defaultDifficulty={normalizedContent.difficulty || 'medium'}
          defaultMarks={normalizedContent.marks || 1}
          onRemove={onRemove}
          order_id={normalizedContent.order_id} 
          answer_id={normalizedContent.answer_id}
          onUpdate={handleContentUpdate}
          useAnswerIdManager={true}
        />
      ) : normalizedContent.type === "fill-in-the-blank" ? (
        <FillInTheBlankQuestion
          questionId={normalizedContent.id}
          defaultQuestion={normalizedContent.question || "Enter your question here..."}
          defaultBlanks={normalizedContent.blanks || normalizedContent.options || []}
          defaultInstruction={normalizedContent.instruction || "Fill in the blanks with the correct words."}
          defaultDifficulty={normalizedContent.difficulty || 'medium'}
          onRemove={onRemove}
          order_id={normalizedContent.order_id} 
          startingAnswerId={normalizedContent.answer_id || AnswerIdManager.getCurrentNextId()}
          onUpdate={handleContentUpdate}
          useAnswerIdManager={true}
        />
      ) : normalizedContent.type === "matching" ? (
        <MatchingQuestion
          questionId={normalizedContent.id}
          defaultQuestion={normalizedContent.question || normalizedContent.questionText || "Enter your question here..."}
          defaultBlanks={normalizedContent.blanks || []}
          defaultInstruction={normalizedContent.instruction || "Fill in the blanks with the correct answers below."}
          defaultDifficulty={normalizedContent.difficulty || 'medium'}
          onRemove={onRemove}
          order_id={normalizedContent.order_id} 
          startingAnswerId={normalizedContent.answer_id || AnswerIdManager.getCurrentNextId()}
          onUpdate={handleContentUpdate}
          useAnswerIdManager={true}
        />
      ) : normalizedContent.type === "long-text" ? (
        <LongTextQuestion
          questionId={normalizedContent.id}
          defaultQuestion={normalizedContent.question || "Enter your question here..."}
          defaultPlaceholder={normalizedContent.placeholder || "Write your answer here..."}
          defaultRows={normalizedContent.rows || 4}
          defaultSuggestedAnswer={normalizedContent.suggestedAnswer || ""}
          defaultDifficulty={normalizedContent.difficulty || 'medium'}
          defaultMarks={normalizedContent.marks || 1}
          defaultInstruction={normalizedContent.instruction || "Provide a detailed response to the question below."}
          onRemove={onRemove}
          order_id={normalizedContent.order_id} 
          answer_id={normalizedContent.answer_id || AnswerIdManager.getCurrentNextId()}
          onUpdate={handleContentUpdate}
          useAnswerIdManager={true}
        />
      ) : normalizedContent.type === "audio" ? (
        <AudioQuestion
          questionId={normalizedContent.id}
          defaultQuestion={normalizedContent.question || "Record your answer to the question below."}
          defaultMaxSeconds={normalizedContent.maxSeconds || 60}
          defaultDifficulty={normalizedContent.difficulty || 'medium'}
          defaultMarks={normalizedContent.marks || 1}
          defaultInstruction={normalizedContent.instruction || "Click the record button and speak your answer clearly."}
          defaultAllowRerecording={normalizedContent.allowRerecording !== false}
          defaultAllowPause={normalizedContent.allowPause !== false}
          defaultShowTimer={normalizedContent.showTimer !== false}
          onRemove={onRemove}
          order_id={normalizedContent.order_id} 
          answer_id={normalizedContent.answer_id || AnswerIdManager.getCurrentNextId()}
          onUpdate={handleContentUpdate}
          useAnswerIdManager={true}
        />
      ) : (
        <Typography>Unknown content type: {normalizedContent.type}</Typography>
      )}
    </Box>
  );
});

export default QuestionMaterialCard;