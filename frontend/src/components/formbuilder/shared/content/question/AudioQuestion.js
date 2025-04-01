import React, { useState, useEffect } from "react";
import { 
  Box, Typography, TextField, Divider, Paper, Chip, 
  InputAdornment, Slider, FormControlLabel, Switch,
  Stack, Button, IconButton, Tooltip
} from "@mui/material";
import GradeIcon from "@mui/icons-material/Grade";
import MicIcon from "@mui/icons-material/Mic";
import TimerIcon from "@mui/icons-material/Timer";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import StopIcon from "@mui/icons-material/Stop";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import QuestionMedia from "./QuestionMedia";
import useQuestionMedia from "../../../hooks/useQuestionMedia";
import DifficultySelector, { getDifficultyColor } from "./DifficultySelector";

const AudioQuestion = ({
  questionId,
  defaultQuestion = "Record your answer to the question below.",
  defaultMaxSeconds = 60,
  defaultDifficulty = 'medium',
  defaultMarks = 1,
  defaultQuestionMedia = null, // Added defaultQuestionMedia prop
  order_id,
  answer_id,
  onUpdate = () => {},
  defaultInstruction = "Click the record button and speak your answer clearly.",
  defaultAllowRerecording = true,
  defaultAllowPause = true,
  defaultShowTimer = true
}) => {
  const [question, setQuestion] = useState(defaultQuestion);
  const [maxSeconds, setMaxSeconds] = useState(defaultMaxSeconds);
  const [instruction, setInstruction] = useState(defaultInstruction);
  const [difficulty, setDifficulty] = useState(defaultDifficulty);
  const [marks, setMarks] = useState(defaultMarks);
  const [currentAnswerId] = useState(answer_id || 0);
  const [allowRerecording, setAllowRerecording] = useState(defaultAllowRerecording);
  const [allowPause, setAllowPause] = useState(defaultAllowPause);
  const [showTimer, setShowTimer] = useState(defaultShowTimer);
  
  // Demo recording state (for preview only)
  const [demoRecordingState, setDemoRecordingState] = useState('idle'); // idle, recording, paused, completed
  const [demoSeconds, setDemoSeconds] = useState(0);
  
  // Use the media hook for question media - initialize with defaultQuestionMedia
  const { 
    questionMedia, 
    handleMediaChange
  } = useQuestionMedia(defaultQuestionMedia);

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update parent component when data changes
  useEffect(() => {
    onUpdate({
      id: questionId,
      type: 'audio',
      order_id,
      answer_id: currentAnswerId,
      question,
      maxSeconds,
      instruction,
      difficulty,
      marks,
      allowRerecording,
      allowPause,
      showTimer,
      question_image: questionMedia?.type === 'image' ? questionMedia : null,
      question_audio: questionMedia?.type === 'audio' ? questionMedia : null,
      question_video: questionMedia?.type === 'video' ? questionMedia : null
    });
  }, [
    question, maxSeconds, instruction, difficulty, marks, 
    allowRerecording, allowPause, showTimer, questionMedia,
    questionId, order_id, currentAnswerId, onUpdate
  ]);

  // Handle changing the mark value
  const handleMarksChange = (value) => {
    const newValue = Math.max(1, parseInt(value) || 1);
    setMarks(Math.min(10, newValue)); // Cap at a maximum of 10 points
  };

  // Handle changing the max seconds
  const handleMaxSecondsChange = (value) => {
    setMaxSeconds(value);
  };

  // Demo recording functions (simulate recording process for preview)
  const startDemoRecording = () => {
    setDemoRecordingState('recording');
    setDemoSeconds(0);
  };

  const pauseDemoRecording = () => {
    setDemoRecordingState('paused');
  };

  const resumeDemoRecording = () => {
    setDemoRecordingState('recording');
  };

  const stopDemoRecording = () => {
    setDemoRecordingState('completed');
  };

  const resetDemoRecording = () => {
    setDemoRecordingState('idle');
    setDemoSeconds(0);
  };

  // Mark ranges for slider (renamed to avoid conflict with marks state)
  const timeMarkers = [
    { value: 10, label: '10s' },
    { value: 30, label: '30s' },
    { value: 60, label: '1m' },
    { value: 120, label: '2m' },
    { value: 180, label: '3m' },
    { value: 300, label: '5m' }
  ];

  return (
    <Box>
      {/* Display IDs for debugging */}
      <Box sx={{ mb: 1, display: "flex", gap: 2, fontSize: "12px", color: "#666" }}>
        <Typography variant="caption">Order ID: {order_id}</Typography>
        <Typography variant="caption">Answer ID: {currentAnswerId}</Typography>
        <Typography variant="caption">Component ID: {questionId}</Typography>
        <Typography variant="caption">Points: {marks}</Typography>
        <Typography variant="caption">Max Duration: {formatTime(maxSeconds)}</Typography>
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
          Create an audio recording question where students can respond by speaking.
          Set difficulty, point value, maximum recording duration, and recording options.
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
          helperText="Points awarded for this audio response (1-10)"
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
          helperText="These instructions will be shown to students when recording their answer"
          placeholder="Example: Click the record button and speak your answer clearly."
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
      
      {/* Recording Customization - Max Duration & Options */}
      <Box sx={{ mt: 3, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
          <TimerIcon fontSize="small" sx={{ mr: 0.5 }} />
          Maximum Recording Duration
        </Typography>
        
        <Box sx={{ px: 2, mt: 3, mb: 4 }}>
          <Slider
            value={maxSeconds}
            min={5}
            max={300}
            step={5}
            marks={timeMarkers}
            valueLabelDisplay="on"
            valueLabelFormat={(value) => formatTime(value)}
            onChange={(_, value) => handleMaxSecondsChange(value)}
            sx={{
              '& .MuiSlider-markLabel': {
                fontSize: '0.75rem'
              }
            }}
          />
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Recording Options
          </Typography>
          
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={allowRerecording}
                  onChange={(e) => setAllowRerecording(e.target.checked)}
                />
              }
              label="Allow students to re-record their answers"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={allowPause}
                  onChange={(e) => setAllowPause(e.target.checked)}
                />
              }
              label="Allow students to pause and resume recording"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={showTimer}
                  onChange={(e) => setShowTimer(e.target.checked)}
                />
              }
              label="Show timer during recording"
            />
          </Stack>
        </Box>
      </Box>
      
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
              src={questionMedia.url || questionMedia.src}
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
        
        {/* Audio recorder preview */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            my: 2,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: '#ffffff',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AudiotrackIcon sx={{ mr: 1, color: demoRecordingState === 'idle' ? 'text.secondary' : 'error.main' }} />
              <Typography variant="subtitle2">
                Audio Response
              </Typography>
            </Box>
            
            {showTimer && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TimerIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {formatTime(demoSeconds)} / {formatTime(maxSeconds)}
                </Typography>
              </Box>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, py: 2 }}>
            {demoRecordingState === 'idle' && (
              <Button
                variant="contained"
                color="error"
                startIcon={<MicIcon />}
                onClick={startDemoRecording}
              >
                Start Recording
              </Button>
            )}
            
            {demoRecordingState === 'recording' && (
              <>
                {allowPause && (
                  <IconButton
                    color="primary"
                    onClick={pauseDemoRecording}
                    size="large"
                  >
                    <PauseIcon />
                  </IconButton>
                )}
                
                <IconButton
                  color="error"
                  onClick={stopDemoRecording}
                  size="large"
                >
                  <StopIcon />
                </IconButton>
                
                <Box sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  bgcolor: 'error.main',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }} />
              </>
            )}
            
            {demoRecordingState === 'paused' && (
              <>
                <IconButton
                  color="primary"
                  onClick={resumeDemoRecording}
                  size="large"
                >
                  <PlayArrowIcon />
                </IconButton>
                
                <IconButton
                  color="error"
                  onClick={stopDemoRecording}
                  size="large"
                >
                  <StopIcon />
                </IconButton>
                
                <Typography variant="caption" color="text.secondary">
                  Recording paused
                </Typography>
              </>
            )}
            
            {demoRecordingState === 'completed' && (
              <>
                <IconButton
                  color="primary"
                  size="large"
                  disabled
                >
                  <PlayArrowIcon />
                </IconButton>
                
                {allowRerecording && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<MicIcon />}
                    onClick={resetDemoRecording}
                  >
                    Record Again
                  </Button>
                )}
                
                <Typography variant="caption" color="success.main">
                  Recording complete
                </Typography>
              </>
            )}
          </Box>
          
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
            This is a preview of the recording interface students will see.
          </Typography>
        </Paper>
      </Paper>
      
      {/* Technical Requirements Note */}
      <Paper 
        elevation={0} 
        sx={{ 
          mb: 3, 
          p: 2, 
          backgroundColor: "#fff8e1", 
          borderLeft: "4px solid #ffc107"
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <InfoOutlinedIcon sx={{ color: '#f57c00', mr: 1, mt: 0.3 }} />
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Technical Requirements
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Students will need a working microphone and will be prompted to grant microphone access.
              Some browsers may require HTTPS for audio recording functionality.
            </Typography>
          </Box>
        </Box>
      </Paper>
      
      {/* Additional Settings Summary */}
      <Box sx={{ mt: 2, mb: 3, p: 2, backgroundColor: "rgba(25, 118, 210, 0.08)", borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Configuration Summary
        </Typography>
        
        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <TimerIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
          Maximum recording duration: <b style={{ marginLeft: '4px' }}>{formatTime(maxSeconds)}</b>
        </Typography>
        
        <Typography variant="body2">
          Student options:
        </Typography>
        
        <Box component="ul" sx={{ mt: 0, pl: 4 }}>
          <Typography component="li" variant="body2">
            {allowRerecording ? "Can re-record their answer" : "Cannot re-record after completion"}
          </Typography>
          <Typography component="li" variant="body2">
            {allowPause ? "Can pause and resume while recording" : "Cannot pause during recording"}
          </Typography>
          <Typography component="li" variant="body2">
            {showTimer ? "Will see a timer during recording" : "Will not see a timer during recording"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default AudioQuestion;