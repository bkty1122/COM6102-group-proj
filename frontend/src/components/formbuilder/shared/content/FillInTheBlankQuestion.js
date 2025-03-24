// src/components/formbuilder/shared/FillInTheBlankQuestion.js
import React, { useState, useEffect, useRef } from "react";
import { 
  Box, Typography, TextField, IconButton,
  Divider, Button, Chip, Paper, List, 
  InputLabel, InputAdornment
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import GradeIcon from "@mui/icons-material/Grade";
import QuestionMedia from "./QuestionMedia";
import useQuestionMedia from "../../hooks/useQuestionMedia";
import DifficultySelector, { getDifficultyColor } from "./DifficultySelector";

const FillInTheBlankQuestion = ({ 
  questionId, 
  defaultQuestion = "Enter your question with [blank] placeholders...",
  defaultBlanks = [], 
  defaultDifficulty = 'medium',
  order_id,
  startingAnswerId = 0,
  onUpdate = () => {},
  defaultInstruction = "Fill in the blanks with the correct words." // Default instruction text
}) => {
  const [question, setQuestion] = useState(defaultQuestion);
  const [blanks, setBlanks] = useState([]);
  const [nextAnswerId, setNextAnswerId] = useState(startingAnswerId);
  const [instruction, setInstruction] = useState(defaultInstruction);
  const [difficulty, setDifficulty] = useState(defaultDifficulty);
  const questionRef = useRef(null);
  const [prevQuestion, setPrevQuestion] = useState(defaultQuestion);
  const blankRefs = useRef([]);
  
  // Use the media hook for question media
  const { 
    questionMedia, 
    handleMediaChange
  } = useQuestionMedia();

  // Initialize blanks with proper answer_ids
  useEffect(() => {
    // Initialize with provided blanks or extract from question
    if (defaultBlanks && defaultBlanks.length > 0) {
      // If blanks are provided, ensure each has a unique answer_id
      const processedBlanks = defaultBlanks.map((blank, index) => {
        // Determine the appropriate answer_id for this blank
        const answerId = blank.answer_id !== undefined ? blank.answer_id : startingAnswerId + index;
        
        return {
          ...blank,
          id: index,
          answer_id: answerId,
          placeholder: blank.placeholder || blank.option_value || `[blank_${index + 1}]`,
          correctAnswers: blank.correctAnswers || blank.correctAnswer || [""],
          marks: blank.marks !== undefined ? blank.marks : 1 // Default 1 mark per blank
        };
      });
      
      setBlanks(processedBlanks);
      blankRefs.current = processedBlanks.map(() => React.createRef());
      
      // Update nextAnswerId to be greater than any existing answer_id
      const maxAnswerId = Math.max(...processedBlanks.map(b => b.answer_id), startingAnswerId - 1);
      setNextAnswerId(maxAnswerId + 1);
    } else {
      // Extract blanks from question text
      const blankMatches = [...defaultQuestion.matchAll(/\[blank_\d+\]|\[[\w\s]+\]/g)];
      
      if (blankMatches.length > 0) {
        const extractedBlanks = blankMatches.map((match, index) => ({
          id: index,
          answer_id: startingAnswerId + index,  // Each blank gets incremented answer_id
          placeholder: match[0],
          correctAnswers: [""],
          marks: 1 // Default 1 mark per blank
        }));
        
        setBlanks(extractedBlanks);
        blankRefs.current = extractedBlanks.map(() => React.createRef());
        setNextAnswerId(startingAnswerId + extractedBlanks.length);
      }
    }
  }, []);

  // Monitor question text changes to detect placeholder edits
  useEffect(() => {
    if (prevQuestion === question) return;
    
    // Find all placeholder patterns in the updated question text
    const currentPlaceholders = [...question.matchAll(/\[blank_\d+\]|\[[\w\s]+\]/g)]
      .map(match => ({
        text: match[0],
        index: match.index
      }));
    
    // Compare with existing blanks to detect changes
    if (currentPlaceholders.length !== blanks.length) {
      // Number of placeholders has changed - this is handled by add/remove blank functions
      // We only need to handle text changes here
    } else {
      // Same number of placeholders - check for text changes
      const updatedBlanks = [...blanks];
      let hasChanges = false;
      
      // Sort placeholders by position in text for comparison
      currentPlaceholders.sort((a, b) => a.index - b.index);
      
      currentPlaceholders.forEach((placeholder, index) => {
        if (placeholder.text !== updatedBlanks[index].placeholder) {
          // Placeholder text has changed - update the corresponding blank
          updatedBlanks[index] = {
            ...updatedBlanks[index],
            placeholder: placeholder.text
          };
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        setBlanks(updatedBlanks);
      }
    }
    
    setPrevQuestion(question);
  }, [question, blanks]);

  // Update parent component when data changes
  useEffect(() => {
    onUpdate({
      id: questionId,
      type: 'fill-in-the-blank',
      order_id,
      question,
      blanks,
      instruction,
      difficulty,
      question_image: questionMedia?.type === 'image' ? questionMedia : null,
      question_audio: questionMedia?.type === 'audio' ? questionMedia : null,
      question_video: questionMedia?.type === 'video' ? questionMedia : null
    });
  }, [question, blanks, instruction, difficulty, questionMedia, questionId, order_id, onUpdate]);

  // Insert a new blank at cursor position
  const handleInsertBlank = () => {
    if (!questionRef.current) return;
    
    const cursorPosition = questionRef.current.selectionStart;
    const textBefore = question.substring(0, cursorPosition);
    const textAfter = question.substring(cursorPosition);
    
    // Create a new blank with next answer_id
    const newBlankId = blanks.length;
    const newAnswerId = nextAnswerId;
    
    const placeholder = `[blank_${newBlankId + 1}]`;
    const newBlank = {
      id: newBlankId,
      answer_id: newAnswerId,  // Use the next available answer_id
      placeholder,
      correctAnswers: [""],
      marks: 1 // Default 1 mark for new blank
    };
    
    // Increment nextAnswerId for next use
    setNextAnswerId(prev => prev + 1);
    
    // Add the new blank and ref
    const newBlanks = [...blanks, newBlank];
    setBlanks(newBlanks);
    blankRefs.current = newBlanks.map((_, index) => 
      blankRefs.current[index] || React.createRef()
    );
    
    // Update question text with the new blank placeholder
    const updatedQuestion = textBefore + placeholder + textAfter;
    setQuestion(updatedQuestion);
    setPrevQuestion(updatedQuestion); // Update prevQuestion to avoid triggering the comparison effect
  };

  // Handle adding a possible correct answer to a blank
  const handleAddAnswer = (blankIndex) => {
    const updatedBlanks = [...blanks];
    updatedBlanks[blankIndex].correctAnswers.push("");
    setBlanks(updatedBlanks);
  };

  // Handle removing a possible correct answer from a blank
  const handleRemoveAnswer = (blankIndex, answerIndex) => {
    const updatedBlanks = [...blanks];
    updatedBlanks[blankIndex].correctAnswers.splice(answerIndex, 1);
    if (updatedBlanks[blankIndex].correctAnswers.length === 0) {
      updatedBlanks[blankIndex].correctAnswers = [""];
    }
    setBlanks(updatedBlanks);
  };

  // Handle changing a possible correct answer for a blank
  const handleAnswerChange = (blankIndex, answerIndex, value) => {
    const updatedBlanks = [...blanks];
    updatedBlanks[blankIndex].correctAnswers[answerIndex] = value;
    setBlanks(updatedBlanks);
  };

  // Handle changing the placeholder text for a blank
  const handlePlaceholderChange = (blankIndex, newPlaceholder) => {
    // First find and replace the old placeholder in the question text
    const oldPlaceholder = blanks[blankIndex].placeholder;
    const updatedQuestion = question.replace(oldPlaceholder, newPlaceholder);
    
    // Then update the blank's placeholder
    const updatedBlanks = [...blanks];
    updatedBlanks[blankIndex].placeholder = newPlaceholder;
    
    // Update state
    setQuestion(updatedQuestion);
    setPrevQuestion(updatedQuestion); // Update prevQuestion to avoid triggering the comparison effect
    setBlanks(updatedBlanks);
  };

  // Handle changing the mark value for a blank
  const handleMarkChange = (blankIndex, value) => {
    const updatedBlanks = [...blanks];
    updatedBlanks[blankIndex].marks = value;
    setBlanks(updatedBlanks);
  };

  // Remove a blank
  const handleRemoveBlank = (blankIndex) => {
    // Get the blank to remove
    const blankToRemove = blanks[blankIndex];
    
    // Create updated blanks array - preserving the answer_ids of remaining blanks
    const updatedBlanks = blanks
      .filter((_, index) => index !== blankIndex)
      .map((blank, newIndex) => ({
        ...blank,
        id: newIndex
      }));
    
    setBlanks(updatedBlanks);
    blankRefs.current = updatedBlanks.map((_, index) => blankRefs.current[index] || React.createRef());
    
    // Update question text by removing the blank placeholder
    const updatedQuestion = question.replace(blankToRemove.placeholder, "");
    setQuestion(updatedQuestion);
    setPrevQuestion(updatedQuestion); // Update prevQuestion to avoid triggering the comparison effect
  };

  // Scroll to the blank when clicked in the question preview
  const scrollToBlank = (blankIndex) => {
    if (blankRefs.current[blankIndex] && blankRefs.current[blankIndex].current) {
      blankRefs.current[blankIndex].current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  };

  // Calculate total marks for the question
  const totalMarks = blanks.reduce((sum, blank) => sum + (blank.marks || 0), 0);

  // Create a formatted version of the question with highlighted blanks
  const renderFormattedQuestion = () => {
    if (!question || !blanks.length) return question;

    // Find all placeholders and their positions
    const placeholderMatches = [...question.matchAll(/\[blank_\d+\]|\[[\w\s]+\]/g)];
    if (!placeholderMatches.length) return question;

    // Map blanks by placeholder for easier lookup
    const blanksByPlaceholder = {};
    blanks.forEach(blank => {
      blanksByPlaceholder[blank.placeholder] = blank;
    });

    // Build the formatted question with highlighted blanks
    const parts = [];
    let lastIndex = 0;

    placeholderMatches.forEach(match => {
      const placeholder = match[0];
      const startIndex = match.index;
      const blank = blanksByPlaceholder[placeholder];
      
      // Add text before this placeholder
      if (startIndex > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {question.substring(lastIndex, startIndex)}
          </span>
        );
      }
      
      // Add the highlighted placeholder
      if (blank) {
        const blankIndex = blanks.findIndex(b => b.placeholder === placeholder);
        const color = getBlankColor(blankIndex);
        
        parts.push(
          <Box
            component="span"
            key={`blank-${blank.id}`}
            sx={{
              backgroundColor: color.bg,
              color: color.text,
              padding: '2px 4px',
              margin: '0 2px',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: 'medium',
              border: `1px solid ${color.border}`,
              position: 'relative',
              '&:hover': {
                opacity: 0.8,
                transform: 'scale(1.05)'
              }
            }}
            onClick={() => scrollToBlank(blankIndex)}
          >
            {placeholder}
            {blank.marks > 1 && (
              <Box
                component="span"
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  backgroundColor: 'white',
                  color: getDifficultyColor(difficulty),
                  borderRadius: '50%',
                  width: 16,
                  height: 16,
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${getDifficultyColor(difficulty)}`,
                  fontWeight: 'bold'
                }}
              >
                {blank.marks}
              </Box>
            )}
          </Box>
        );
      } else {
        // Fallback for placeholders without matching blanks
        parts.push(<span key={`unknown-${startIndex}`}>{placeholder}</span>);
      }
      
      lastIndex = startIndex + placeholder.length;
    });
    
    // Add any remaining text after the last placeholder
    if (lastIndex < question.length) {
      parts.push(
        <span key={`text-end`}>
          {question.substring(lastIndex)}
        </span>
      );
    }
    
    return parts;
  };

  // Generate a color for a blank based on its index
  const getBlankColor = (index) => {
    const colors = [
      { bg: '#e3f2fd', text: '#0d47a1', border: '#bbdefb' }, // blue
      { bg: '#f3e5f5', text: '#4a148c', border: '#e1bee7' }, // purple
      { bg: '#e8f5e9', text: '#1b5e20', border: '#c8e6c9' }, // green
      { bg: '#fff3e0', text: '#e65100', border: '#ffe0b2' }, // orange
      { bg: '#fce4ec', text: '#880e4f', border: '#f8bbd0' }, // pink
      { bg: '#e0f7fa', text: '#006064', border: '#b2ebf2' }, // cyan
    ];
    
    return colors[index % colors.length];
  };

  return (
    <Box>
      {/* Display IDs for debugging */}
      <Box sx={{ mb: 1, display: "flex", gap: 2, fontSize: "12px", color: "#666" }}>
        <Typography variant="caption">Order ID: {order_id}</Typography>
        <Typography variant="caption">Next Answer ID: {nextAnswerId}</Typography>
        <Typography variant="caption">Component ID: {questionId}</Typography>
        <Typography variant="caption">Total Marks: {totalMarks}</Typography>
      </Box>

      {/* Instructions for the component author */}
      <Paper 
        elevation={0} 
        sx={{ 
          mb: 2, 
          p: 1.5, 
          backgroundColor: "#f5f5f5", 
          borderLeft: "4px solid #2196f3"
        }}
      >
        <Typography variant="body2">
          Enter your question text and use the "Insert Blank" button to add blank spaces. 
          For each blank, you can define one or more correct answers and assign point values.
        </Typography>
      </Paper>
      
      {/* Difficulty Selector Component */}
      <Box sx={{ mb: 3 }}>
        <DifficultySelector 
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          totalMarks={totalMarks}
        />
      </Box>
      
      {/* Student Instructions Field */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Instructions for students"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          helperText="These instructions will be shown to students when completing the exercise"
          placeholder="Example: Fill in the blanks with the correct words."
          size="small"
          sx={{ 
            mb: 1,
            '& .MuiOutlinedInput-root': {
              borderColor: '#2196f3',
              '&.Mui-focused': {
                borderColor: '#2196f3',
              }
            }
          }}
        />
      </Box>
      
      {/* Question with blanks */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Question with blanks"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          multiline
          minRows={3}
          inputRef={questionRef}
          sx={{ mb: 1 }}
        />
        
        <Button 
          variant="outlined" 
          size="small" 
          startIcon={<AddCircleOutlineIcon />}
          onClick={handleInsertBlank}
          sx={{ mt: 1 }}
        >
          Insert Blank
        </Button>
      </Box>
      
      {/* Formatted question preview with highlighted blanks */}
      {blanks.length > 0 && (
        <Paper
          variant="outlined"
          sx={{ 
            p: 2, 
            mb: 3, 
            backgroundColor: '#fafafa',
            lineHeight: 1.8
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <InputLabel shrink sx={{ color: 'text.secondary', mb: 0 }}>
              Question Preview (click on blanks to navigate)
            </InputLabel>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                size="small"
                sx={{ 
                  bgcolor: getDifficultyColor(difficulty) + '20',
                  color: getDifficultyColor(difficulty),
                  borderColor: getDifficultyColor(difficulty),
                  fontWeight: 'medium'
                }}
                variant="outlined"
              />
              <Chip
                icon={<GradeIcon fontSize="small" />}
                label={`${totalMarks} ${totalMarks === 1 ? 'point' : 'points'}`}
                size="small"
                sx={{ fontWeight: 'medium' }}
              />
            </Box>
          </Box>
          
          {/* Show instruction in preview as well */}
          {instruction && (
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 2, 
                fontStyle: 'italic',
                color: 'text.secondary',
                borderLeft: '2px solid #2196f3',
                pl: 1
              }}
            >
              {instruction}
            </Typography>
          )}
          
          <Typography variant="body1">
            {renderFormattedQuestion()}
          </Typography>
        </Paper>
      )}
      
      {/* Question Media */}
      <QuestionMedia
        media={questionMedia}
        onMediaChange={handleMediaChange}
        label="Add Media to Question"
        type="question"
      />

      {/* Blank answers section */}
      <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
        Define correct answers for each blank
      </Typography>
      
      {blanks.length > 0 ? (
        <List>
          {blanks.map((blank, blankIndex) => {
            const color = getBlankColor(blankIndex);
            
            return (
              <Paper 
                key={blank.id} 
                variant="outlined" 
                sx={{ 
                  mb: 2, 
                  p: 2,
                  borderColor: color.border,
                  borderLeftWidth: '4px',
                }}
                ref={blankRefs.current[blankIndex]}
              >
                <Box sx={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  mb: 1 
                }}>
                  <Box>
                    <Typography variant="subtitle2" component="span">
                      Blank {blankIndex + 1}
                    </Typography>
                    <Chip 
                      label={`Answer ID: ${blank.answer_id}`} 
                      size="small" 
                      sx={{ ml: 1, backgroundColor: color.bg, color: color.text }} 
                    />
                    <Chip 
                      icon={<GradeIcon fontSize="small" />}
                      label={`${blank.marks} ${blank.marks === 1 ? 'point' : 'points'}`}
                      size="small" 
                      sx={{ ml: 1 }} 
                    />
                  </Box>
                  
                  <IconButton 
                    size="small" 
                    onClick={() => handleRemoveBlank(blankIndex)}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                
                {/* Add placeholder editor */}
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Placeholder Text"
                    value={blank.placeholder}
                    onChange={(e) => handlePlaceholderChange(blankIndex, e.target.value)}
                    sx={{ 
                      mb: 1,
                      '& .MuiOutlinedInput-root': {
                        borderColor: color.border,
                        '&.Mui-focused': {
                          borderColor: color.border,
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: color.text
                      }
                    }}
                    helperText="This is how the blank appears in the question text"
                  />
                </Box>
                
                {/* Points/Marks input */}
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Points"
                    type="number"
                    value={blank.marks}
                    onChange={(e) => handleMarkChange(blankIndex, Math.max(1, parseInt(e.target.value) || 1))}
                    inputProps={{ min: 1, max: 10 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <GradeIcon fontSize="small" sx={{ color: getDifficultyColor(difficulty) }} />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Points awarded for correct answer (1-10)"
                  />
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Correct answers (students must match one of these):
                  </Typography>
                  
                  {blank.correctAnswers.map((answer, answerIndex) => (
                    <Box 
                      key={answerIndex} 
                      sx={{ 
                        display: "flex", 
                        alignItems: "center", 
                        mb: 1 
                      }}
                    >
                      <TextField
                        size="small"
                        value={answer}
                        onChange={(e) => handleAnswerChange(blankIndex, answerIndex, e.target.value)}
                        placeholder="Enter correct answer"
                        sx={{ flexGrow: 1, mr: 1 }}
                      />
                      
                      {blank.correctAnswers.length > 1 && (
                        <IconButton 
                          size="small" 
                          onClick={() => handleRemoveAnswer(blankIndex, answerIndex)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                  
                  <Button 
                    size="small" 
                    onClick={() => handleAddAnswer(blankIndex)}
                    startIcon={<AddCircleOutlineIcon />}
                    sx={{ mt: 1 }}
                  >
                    Add alternative answer
                  </Button>
                </Box>
              </Paper>
            );
          })}
        </List>
      ) : (
        <Box sx={{ textAlign: "center", p: 3, backgroundColor: "#f5f5f5" }}>
          <Typography variant="body2" color="textSecondary">
            No blanks added yet. Use the "Insert Blank" button to create fill-in-the-blank questions.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default FillInTheBlankQuestion;