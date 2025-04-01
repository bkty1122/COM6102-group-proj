// src/components/formbuilder/shared/SingleChoiceQuestion.js
import React, { useState, useEffect } from "react";
import { 
  Box, Typography, TextField, RadioGroup, FormControl, IconButton,
  Divider, Tooltip, Paper, Chip, InputAdornment
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import GradeIcon from "@mui/icons-material/Grade";
import QuestionMedia from "./QuestionMedia";
import useQuestionMedia from "../../../hooks/useQuestionMedia";
import DifficultySelector, { getDifficultyColor } from "./DifficultySelector";

const SingleChoiceQuestion = ({ 
  questionId, 
  defaultQuestion = "Enter your question here...", 
  defaultOptions = ["Option 1", "Option 2"],
  defaultCorrectAnswer = null,
  defaultQuestionMedia = null,
  defaultOptionMedia = {},
  defaultDifficulty = 'medium',
  defaultMarks = 1,
  order_id,
  answer_id,
  onUpdate = () => {},
  defaultInstruction = "Select the correct answer from the options below."
}) => {
  const [question, setQuestion] = useState(defaultQuestion);
  const [options, setOptions] = useState(
    Array.isArray(defaultOptions) 
      ? defaultOptions.map(opt => typeof opt === 'string' ? opt : opt.option_value || '') 
      : ["Option 1", "Option 2"]
  );
  const [correctAnswer, setCorrectAnswer] = useState(defaultCorrectAnswer);
  const [currentAnswerId] = useState(answer_id || 0);
  const [instruction, setInstruction] = useState(defaultInstruction);
  const [difficulty, setDifficulty] = useState(defaultDifficulty);
  const [marks, setMarks] = useState(defaultMarks);
  
  // Use the media hook
  const { 
    questionMedia, 
    optionMedia, 
    handleMediaChange,
    reindexOptionMedia
  } = useQuestionMedia(defaultQuestionMedia, defaultOptionMedia);

  // Update parent component when data changes
  useEffect(() => {
    // Convert options to the complex format with answer_id
    const formattedOptions = options.map((option, idx) => ({
      id: idx,
      answer_id: currentAnswerId,
      option_value: option,
      option_image: optionMedia[idx]?.type === 'image' ? optionMedia[idx] : null,
      option_audio: optionMedia[idx]?.type === 'audio' ? optionMedia[idx] : null,
      option_video: optionMedia[idx]?.type === 'video' ? optionMedia[idx] : null,
    }));

    onUpdate({
      id: questionId,
      type: 'single-choice',
      order_id,
      answer_id: currentAnswerId,
      question,
      options: formattedOptions,
      instruction,
      difficulty,
      marks,
      question_image: questionMedia?.type === 'image' ? questionMedia : null,
      question_audio: questionMedia?.type === 'audio' ? questionMedia : null,
      question_video: questionMedia?.type === 'video' ? questionMedia : null,
      correctAnswer
    });
  }, [question, options, optionMedia, questionMedia, correctAnswer, instruction, difficulty, marks, questionId, order_id, currentAnswerId, onUpdate]);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    const oldValue = newOptions[index];
    newOptions[index] = value;
    setOptions(newOptions);
    
    // If this option was the correct answer, update correctAnswer with the new value
    if (correctAnswer === oldValue) {
      setCorrectAnswer(value);
    }
  };

  const handleAddOption = () => {
    setOptions([...options, `Option ${options.length + 1}`]);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) return; // Maintain at least 2 options
    
    const optionToRemove = options[index];
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    
    // If the removed option was the correct answer, clear the correct answer
    if (correctAnswer === optionToRemove) {
      setCorrectAnswer(null);
    }
    
    // Reindex the media objects for options after the deleted one
    reindexOptionMedia(index);
  };

  const handleCorrectAnswerChange = (optionValue) => {
    setCorrectAnswer(optionValue);
  };

  // Handle changing the mark value
  const handleMarksChange = (value) => {
    const newValue = Math.max(1, parseInt(value) || 1);
    setMarks(Math.min(10, newValue)); // Cap at a maximum of 10 points
  };

  // Helper to find index of correct answer for display purposes
  const correctAnswerIndex = options.findIndex(option => option === correctAnswer);

  return (
    <Box>
      {/* Display IDs for debugging */}
      <Box sx={{ mb: 1, display: "flex", gap: 2, fontSize: "12px", color: "#666" }}>
        <Typography variant="caption">Order ID: {order_id}</Typography>
        <Typography variant="caption">Answer ID: {currentAnswerId}</Typography>
        <Typography variant="caption">Component ID: {questionId}</Typography>
        <Typography variant="caption">Points: {marks}</Typography>
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
          Create a single-choice question by entering your question text, adding options, and
          selecting the correct answer using the checkmark. Set the difficulty and point value.
        </Typography>
      </Paper>
      
      {/* Difficulty Selector Component */}
      <Box sx={{ mb: 3 }}>
        <DifficultySelector 
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          totalMarks={marks}
        />
      </Box>
      
      {/* Points/Marks input */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          label="Points for this question"
          type="number"
          value={marks}
          onChange={(e) => handleMarksChange(e.target.value)}
          inputProps={{ min: 1, max: 10 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <GradeIcon fontSize="small" sx={{ color: getDifficultyColor(difficulty) }} />
              </InputAdornment>
            ),
          }}
          helperText="Points awarded for selecting the correct answer (1-10)"
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
          helperText="These instructions will be shown to students when completing the question"
          placeholder="Example: Select the correct answer from the options below."
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
    
      <TextField
        fullWidth
        variant="outlined"
        label="Question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        sx={{ mb: 1 }}
      />
      
      {/* Question Media - using the reusable component */}
      <QuestionMedia
        media={questionMedia}
        onMediaChange={handleMediaChange}
        label="Add Media to Question"
        type="question"
      />
      
      {/* Question preview with instruction */}
      <Paper
        variant="outlined"
        sx={{ 
          p: 2, 
          my: 3, 
          backgroundColor: '#fafafa',
          lineHeight: 1.6
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Question Preview
          </Typography>
          
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
              label={`${marks} ${marks === 1 ? 'point' : 'points'}`}
              size="small"
              sx={{ fontWeight: 'medium' }}
            />
          </Box>
        </Box>
        
        {/* Show instruction in preview */}
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
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          {question}
        </Typography>
        
        {/* Show options in preview */}
        {options.map((option, index) => (
          <Box 
            key={index}
            sx={{ 
              mb: 1,
              pl: 2,
              display: 'flex',
              alignItems: 'center',
              ...(correctAnswer === option ? {
                color: 'success.main',
                fontWeight: 500
              } : {})
            }}
          >
            <Box 
              sx={{ 
                width: 16, 
                height: 16, 
                borderRadius: '50%', 
                border: '1px solid', 
                borderColor: correctAnswer === option ? 'success.main' : 'text.secondary', 
                mr: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {correctAnswer === option && (
                <Box 
                  sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: 'success.main' 
                  }} 
                />
              )}
            </Box>
            <Typography variant="body2">
              {option}
            </Typography>
          </Box>
        ))}
      </Paper>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Options (select the correct answer with the checkmark)
      </Typography>

      <FormControl component="fieldset" sx={{ width: "100%" }}>
        <RadioGroup>
          {options.map((option, index) => (
            <Box key={index} sx={{ mb: 3, border: '1px solid #eee', borderRadius: 1, p: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                {/* Correct answer selector */}
                <Tooltip title="Set as correct answer">
                  <IconButton
                    size="small"
                    onClick={() => handleCorrectAnswerChange(option)}
                    sx={{ 
                      color: correctAnswer === option ? "success.main" : "action.disabled",
                      mr: 1
                    }}
                  >
                    <CheckCircleOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                {/* Option text field */}
                <TextField
                  variant="outlined"
                  size="small"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  sx={{ 
                    flexGrow: 1, 
                    mr: 1,
                    // Highlight the correct answer with a subtle border
                    ...(correctAnswer === option ? {
                      "& .MuiOutlinedInput-root": {
                        border: "1px solid",
                        borderColor: "success.light",
                        backgroundColor: "rgba(76, 175, 80, 0.04)"
                      }
                    } : {})
                  }}
                  name={`question-${questionId}-option-${index}`}
                  // Add a small indicator in the label for the correct answer
                  label={correctAnswer === option ? "Correct Answer" : ""}
                />
                
                {/* Remove option button */}
                {options.length > 2 && (
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveOption(index)}
                    sx={{ color: "error.main" }}
                  >
                    <Box sx={{ fontSize: '16px', fontWeight: 'bold' }}>×</Box>
                  </IconButton>
                )}
              </Box>
              
              {/* Option media controls - using the reusable component */}
              <Box sx={{ ml: 4 }}>
                <QuestionMedia
                  media={optionMedia[index]}
                  onMediaChange={handleMediaChange}
                  label="Add Media to Option"
                  type="option"
                  index={index}
                />
              </Box>
            </Box>
          ))}
        </RadioGroup>
      </FormControl>

      {/* Show correct answer summary */}
      <Box sx={{ mt: 2, mb: 2, p: 1, backgroundColor: "rgba(76, 175, 80, 0.08)", borderRadius: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ display: "block", fontWeight: "medium" }}>
            Correct Answer: {correctAnswer !== null 
              ? (correctAnswerIndex !== -1 ? `Option ${correctAnswerIndex + 1}` : "Value no longer in options") 
              : "Not set"}
          </Typography>
          
          <Chip
            icon={<GradeIcon fontSize="small" />}
            label={`${marks} ${marks === 1 ? 'point' : 'points'}`}
            size="small"
            sx={{ 
              backgroundColor: getDifficultyColor(difficulty) + '20',
              color: getDifficultyColor(difficulty),
              fontWeight: 'medium'
            }}
          />
        </Box>
        
        {correctAnswer !== null && (
          <Typography variant="caption">
            "{correctAnswer}"
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mt: 2 }}>
        <Typography
          variant="button"
          sx={{
            color: "primary.main",
            cursor: "pointer",
            "&:hover": { textDecoration: "underline" },
          }}
          onClick={handleAddOption}
        >
          + Add Option
        </Typography>
      </Box>
      
      <Box sx={{ mt: 2, bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          About This Question Type:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Students select one answer from the available options
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • You can set a difficulty level and assign point value to the question
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Each option can include text, images, audio, or video
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Only one answer can be marked as correct
        </Typography>
      </Box>
    </Box>
  );
};

export default SingleChoiceQuestion;