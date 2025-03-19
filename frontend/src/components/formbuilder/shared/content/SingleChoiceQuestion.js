// src/components/formbuilder/shared/SingleChoiceQuestion.js
import React, { useState, useEffect } from "react";
import { 
  Box, Typography, TextField, RadioGroup, FormControl, IconButton,
  Divider, Tooltip, Button
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { MediaSelector, MediaPreview, MediaPicker } from "../media/MediaComponents";

const SingleChoiceQuestion = ({ 
  questionId, 
  defaultQuestion = "Enter your question here...", 
  defaultOptions = ["Option 1", "Option 2"],
  defaultCorrectAnswer = null,
  defaultQuestionMedia = null,
  defaultOptionMedia = {},
  order_id,
  answer_id,
  onUpdate = () => {}
}) => {
  const [question, setQuestion] = useState(defaultQuestion);
  const [questionMedia, setQuestionMedia] = useState(defaultQuestionMedia);
  const [options, setOptions] = useState(
    Array.isArray(defaultOptions) 
      ? defaultOptions.map(opt => typeof opt === 'string' ? opt : opt.option_value || '') 
      : ["Option 1", "Option 2"]
  );
  const [optionMedia, setOptionMedia] = useState(defaultOptionMedia || {});
  const [correctAnswer, setCorrectAnswer] = useState(defaultCorrectAnswer);
  
  // Media picker state
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState({ type: null, index: null });

  // Update parent component when data changes
  useEffect(() => {
    // Convert options to the complex format
    const formattedOptions = options.map((option, idx) => ({
      id: idx + 1,
      answer_id: idx,
      option_value: option,
      option_image: optionMedia[idx]?.type === 'image' ? optionMedia[idx] : null,
      option_audio: optionMedia[idx]?.type === 'audio' ? optionMedia[idx] : null,
      option_video: optionMedia[idx]?.type === 'video' ? optionMedia[idx] : null,
    }));

    onUpdate({
      id: questionId,
      order_id,
      answer_id,
      question,
      options: formattedOptions,
      question_image: questionMedia?.type === 'image' ? questionMedia : null,
      question_audio: questionMedia?.type === 'audio' ? questionMedia : null,
      question_video: questionMedia?.type === 'video' ? questionMedia : null,
      correctAnswer
    });
  }, [question, options, optionMedia, questionMedia, correctAnswer, questionId, order_id, answer_id, onUpdate]);

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
    
    // Remove media for this option
    const newOptionMedia = { ...optionMedia };
    delete newOptionMedia[index];
    
    // Reindex the media objects for options after the deleted one
    const updatedOptionMedia = {};
    Object.keys(newOptionMedia).forEach(key => {
      const keyIndex = parseInt(key);
      if (keyIndex > index) {
        updatedOptionMedia[keyIndex - 1] = newOptionMedia[keyIndex];
      } else {
        updatedOptionMedia[keyIndex] = newOptionMedia[keyIndex];
      }
    });
    
    setOptionMedia(updatedOptionMedia);
  };

  const handleCorrectAnswerChange = (optionValue) => {
    setCorrectAnswer(optionValue);
  };

  // Open media picker
  const handleOpenMediaPicker = (type, index = null) => {
    setMediaTarget({ type, index });
    setMediaDialogOpen(true);
  };

  // Handle media selection
  const handleSelectMedia = (media) => {
    if (mediaTarget.type === 'question') {
      setQuestionMedia(media);
    } else if (mediaTarget.type === 'option' && mediaTarget.index !== null) {
      setOptionMedia(prev => ({
        ...prev,
        [mediaTarget.index]: media
      }));
    }
  };

  // Remove media
  const handleRemoveMedia = (type, index = null) => {
    if (type === 'question') {
      setQuestionMedia(null);
    } else if (type === 'option' && index !== null) {
      setOptionMedia(prev => {
        const newOptionMedia = { ...prev };
        delete newOptionMedia[index];
        return newOptionMedia;
      });
    }
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
        sx={{ mb: 1 }}
      />
      
      {/* Question Media */}
      <MediaSelector 
        label="Add Media to Question"
        currentMedia={questionMedia}
        onSelectMedia={(media) => setQuestionMedia(media)}
        onRemoveMedia={() => setQuestionMedia(null)}
      />
      
      <MediaPreview 
        media={questionMedia} 
        onRemove={() => handleRemoveMedia('question')} 
      />

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
              
              {/* Option media controls */}
              <Box sx={{ ml: 4 }}>
                <MediaSelector
                  label="Add Media to Option"
                  currentMedia={optionMedia[index]}
                  onSelectMedia={(media) => {
                    setOptionMedia(prev => ({
                      ...prev,
                      [index]: media
                    }));
                  }}
                  onRemoveMedia={() => handleRemoveMedia('option', index)}
                />
                
                <MediaPreview 
                  media={optionMedia[index]} 
                  onRemove={() => handleRemoveMedia('option', index)} 
                />
              </Box>
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

      {/* Media Picker Dialog */}
      <MediaPicker
        open={mediaDialogOpen}
        onClose={() => setMediaDialogOpen(false)}
        onSelectMedia={handleSelectMedia}
      />
    </Box>
  );
};

export default SingleChoiceQuestion;