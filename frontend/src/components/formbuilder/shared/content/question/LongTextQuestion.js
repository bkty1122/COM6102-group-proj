// src/components/formbuilder/shared/LongTextQuestion.js
import React, { useState, useEffect } from "react";
import { 
  Box, Typography, TextField, Divider, Paper, Chip, 
  InputAdornment, Tooltip, Accordion,
  AccordionSummary, AccordionDetails, Switch, FormControlLabel
} from "@mui/material";
import GradeIcon from "@mui/icons-material/Grade";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import QuestionMedia from "./QuestionMedia";
import useQuestionMedia from "../../../hooks/useQuestionMedia";
import DifficultySelector, { getDifficultyColor } from "./DifficultySelector";

const LongTextQuestion = ({
  questionId,
  defaultQuestion = "Enter your question here...",
  defaultPlaceholder = "Write your answer here...",
  defaultRows = 4,
  defaultSuggestedAnswer = "",
  defaultDifficulty = 'medium',
  defaultMarks = 1,
  order_id,
  answer_id,
  onUpdate = () => {},
  defaultInstruction = "Provide a detailed response to the question below."
}) => {
  const [question, setQuestion] = useState(defaultQuestion);
  const [placeholder, setPlaceholder] = useState(defaultPlaceholder);
  const [rows, setRows] = useState(defaultRows);
  const [suggestedAnswer, setSuggestedAnswer] = useState(defaultSuggestedAnswer);
  const [showSuggestedAnswer, setShowSuggestedAnswer] = useState(false);
  const [instruction, setInstruction] = useState(defaultInstruction);
  const [difficulty, setDifficulty] = useState(defaultDifficulty);
  const [marks, setMarks] = useState(defaultMarks);
  const [currentAnswerId] = useState(answer_id || 0);
  const [suggestedAnswerExpanded, setSuggestedAnswerExpanded] = useState(false);
  
  // Use the media hook for question media
  const { 
    questionMedia, 
    handleMediaChange
  } = useQuestionMedia();

  // Update parent component when data changes
  useEffect(() => {
    onUpdate({
      id: questionId,
      type: 'long-text',
      order_id,
      answer_id: currentAnswerId,
      question,
      placeholder,
      rows,
      suggestedAnswer,
      instruction,
      difficulty,
      marks,
      question_image: questionMedia?.type === 'image' ? questionMedia : null,
      question_audio: questionMedia?.type === 'audio' ? questionMedia : null,
      question_video: questionMedia?.type === 'video' ? questionMedia : null
    });
  }, [
    question, placeholder, rows, suggestedAnswer, instruction, 
    difficulty, marks, questionMedia, questionId, order_id, 
    currentAnswerId, onUpdate
  ]);

  // Handle changing the mark value
  const handleMarksChange = (value) => {
    const newValue = Math.max(1, parseInt(value) || 1);
    setMarks(Math.min(10, newValue)); // Cap at a maximum of 10 points
  };

  // Handle changing the rows value
  const handleRowsChange = (value) => {
    const newValue = Math.max(2, parseInt(value) || 2);
    setRows(Math.min(20, newValue)); // Cap between 2 and 20 rows
  };

  return (
    <Box>
      {/* Display IDs for debugging */}
      <Box sx={{ mb: 1, display: "flex", gap: 2, fontSize: "12px", color: "#666" }}>
        <Typography variant="caption">Order ID: {order_id}</Typography>
        <Typography variant="caption">Answer ID: {currentAnswerId}</Typography>
        <Typography variant="caption">Component ID: {questionId}</Typography>
        <Typography variant="caption">Points: {marks}</Typography>
        <Typography variant="caption">Rows: {rows}</Typography>
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
          Create a long text question where students can provide detailed responses.
          Set difficulty, point value, customize the number of rows, and provide a suggested answer.
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
          helperText="Points awarded for this response (1-10)"
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
          placeholder="Example: Provide a detailed response to the question below."
          size="small"
        />
      </Box>

      {/* Question Text Field */}
      <TextField
        fullWidth
        variant="outlined"
        label="Question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        multiline
        minRows={2}
        sx={{ mb: 2 }}
      />
      
      {/* Question Media */}
      <QuestionMedia
        media={questionMedia}
        onMediaChange={handleMediaChange}
        label="Add Media to Question"
        type="question"
      />
      
      {/* Response Customization - Placeholder & Rows */}
      <Box sx={{ mt: 3, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Response Field Settings
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: {xs: 'column', sm: 'row'}, gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="Placeholder Text"
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            helperText="Text shown before student enters their response"
          />
          
          <TextField
            sx={{ width: {xs: '100%', sm: '200px'} }}
            size="small"
            label="Number of Rows"
            type="number"
            value={rows}
            onChange={(e) => handleRowsChange(e.target.value)}
            inputProps={{ min: 2, max: 20 }}
            helperText="Default height of response field (2-20)"
          />
        </Box>
      </Box>
      
      {/* Suggested Answer Section */}
      <Accordion
        expanded={suggestedAnswerExpanded}
        onChange={() => setSuggestedAnswerExpanded(!suggestedAnswerExpanded)}
        sx={{ mb: 3, backgroundColor: '#fafafa' }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ backgroundColor: '#f0f7ff' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2">Suggested Answer (For grading reference)</Typography>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showSuggestedAnswer}
                  onChange={(e) => setShowSuggestedAnswer(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                />
              }
              label={
                <Typography variant="caption">
                  {showSuggestedAnswer ? "Visible to students" : "Hidden from students"}
                </Typography>
              }
              sx={{ mr: 0 }}
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            fullWidth
            multiline
            minRows={3}
            variant="outlined"
            label="Suggested Answer"
            value={suggestedAnswer}
            onChange={(e) => setSuggestedAnswer(e.target.value)}
            placeholder="Enter a model answer or grading guidelines..."
            helperText={
              showSuggestedAnswer 
                ? "This answer will be shown to students after submission" 
                : "This answer is for grading reference only"
            }
          />
        </AccordionDetails>
      </Accordion>
      
      {/* Question preview */}
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
        {questionMedia?.type === 'image' && (
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Box
              component="img"
              src={questionMedia.src || questionMedia.url}
              alt="Question media"
              sx={{ 
                maxWidth: '100%', 
                maxHeight: 200, 
                objectFit: 'contain',
                borderRadius: '4px'
              }}
            />
          </Box>
        )}
        
        {/* Answer field preview */}
        <TextField
          fullWidth
          variant="outlined"
          multiline
          rows={rows}
          placeholder={placeholder}
          disabled
          sx={{ 
            my: 2,
            "& .MuiOutlinedInput-root": {
              backgroundColor: "#ffffff"
            }
          }}
        />
        
        {/* Show suggested answer in preview if enabled */}
        {suggestedAnswer && showSuggestedAnswer && (
          <Box sx={{ mt: 3, p: 2, border: '1px dashed', borderColor: 'success.light', borderRadius: 1, bgcolor: 'success.light', opacity: 0.1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <VisibilityIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="subtitle2" color="success.main">
                Suggested Answer (Visible to students after submission)
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {suggestedAnswer}
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* Grading Info Section */}
      <Box sx={{ mt: 4, p: 2, backgroundColor: "rgba(76, 175, 80, 0.08)", borderRadius: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2">
            Grading Information
          </Typography>
          
          <Tooltip title={showSuggestedAnswer ? "Suggested answer will be shown to students" : "Suggested answer is hidden from students"}>
            <Chip
              icon={showSuggestedAnswer ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
              label={showSuggestedAnswer ? "Answer Visible" : "Answer Hidden"}
              size="small"
              color={showSuggestedAnswer ? "success" : "default"}
            />
          </Tooltip>
        </Box>
        
        <Typography variant="body2" sx={{ mb: 1 }}>
          This question is worth <b>{marks} {marks === 1 ? 'point' : 'points'}</b> and requires manual grading.
        </Typography>
        
        {suggestedAnswer ? (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              A suggested answer has been provided to assist in grading.
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No suggested answer has been provided. Consider adding one to help with grading consistency.
          </Typography>
        )}
      </Box>
      
      <Divider sx={{ my: 3 }} />
      
      <Box sx={{ mt: 2, bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          About This Question Type:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Allows students to provide extended text responses
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • You can customize the response field size and placeholder text
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Suggested answers can be provided for grading reference
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Requires manual grading by instructors
        </Typography>
      </Box>
    </Box>
  );
};

export default LongTextQuestion;