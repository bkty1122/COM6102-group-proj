//Single Choice Question Component for the form builder
import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
} from "@mui/material";
import { Trash2, Plus} from "lucide-react"; 

const SingleChoiceQuestion = ({
  questionId,
  defaultQuestion = "Enter your question here...",
  defaultOptions = ["Option 1", "Option 2"],
  defaultAnswer = null,
  onQuestionChange,
  onOptionsChange,
  onAnswerChange,
  onQuestionIdChange,
}) => {
  const [question, setQuestion] = useState(defaultQuestion);
  const [options, setOptions] = useState(defaultOptions);
  const [answer, setAnswer] = useState(defaultAnswer);

  // Handle question text changes
  const handleQuestionChange = (e) => {
    const newQuestion = e.target.value;
    setQuestion(newQuestion);
    if (onQuestionChange) {
      onQuestionChange(newQuestion);
    }
  };

  // Handle option changes
  const handleOptionChange = (index, value) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
    if (onOptionsChange) {
      onOptionsChange(updatedOptions);
    }
  };

  // Add a new option
  const addOption = () => {
    const newOption = `Option ${options.length + 1}`;
    const updatedOptions = [...options, newOption];
    setOptions(updatedOptions);
    if (onOptionsChange) {
      onOptionsChange(updatedOptions);
    }
  };

  // Remove an option
  const removeOption = (index) => {
    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);
    // If the removed option was the selected answer, clear the answer
    if (answer === options[index]) {
      setAnswer(null);
      if (onAnswerChange) {
        onAnswerChange(null);
      }
    }
    if (onOptionsChange) {
      onOptionsChange(updatedOptions);
    }
  };

  // Handle answer changes
  const handleAnswerChange = (selectedAnswer) => {
    setAnswer(selectedAnswer);
    if (onAnswerChange) {
      onAnswerChange(selectedAnswer);
    }
  };

  // Handle question ID change (for drag-and-drop reordering)
  const handleQuestionIdChange = (newId) => {
    if (onQuestionIdChange) {
      onQuestionIdChange(newId);
    }
  };

  return (
    <Box
      sx={{
        p: 3,
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "#fff",
        mb: 2,
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        maxWidth: "600px",
        position: "relative", // Position relative for absolute positioning of remove button
      }}
    >

      {/* Question ID */}
      <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
        Question ID: {questionId}
      </Typography>

      {/* Question Title */}
      <TextField
        fullWidth
        label="Question"
        value={question}
        onChange={handleQuestionChange}
        placeholder="Enter your question here..."
        sx={{ mb: 3, mt: 1 }}
      />

      {/* Options */}
      <Typography variant="subtitle1" gutterBottom>
        Options:
      </Typography>
      {options.map((option, index) => (
        <Box
          key={index}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 2,
          }}
        >
          <TextField
            fullWidth
            value={option}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            placeholder={`Option ${index + 1}`}
          />
          <IconButton
            color="error"
            onClick={() => removeOption(index)}
            disabled={options.length === 1} // Prevent removing the last option
          >
            <Trash2 size={20} />
          </IconButton>
        </Box>
      ))}

      {/* Add New Option Button */}
      <Button
        startIcon={<Plus size={16} />}
        variant="outlined"
        onClick={addOption}
      >
        Add Option
      </Button>

      {/* Correct Answer */}
      <Typography variant="subtitle1" sx={{ mt: 3 }} gutterBottom>
        Answer (Optional):
      </Typography>
      <FormControl component="fieldset">
        <RadioGroup
          value={answer}
          onChange={(e) => handleAnswerChange(e.target.value)}
        >
          {options.map((option, index) => (
            <FormControlLabel
              key={index}
              value={option}
              control={<Radio />}
              label={option}
            />
          ))}
        </RadioGroup>
      </FormControl>
    </Box>
  );
};

export default SingleChoiceQuestion;