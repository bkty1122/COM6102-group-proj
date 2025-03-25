// components/formbuilder/shared/MatchingQuestion.js
import React, { useState, useEffect, useRef } from "react";
import { 
  Box, Typography, TextField, IconButton,
  Divider, Button, Chip, Paper, List, 
  InputLabel, Card, CardContent, Grid, Tooltip,
  FormControl, FormLabel, InputAdornment
} from "@mui/material";
import AddCircleOutline from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicator from "@mui/icons-material/DragIndicator";
import ImageIcon from "@mui/icons-material/Image";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import VideocamIcon from "@mui/icons-material/Videocam";
import GradeIcon from "@mui/icons-material/Grade";
import QuestionMedia from "./QuestionMedia";
import useQuestionMedia from "../../../hooks/useQuestionMedia";
import DifficultySelector, { getDifficultyColor } from "./DifficultySelector";

const MatchingQuestion = ({ 
  questionId, 
  defaultQuestion = "Enter your question text here...",
  defaultBlanks = [], 
  defaultDifficulty = 'medium',
  order_id,
  startingAnswerId = 0,
  onUpdate = () => {},
  defaultInstruction = "Fill in the blanks with the correct answers below."
}) => {
  const [question, setQuestion] = useState(defaultQuestion);
  const [blanks, setBlanks] = useState([]);
  const [nextAnswerId, setNextAnswerId] = useState(startingAnswerId);
  const [instruction, setInstruction] = useState(defaultInstruction);
  const [difficulty, setDifficulty] = useState(defaultDifficulty);
  const blankRefs = useRef([]);
  
  // Use the media hook for question media
  const { questionMedia, handleMediaChange } = useQuestionMedia();

  // Initialize blanks with proper answer_ids
  useEffect(() => {
    if (defaultBlanks && defaultBlanks.length > 0) {
      const processedBlanks = defaultBlanks.map((blank, index) => {
        const answerId = blank.answer_id !== undefined ? blank.answer_id : startingAnswerId + index;
        
        return {
          ...blank,
          id: index,
          answer_id: answerId,
          label: blank.label || `Blank ${index + 1}`,
          correctAnswers: blank.correctAnswers || blank.correctAnswer || [""],
          placeholder: blank.placeholder || "Enter your answer",
          option_image: blank.option_image || null,
          option_audio: blank.option_audio || null,
          option_video: blank.option_video || null,
          marks: blank.marks !== undefined ? blank.marks : 1
        };
      });
      
      setBlanks(processedBlanks);
      blankRefs.current = processedBlanks.map(() => React.createRef());
      
      const maxAnswerId = Math.max(...processedBlanks.map(b => b.answer_id), startingAnswerId - 1);
      setNextAnswerId(maxAnswerId + 1);
    } else {
      // Create two default blanks
      const defaultItems = [
        {
          id: 0,
          answer_id: startingAnswerId,
          label: "Blank 1",
          correctAnswers: [""],
          placeholder: "Enter your answer",
          option_image: null,
          option_audio: null,
          option_video: null,
          marks: 1
        },
        {
          id: 1,
          answer_id: startingAnswerId + 1,
          label: "Blank 2",
          correctAnswers: [""],
          placeholder: "Enter your answer",
          option_image: null,
          option_audio: null,
          option_video: null,
          marks: 1
        }
      ];
      
      setBlanks(defaultItems);
      blankRefs.current = defaultItems.map(() => React.createRef());
      setNextAnswerId(startingAnswerId + 2);
    }
  }, [defaultBlanks, startingAnswerId]);

  // Update parent component when data changes
  useEffect(() => {
    onUpdate({
      id: questionId,
      type: 'matching',
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

  // Add a new blank field
  const handleAddBlank = () => {
    const newBlankId = blanks.length;
    const newAnswerId = nextAnswerId;
    
    const newBlank = {
      id: newBlankId,
      answer_id: newAnswerId,
      label: `Blank ${newBlankId + 1}`,
      correctAnswers: [""],
      placeholder: "Enter your answer",
      option_image: null,
      option_audio: null,
      option_video: null,
      marks: 1
    };
    
    setNextAnswerId(prev => prev + 1);
    
    const newBlanks = [...blanks, newBlank];
    setBlanks(newBlanks);
    blankRefs.current = newBlanks.map((_, index) => 
      blankRefs.current[index] || React.createRef()
    );
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

  // Handle changing the label of a blank
  const handleLabelChange = (blankIndex, value) => {
    const updatedBlanks = [...blanks];
    updatedBlanks[blankIndex].label = value;
    setBlanks(updatedBlanks);
  };

  // Handle changing the placeholder text
  const handlePlaceholderChange = (blankIndex, value) => {
    const updatedBlanks = [...blanks];
    updatedBlanks[blankIndex].placeholder = value;
    setBlanks(updatedBlanks);
  };

  // Handle changing the mark value for a blank
  const handleMarkChange = (blankIndex, value) => {
    const updatedBlanks = [...blanks];
    updatedBlanks[blankIndex].marks = value;
    setBlanks(updatedBlanks);
  };

  // Handle changing media for a blank
  const handleBlankMediaChange = (blankIndex, media) => {
    const updatedBlanks = [...blanks];
    
    // Update the media for this blank
    updatedBlanks[blankIndex].option_image = media?.type === 'image' ? media : null;
    updatedBlanks[blankIndex].option_audio = media?.type === 'audio' ? media : null;
    updatedBlanks[blankIndex].option_video = media?.type === 'video' ? media : null;
    
    setBlanks(updatedBlanks);
  };

  // Remove a blank
  const handleRemoveBlank = (blankIndex) => {
    if (blanks.length <= 1) return;
    
    // Create updated blanks array - preserving the answer_ids of remaining blanks
    const updatedBlanks = blanks
      .filter((_, index) => index !== blankIndex)
      .map((blank, newIndex) => ({
        ...blank,
        id: newIndex,
        label: blank.label.includes("Blank") ? `Blank ${newIndex + 1}` : blank.label
      }));
    
    setBlanks(updatedBlanks);
    blankRefs.current = updatedBlanks.map((_, index) => blankRefs.current[index] || React.createRef());
  };

  // Move a blank up or down in the list
  const handleMoveBlank = (blankIndex, direction) => {
    if ((direction === 'up' && blankIndex === 0) || 
        (direction === 'down' && blankIndex === blanks.length - 1)) {
      return;
    }
    
    const updatedBlanks = [...blanks];
    const targetIndex = direction === 'up' ? blankIndex - 1 : blankIndex + 1;
    
    // Swap blanks
    [updatedBlanks[blankIndex], updatedBlanks[targetIndex]] = 
    [updatedBlanks[targetIndex], updatedBlanks[blankIndex]];
    
    // Update IDs to maintain order
    updatedBlanks.forEach((blank, idx) => {
      blank.id = idx;
    });
    
    setBlanks(updatedBlanks);
  };

  // Scroll to the blank when clicked
  const scrollToBlank = (blankIndex) => {
    if (blankRefs.current[blankIndex]?.current) {
      blankRefs.current[blankIndex].current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
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

  // Helper function to get the media icon for a blank
  const getBlankMediaIcon = (blank) => {
    if (blank.option_image) return <ImageIcon color="primary" fontSize="small" />;
    if (blank.option_audio) return <AudiotrackIcon color="secondary" fontSize="small" />;
    if (blank.option_video) return <VideocamIcon color="error" fontSize="small" />;
    return null;
  };

  // Helper function to get the media type label
  const getBlankMediaLabel = (blank) => {
    if (blank.option_image) return "Image";
    if (blank.option_audio) return "Audio";
    if (blank.option_video) return "Video";
    return "None";
  };

  // Helper function to get current media object for a blank
  const getBlankMedia = (blank) => {
    if (blank.option_image) return { ...blank.option_image, type: 'image' };
    if (blank.option_audio) return { ...blank.option_audio, type: 'audio' };
    if (blank.option_video) return { ...blank.option_video, type: 'video' };
    return null;
  };

  // Calculate total marks for the question
  const totalMarks = blanks.reduce((sum, blank) => sum + (blank.marks || 0), 0);

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
        sx={{ mb: 2, p: 1.5, backgroundColor: "#f5f5f5", borderLeft: "4px solid #2196f3" }}
      >
        <Typography variant="body2">
          Create a question with blanks displayed below the question text.
          Add multiple blanks with optional media and define correct answers for each.
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
          placeholder="Example: Fill in the blanks with the correct answers below."
          size="small"
        />
      </Box>
      
      {/* Question text */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Question Text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          multiline
          minRows={3}
          sx={{ mb: 1 }}
        />
      </Box>
      
      {/* Question Media */}
      <QuestionMedia
        media={questionMedia}
        onMediaChange={handleMediaChange}
        label="Add Media to Question"
        type="question"
      />
      
      {/* Question preview with blanks below */}
      <Card
        variant="outlined"
        sx={{ p: 0, mb: 3, mt: 3, backgroundColor: '#fafafa' }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <InputLabel shrink sx={{ color: 'text.secondary', mb: 0 }}>
              Question Preview
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
          
          {/* Instruction text */}
          {instruction && (
            <Typography 
              variant="body2" 
              sx={{ mb: 2, fontStyle: 'italic', color: 'text.secondary', borderLeft: '2px solid #2196f3', pl: 1 }}
            >
              {instruction}
            </Typography>
          )}
          
          {/* Question text */}
          <Typography variant="body1" sx={{ mb: 3 }}>
            {question}
          </Typography>
          
          {/* Media preview if available */}
          {questionMedia?.type === 'image' && (
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Box
                component="img"
                src={questionMedia.src || questionMedia.url}
                alt="Question media"
                sx={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: '4px' }}
              />
            </Box>
          )}
          
          {/* Blank fields below */}
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              {blanks.map((blank, blankIndex) => {
                const color = getBlankColor(blankIndex);
                const hasMedia = blank.option_image || blank.option_audio || blank.option_video;
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={`preview-blank-${blank.id}`}>
                    <Box 
                      sx={{ 
                        p: 2,
                        border: '1px solid',
                        borderColor: color.border,
                        borderRadius: '4px',
                        bgcolor: '#ffffff',
                        cursor: 'pointer'
                      }}
                      onClick={() => scrollToBlank(blankIndex)}
                    >
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: hasMedia ? 2 : 1
                      }}>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ color: color.text, display: 'flex', alignItems: 'center' }}
                        >
                          <Box 
                            component="span" 
                            sx={{ 
                              bgcolor: color.bg, 
                              color: color.text, 
                              px: 1, 
                              py: 0.5, 
                              borderRadius: '4px',
                              mr: 1,
                              fontSize: '0.8rem',
                              fontWeight: 'bold'
                            }}
                          >
                            {blankIndex + 1}
                          </Box>
                          {blank.label}
                        </Typography>
                        
                        <Chip 
                          size="small" 
                          label={`${blank.marks} pt${blank.marks !== 1 ? 's' : ''}`} 
                          sx={{ height: '20px', fontSize: '0.7rem', fontWeight: 'bold' }} 
                        />
                      </Box>
                      
                      {/* Display blank media preview if available */}
                      {blank.option_image && (
                        <Box sx={{ mb: 1, textAlign: 'center' }}>
                          <Box
                            component="img"
                            src={blank.option_image.src || blank.option_image.url}
                            alt={blank.label}
                            sx={{ maxWidth: '100%', height: 60, objectFit: 'contain', borderRadius: '4px' }}
                          />
                        </Box>
                      )}
                      
                      {blank.option_audio && (
                        <Box sx={{ mb: 1, textAlign: 'center' }}>
                          <AudiotrackIcon color="secondary" />
                          <Typography variant="caption" sx={{ display: 'block' }}>
                            Audio attached
                          </Typography>
                        </Box>
                      )}
                      
                      {blank.option_video && (
                        <Box sx={{ mb: 1, textAlign: 'center' }}>
                          <VideocamIcon color="error" />
                          <Typography variant="caption" sx={{ display: 'block' }}>
                            Video attached
                          </Typography>
                        </Box>
                      )}
                      
                      <TextField
                        fullWidth
                        size="small"
                        disabled
                        placeholder={blank.placeholder}
                        InputProps={{
                          sx: {
                            bgcolor: '#f9f9f9',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: color.border,
                            }
                          }
                        }}
                      />
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Blanks management section */}
      <Box sx={{ mt: 3, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2">
          Define blanks and correct answers
        </Typography>
        
        <Button 
          variant="outlined" 
          size="small" 
          startIcon={<AddCircleOutline />}
          onClick={handleAddBlank}
        >
          Add Blank Field
        </Button>
      </Box>
      
      <List>
        {blanks.map((blank, blankIndex) => {
          const color = getBlankColor(blankIndex);
          const hasMedia = blank.option_image || blank.option_audio || blank.option_video;
          const blankMedia = getBlankMedia(blank);
          
          return (
            <Paper 
              key={blank.id} 
              variant="outlined" 
              sx={{ mb: 2, p: 2, borderColor: color.border, borderLeftWidth: '4px' }}
              ref={blankRefs.current[blankIndex]}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="subtitle2" component="span">
                    Blank {blankIndex + 1}
                  </Typography>
                  <Chip 
                    label={`Answer ID: ${blank.answer_id}`} 
                    size="small" 
                    sx={{ ml: 1, backgroundColor: color.bg, color: color.text }} 
                  />
                  {hasMedia && (
                    <Chip 
                      icon={getBlankMediaIcon(blank)}
                      label={getBlankMediaLabel(blank)}
                      size="small" 
                      sx={{ ml: 1 }} 
                    />
                  )}
                </Box>
                
                <Box>
                  <Tooltip title="Move blank up">
                    <span>
                      <IconButton 
                        size="small" 
                        onClick={() => handleMoveBlank(blankIndex, 'up')}
                        disabled={blankIndex === 0}
                        sx={{ mr: 1 }}
                      >
                        <DragIndicator fontSize="small" sx={{ transform: 'rotate(180deg)' }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  
                  <Tooltip title="Move blank down">
                    <span>
                      <IconButton 
                        size="small" 
                        onClick={() => handleMoveBlank(blankIndex, 'down')}
                        disabled={blankIndex === blanks.length - 1}
                        sx={{ mr: 1 }}
                      >
                        <DragIndicator fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  
                  <Tooltip title="Remove blank">
                    <span>
                      <IconButton 
                        size="small" 
                        onClick={() => handleRemoveBlank(blankIndex)}
                        color="error"
                        disabled={blanks.length <= 1}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Blank Label"
                    value={blank.label}
                    onChange={(e) => handleLabelChange(blankIndex, e.target.value)}
                    sx={{ mb: 2 }}
                    helperText="Label displayed above the blank field"
                  />
                
                  <TextField
                    fullWidth
                    size="small"
                    label="Placeholder Text"
                    value={blank.placeholder}
                    onChange={(e) => handlePlaceholderChange(blankIndex, e.target.value)}
                    sx={{ mb: 2 }}
                    helperText="Text shown in empty input fields"
                  />
                  
                  {/* Points/Marks input */}
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
                    sx={{ mb: 2 }}
                    helperText="Points awarded for correct answer (1-10)"
                  />
                  
                  {/* Media input section - using QuestionMedia component */}
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.875rem' }}>
                      Blank Media (Optional)
                    </FormLabel>
                    <QuestionMedia
                      media={blankMedia}
                      onMediaChange={(media) => handleBlankMediaChange(blankIndex, media)}
                      label="Add Media to Blank"
                      type="blank"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Correct answers (students must match one of these):
                    </Typography>
                    
                    {blank.correctAnswers.map((answer, answerIndex) => (
                      <Box 
                        key={answerIndex} 
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
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
                      startIcon={<AddCircleOutline />}
                      sx={{ mt: 1 }}
                    >
                      Add alternative answer
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          );
        })}
      </List>

      {/* Add More Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 3 }}>
        <Button 
          variant="outlined" 
          startIcon={<AddCircleOutline />}
          onClick={handleAddBlank}
        >
          Add Another Blank Field
        </Button>
      </Box>

      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ mt: 2, bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          About This Question Type:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Blank fields are displayed below the question text, not embedded within it
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Each blank can have an optional image, audio, or video attachment
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • You can specify multiple acceptable answers for each blank
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Each blank can be assigned different point values based on difficulty
        </Typography>
      </Box>
    </Box>
  );
};

export default MatchingQuestion;