// SingleChoiceQuestion.js
import React, { useState, useEffect } from "react";
import { 
  Box, Typography, TextField, Radio, RadioGroup, 
  FormControlLabel, FormControl, IconButton,
  Divider, Tooltip
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const SingleChoiceQuestion = ({ 
  questionId, 
  defaultQuestion = "Enter your question here...", 
  defaultOptions = ["Option 1", "Option 2"],
  defaultCorrectAnswer = null, // This will now be the value, not index
  order_id,
  answer_id,
  onUpdate = () => {} // Add callback for updates
}) => {
  const [question, setQuestion] = useState(defaultQuestion);
  const [options, setOptions] = useState(defaultOptions);
  const [correctAnswer, setCorrectAnswer] = useState(defaultCorrectAnswer);

  // Update parent component when data changes
  useEffect(() => {
    onUpdate({
      question,
      options,
      correctAnswer, // This is now the value, not the index
      id: questionId,
      order_id,
      answer_id
    });
  }, [question, options, correctAnswer, questionId, order_id, answer_id, onUpdate]);

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
  };

  const handleCorrectAnswerChange = (optionValue) => {
    setCorrectAnswer(optionValue);
  };

  // Helper to find index of correct answer for display purposes
  const correctAnswerIndex = options.findIndex(option => option === correctAnswer);

  return (
    <Box>
      {/* Display IDs for debugging */}
      <Box sx={{ mb: 1, display: "flex", gap: 2, fontSize: "12px", color: "#666" }}>
        <Typography variant="caption">Order ID: {order_id}</Typography>
        <Typography variant="caption">Answer ID: {answer_id}</Typography>
        <Typography variant="caption">Component ID: {questionId}</Typography>
      </Box>
    
      <TextField
        fullWidth
        variant="outlined"
        label="Question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Options (select the correct answer with the checkmark)
      </Typography>

      <FormControl component="fieldset" sx={{ width: "100%" }}>
        <RadioGroup>
          {options.map((option, index) => (
            <Box key={index} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
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
                name={`question-${questionId}-option-${answer_id}-${index}`}
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
          ))}
        </RadioGroup>
      </FormControl>

      {/* Show correct answer summary */}
      <Box sx={{ mt: 2, mb: 2, p: 1, backgroundColor: "rgba(76, 175, 80, 0.08)", borderRadius: 1 }}>
        <Typography variant="caption" sx={{ display: "block", fontWeight: "medium" }}>
          Correct Answer: {correctAnswer !== null 
            ? (correctAnswerIndex !== -1 ? `Option ${correctAnswerIndex + 1}` : "Value no longer in options") 
            : "Not set"}
        </Typography>
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
    </Box>
  );
};

export default SingleChoiceQuestion;