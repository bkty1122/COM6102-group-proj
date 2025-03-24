// src/components/formbuilder/shared/MultipleChoiceQuestion.js
import React, { useState, useEffect } from "react";
import { 
  Box, Typography, TextField, FormControl, IconButton,
  Divider, Tooltip, Paper, Checkbox
} from "@mui/material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import QuestionMedia from "./QuestionMedia";
import useQuestionMedia from "../../hooks/useQuestionMedia";

const MultipleChoiceQuestion = ({ 
  questionId, 
  defaultQuestion = "Enter your question here...", 
  defaultOptions = ["Option 1", "Option 2"],
  defaultCorrectAnswers = [],
  defaultQuestionMedia = null,
  defaultOptionMedia = {},
  order_id,
  answer_id,
  onUpdate = () => {},
  defaultInstruction = "Select all correct answers from the options below." // Default instruction text
}) => {
  const [question, setQuestion] = useState(defaultQuestion);
  const [options, setOptions] = useState(
    Array.isArray(defaultOptions) 
      ? defaultOptions.map(opt => typeof opt === 'string' ? opt : opt.option_value || '') 
      : ["Option 1", "Option 2"]
  );
  const [correctAnswers, setCorrectAnswers] = useState(
    Array.isArray(defaultCorrectAnswers) ? defaultCorrectAnswers : []
  );
  const [currentAnswerId] = useState(answer_id || 0);
  const [instruction, setInstruction] = useState(defaultInstruction); // State for instruction
  
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
      type: 'multiple-choice',
      order_id,
      answer_id: currentAnswerId,
      question,
      options: formattedOptions,
      instruction,
      question_image: questionMedia?.type === 'image' ? questionMedia : null,
      question_audio: questionMedia?.type === 'audio' ? questionMedia : null,
      question_video: questionMedia?.type === 'video' ? questionMedia : null,
      correctAnswers
    });
  }, [question, options, optionMedia, questionMedia, correctAnswers, instruction, questionId, order_id, currentAnswerId, onUpdate]);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    const oldValue = newOptions[index];
    newOptions[index] = value;
    setOptions(newOptions);
    
    // If this option was in the correct answers, update it there too
    if (correctAnswers.includes(oldValue)) {
      const newCorrectAnswers = correctAnswers.map(answer => 
        answer === oldValue ? value : answer
      );
      setCorrectAnswers(newCorrectAnswers);
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
    
    // Remove from correctAnswers if it was selected
    if (correctAnswers.includes(optionToRemove)) {
      setCorrectAnswers(correctAnswers.filter(answer => answer !== optionToRemove));
    }
    
    // Reindex the media objects for options after the deleted one
    reindexOptionMedia(index);
  };

  const handleCorrectAnswerToggle = (optionValue) => {
    if (correctAnswers.includes(optionValue)) {
      // Remove from correct answers
      setCorrectAnswers(correctAnswers.filter(answer => answer !== optionValue));
    } else {
      // Add to correct answers
      setCorrectAnswers([...correctAnswers, optionValue]);
    }
  };

  // Helper to find indices of correct answers for display purposes
  const getCorrectAnswerIndices = () => {
    return options
      .map((option, index) => correctAnswers.includes(option) ? index : -1)
      .filter(index => index !== -1);
  };

  return (
    <Box>
      {/* Display IDs for debugging */}
      <Box sx={{ mb: 1, display: "flex", gap: 2, fontSize: "12px", color: "#666" }}>
        <Typography variant="caption">Order ID: {order_id}</Typography>
        <Typography variant="caption">Answer ID: {currentAnswerId}</Typography>
        <Typography variant="caption">Component ID: {questionId}</Typography>
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
          Create a multiple-choice question by entering your question text, adding options, and
          selecting all correct answers using the checkboxes.
        </Typography>
      </Paper>
      
      {/* Student Instructions Field */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Instructions for students"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          helperText="These instructions will be shown to students when completing the question"
          placeholder="Example: Select all correct answers from the options below."
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
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
          Question Preview
        </Typography>
        
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
              ...(correctAnswers.includes(option) ? {
                color: 'success.main',
                fontWeight: 500
              } : {})
            }}
          >
            <Box 
              sx={{ 
                width: 16, 
                height: 16, 
                borderRadius: '2px', 
                border: '1px solid', 
                borderColor: correctAnswers.includes(option) ? 'success.main' : 'text.secondary', 
                mr: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: correctAnswers.includes(option) ? 'success.main' : 'transparent'
              }}
            >
              {correctAnswers.includes(option) && (
                <Box 
                  component="span"
                  sx={{ 
                    color: 'white',
                    fontSize: '12px',
                    lineHeight: 1,
                    fontWeight: 'bold'
                  }}
                >
                  ✓
                </Box>
              )}
            </Box>
            <Typography variant="body2">
              {option}
            </Typography>
          </Box>
        ))}
      </Paper>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Options (select all correct answers with the checkboxes)
      </Typography>

      <FormControl component="fieldset" sx={{ width: "100%" }}>
        <Box>
          {options.map((option, index) => (
            <Box key={index} sx={{ mb: 3, border: '1px solid #eee', borderRadius: 1, p: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                {/* Correct answer selector */}
                <Tooltip title={correctAnswers.includes(option) ? "Remove as correct answer" : "Add as correct answer"}>
                  <Checkbox
                    icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                    checkedIcon={<CheckBoxIcon fontSize="small" />}
                    checked={correctAnswers.includes(option)}
                    onChange={() => handleCorrectAnswerToggle(option)}
                    sx={{ 
                      color: "action.disabled",
                      '&.Mui-checked': {
                        color: "success.main",
                      },
                      mr: 1
                    }}
                  />
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
                    ...(correctAnswers.includes(option) ? {
                      "& .MuiOutlinedInput-root": {
                        border: "1px solid",
                        borderColor: "success.light",
                        backgroundColor: "rgba(76, 175, 80, 0.04)"
                      }
                    } : {})
                  }}
                  name={`question-${questionId}-option-${index}`}
                  // Add a small indicator in the label for the correct answer
                  label={correctAnswers.includes(option) ? "Correct Answer" : ""}
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
        </Box>
      </FormControl>

      {/* Show correct answers summary */}
      <Box sx={{ mt: 2, mb: 2, p: 1, backgroundColor: "rgba(76, 175, 80, 0.08)", borderRadius: 1 }}>
        <Typography variant="caption" sx={{ display: "block", fontWeight: "medium" }}>
          Correct Answers: {correctAnswers.length > 0 
            ? getCorrectAnswerIndices().map(index => `Option ${index + 1}`).join(", ") 
            : "None selected"}
        </Typography>
        {correctAnswers.length > 0 && (
          <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
            Selected values: {correctAnswers.map(answer => `"${answer}"`).join(", ")}
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
    </Box>
  );
};

export default MultipleChoiceQuestion;