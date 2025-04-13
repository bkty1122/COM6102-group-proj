import React, { useState, useEffect } from "react";
import { 
  Box, Typography, TextField, FormControl, IconButton,
  Divider, Tooltip, Paper, Checkbox, Chip, InputAdornment
} from "@mui/material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import GradeIcon from "@mui/icons-material/Grade";
import QuestionMedia from "./QuestionMedia";
import useQuestionMedia from "../../../hooks/useQuestionMedia";
import DifficultySelector, { getDifficultyColor } from "./DifficultySelector";
import { getMediaType, extractMediaUrl } from "../../../utils/mediaUtils";

const MultipleChoiceQuestion = ({ 
  questionId, 
  defaultQuestion = "Enter your question here...", 
  defaultOptions = ["Option 1", "Option 2"],
  defaultCorrectAnswers = [],
  defaultQuestionMedia = null,
  defaultOptionMedia = {},
  defaultDifficulty = 'medium',
  defaultMarks = 1,
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
  const [correctAnswer, setCorrectAnswers] = useState(
    Array.isArray(defaultCorrectAnswers) ? defaultCorrectAnswers : []
  );
  const [currentAnswerId] = useState(answer_id || 0);
  const [instruction, setInstruction] = useState(defaultInstruction); // State for instruction
  const [difficulty, setDifficulty] = useState(defaultDifficulty);
  const [marks, setMarks] = useState(defaultMarks);
  
  // Use the media hook
  const { 
    questionMedia, 
    optionMedia, 
    handleMediaChange,
    reindexOptionMedia
  } = useQuestionMedia(defaultQuestionMedia, defaultOptionMedia);

  useEffect(() => {
    // Convert options to the complex format with answer_id
    const formattedOptions = options.map((option, idx) => {
      const mediaUrl = optionMedia[idx];
      const mediaType = getMediaType(mediaUrl);
      
      return {
        id: idx,
        answer_id: currentAnswerId,
        option_value: option,
        option_image: mediaType === 'image' ? mediaUrl : null,
        option_audio: mediaType === 'audio' ? mediaUrl : null,
        option_video: mediaType === 'video' ? mediaUrl : null,
      };
    });
  
    // Determine question media type
    const questionMediaType = getMediaType(questionMedia);
  
    // Convert the array of correct answers to a JSON string or another format
    // that can be stored in a TEXT field
    const correctAnswerString = JSON.stringify(correctAnswer);

    onUpdate({
      id: questionId,
      type: 'multiple-choice',
      order_id,
      answer_id: currentAnswerId,
      question,
      options: formattedOptions,
      instruction,
      difficulty,
      marks,
      question_image: questionMediaType === 'image' ? questionMedia : null,
      question_audio: questionMediaType === 'audio' ? questionMedia : null,
      question_video: questionMediaType === 'video' ? questionMedia : null,
      correct_answer: correctAnswerString,  // For the database column
      correctAnswers: correctAnswer,        // For the validator
    });
  }, [question, options, optionMedia, questionMedia, correctAnswer, instruction, difficulty, marks, questionId, order_id, currentAnswerId, onUpdate]);
  
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    const oldValue = newOptions[index];
    newOptions[index] = value;
    setOptions(newOptions);
    
    // If this option was in the correct answers, update it there too
    if (correctAnswer.includes(oldValue)) {
      const newCorrectAnswers = correctAnswer.map(answer => 
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
    
    // Remove from correctAnswer if it was selected
    if (correctAnswer.includes(optionToRemove)) {
      setCorrectAnswers(correctAnswer.filter(answer => answer !== optionToRemove));
    }
    
    // Reindex the media objects for options after the deleted one
    reindexOptionMedia(index);
  };

  const handleCorrectAnswerToggle = (optionValue) => {
    if (correctAnswer.includes(optionValue)) {
      // Remove from correct answers
      setCorrectAnswers(correctAnswer.filter(answer => answer !== optionValue));
    } else {
      // Add to correct answers
      setCorrectAnswers([...correctAnswer, optionValue]);
    }
  };

  // Handle changing the mark value
  const handleMarksChange = (value) => {
    const newValue = Math.max(1, parseInt(value) || 1);
    setMarks(Math.min(10, newValue)); // Cap at a maximum of 10 points
  };

  // Helper to find indices of correct answers for display purposes
  const getCorrectAnswerIndices = () => {
    return options
      .map((option, index) => correctAnswer.includes(option) ? index : -1)
      .filter(index => index !== -1);
  };

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
          Create a multiple-choice question by entering your question text, adding options, and
          selecting all correct answers using the checkboxes. Set the difficulty and point value.
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
          helperText="Points awarded for selecting all correct answers (1-10)"
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
        
        {/* Media preview if available */}
        {(() => {
          if (!questionMedia) return null;
          
          const mediaType = getMediaType(questionMedia);
          const mediaUrl = extractMediaUrl(questionMedia);
          
          if (!mediaUrl) return null;
          
          if (mediaType === 'image') {
            return (
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Box
                  component="img"
                  src={mediaUrl}
                  alt="Question media"
                  sx={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: '4px' }}
                />
              </Box>
            );
          }
          
          if (mediaType === 'audio') {
            return (
              <Box sx={{ mb: 3 }}>
                <Box component="audio" controls sx={{ width: '100%' }}>
                  <source src={mediaUrl} />
                  Your browser does not support the audio element.
                </Box>
              </Box>
            );
          }
          
          if (mediaType === 'video') {
            return (
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Box component="video" controls sx={{ maxWidth: '100%', maxHeight: 200 }}>
                  <source src={mediaUrl} />
                  Your browser does not support the video element.
                </Box>
              </Box>
            );
          }
          
          return null;
        })()}
        
        {/* Show options in preview */}
        {options.map((option, index) => (
          <Box 
            key={index}
            sx={{ 
              mb: 1,
              pl: 2,
              display: 'flex',
              alignItems: 'center',
              ...(correctAnswer.includes(option) ? {
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
                borderColor: correctAnswer.includes(option) ? 'success.main' : 'text.secondary', 
                mr: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: correctAnswer.includes(option) ? 'success.main' : 'transparent'
              }}
            >
              {correctAnswer.includes(option) && (
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
        
        {/* Show option media if available */}
        {options.map((option, index) => {
          const media = optionMedia[index];
          if (!media) return null;
          
          const mediaType = getMediaType(media);
          const mediaUrl = extractMediaUrl(media);
          
          if (!mediaUrl) return null;
          
          return (
            <Box key={`media-${index}`} sx={{ ml: 4, mt: 1, mb: 2 }}>
              {mediaType === 'image' && (
                <Box sx={{ maxWidth: '200px' }}>
                  <Box
                    component="img"
                    src={mediaUrl}
                    alt={`Media for option ${index + 1}`}
                    sx={{ width: '100%', borderRadius: '4px' }}
                  />
                </Box>
              )}
              
              {mediaType === 'audio' && (
                <Box component="audio" controls sx={{ width: '200px' }}>
                  <source src={mediaUrl} />
                  Your browser does not support the audio element.
                </Box>
              )}
              
              {mediaType === 'video' && (
                <Box sx={{ maxWidth: '200px' }}>
                  <Box component="video" controls sx={{ width: '100%' }}>
                    <source src={mediaUrl} />
                    Your browser does not support the video element.
                  </Box>
                </Box>
              )}
            </Box>
          );
        })}
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
                <Tooltip title={correctAnswer.includes(option) ? "Remove as correct answer" : "Add as correct answer"}>
                  <Checkbox
                    icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                    checkedIcon={<CheckBoxIcon fontSize="small" />}
                    checked={correctAnswer.includes(option)}
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
                    ...(correctAnswer.includes(option) ? {
                      "& .MuiOutlinedInput-root": {
                        border: "1px solid",
                        borderColor: "success.light",
                        backgroundColor: "rgba(76, 175, 80, 0.04)"
                      }
                    } : {})
                  }}
                  name={`question-${questionId}-option-${index}`}
                  // Add a small indicator in the label for the correct answer
                  label={correctAnswer.includes(option) ? "Correct Answer" : ""}
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ display: "block", fontWeight: "medium" }}>
            Correct Answers: {correctAnswer.length > 0 
              ? getCorrectAnswerIndices().map(index => `Option ${index + 1}`).join(", ") 
              : "None selected"}
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
        
        {correctAnswer.length > 0 && (
          <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
            Selected values: {correctAnswer.map(answer => `"${answer}"`).join(", ")}
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
          • Students select multiple answers from the available options
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • You can set a difficulty level and assign point value to the question
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Each option can include text, images, audio, or video
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Students must select all correct answers to receive full points
        </Typography>
      </Box>
    </Box>
  );
};

export default MultipleChoiceQuestion;