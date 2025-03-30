import React, { useState, useEffect } from "react";
import { 
  Box, Typography, TextField, Paper, Chip, 
  InputAdornment, Slider, FormControlLabel, Switch,
  Stack, Button, IconButton, Tabs, Tab,
  Card, CardContent, Alert
} from "@mui/material";
import GradeIcon from "@mui/icons-material/Grade";
import MicIcon from "@mui/icons-material/Mic";
import TimerIcon from "@mui/icons-material/Timer";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import StopIcon from "@mui/icons-material/Stop";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ChatIcon from "@mui/icons-material/Chat";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";

import QuestionMedia from "./QuestionMedia";
import useQuestionMedia from "../../../hooks/useQuestionMedia";
import DifficultySelector, { getDifficultyColor } from "./DifficultySelector";

const LLMAudioResponseCard = ({
  questionId,
  defaultQuestion = "Record your responses to the LLM-generated questions.",
  defaultMaxSeconds = 60,
  defaultDifficulty = 'medium',
  defaultMarks = 6, // Default total marks for all questions
  defaultQuestionMedia = null,
  order_id,
  answer_id,
  onUpdate = () => {},
  defaultInstruction = "When prompted, click the record button and speak your answer clearly.",
  defaultAllowRerecording = true,
  defaultAllowPause = true,
  defaultShowTimer = true,
  
  // LLM specific props
  defaultNumberOfQuestions = 3,
  defaultLlmSessionType = "question-response", // "conversation" or "question-response"
  defaultResponseSettings = null, // Optional reference to LLM session settings
  defaultLinkedLlmSessionId = null // Optional reference to linked LLM session
}) => {
  // Basic audio question state
  const [question, setQuestion] = useState(defaultQuestion);
  const [maxSeconds, setMaxSeconds] = useState(defaultMaxSeconds);
  const [instruction, setInstruction] = useState(defaultInstruction);
  const [difficulty, setDifficulty] = useState(defaultDifficulty);
  const [marks, setMarks] = useState(defaultMarks);
  const [currentAnswerId] = useState(answer_id || 0);
  const [allowRerecording, setAllowRerecording] = useState(defaultAllowRerecording);
  const [allowPause, setAllowPause] = useState(defaultAllowPause);
  const [showTimer, setShowTimer] = useState(defaultShowTimer);
  
  // LLM session specific state
  const [numberOfQuestions, setNumberOfQuestions] = useState(defaultNumberOfQuestions);
  const [llmSessionType, setLlmSessionType] = useState(defaultLlmSessionType);
  const [linkedLlmSessionId, setLinkedLlmSessionId] = useState(defaultLinkedLlmSessionId);
  
  // Question-specific settings
  const [questionSpecificSettings, setQuestionSpecificSettings] = useState(
    Array(defaultNumberOfQuestions).fill().map((_, i) => ({
      id: i + 1,
      title: `Question ${i + 1}`,
      instruction: `Respond clearly to question ${i + 1}`,
      maxSeconds: defaultMaxSeconds,
      points: Math.round(defaultMarks / defaultNumberOfQuestions)
    }))
  );
  
  // Active tab for preview
  const [activeTab, setActiveTab] = useState(0);
  
  // Demo recording states (for preview)
  const [demoRecordingStates, setDemoRecordingStates] = useState(
    Array(defaultNumberOfQuestions).fill('idle') // 'idle', 'recording', 'paused', 'completed'
  );
  const [demoSeconds, setDemoSeconds] = useState(Array(defaultNumberOfQuestions).fill(0));
  
  // Media hook
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

  // Calculate total marks based on per-question points
  const calculateTotalMarks = () => {
    return questionSpecificSettings.reduce((total, q) => total + q.points, 0);
  };

  // Update parent component when data changes
  useEffect(() => {
    onUpdate({
      id: questionId,
      type: 'llm-audio-response',
      order_id,
      answer_id: currentAnswerId,
      question,
      maxSeconds,
      instruction,
      difficulty,
      marks: calculateTotalMarks(),
      allowRerecording,
      allowPause,
      showTimer,
      question_image: questionMedia?.type === 'image' ? questionMedia : null,
      question_audio: questionMedia?.type === 'audio' ? questionMedia : null,
      question_video: questionMedia?.type === 'video' ? questionMedia : null,
      // LLM specific data
      numberOfQuestions,
      llmSessionType,
      linkedLlmSessionId,
      questionSpecificSettings
    });
  }, [
    question, maxSeconds, instruction, difficulty, marks, 
    allowRerecording, allowPause, showTimer, questionMedia,
    questionId, order_id, currentAnswerId, onUpdate,
    numberOfQuestions, llmSessionType, linkedLlmSessionId, 
    questionSpecificSettings
  ]);

  // Handle changing the number of questions
  const handleNumberOfQuestionsChange = (newValue) => {
    const numQuestions = Math.max(1, Math.min(10, newValue));
    
    if (numQuestions > numberOfQuestions) {
      // Adding new questions
      const additionalQuestions = Array(numQuestions - numberOfQuestions).fill().map((_, i) => {
        const newIndex = numberOfQuestions + i;
        return {
          id: newIndex + 1,
          title: `Question ${newIndex + 1}`,
          instruction: `Respond clearly to question ${newIndex + 1}`,
          maxSeconds: maxSeconds,
          points: Math.round(marks / numQuestions)
        };
      });
      
      setQuestionSpecificSettings([...questionSpecificSettings, ...additionalQuestions]);
      
      // Add new demo recording states
      setDemoRecordingStates([...demoRecordingStates, ...Array(numQuestions - numberOfQuestions).fill('idle')]);
      setDemoSeconds([...demoSeconds, ...Array(numQuestions - numberOfQuestions).fill(0)]);
      
    } else if (numQuestions < numberOfQuestions) {
      // Removing questions
      setQuestionSpecificSettings(questionSpecificSettings.slice(0, numQuestions));
      setDemoRecordingStates(demoRecordingStates.slice(0, numQuestions));
      setDemoSeconds(demoSeconds.slice(0, numQuestions));
      
      // If active tab is now invalid, reset it
      if (activeTab >= numQuestions) {
        setActiveTab(numQuestions - 1);
      }
    }
    
    setNumberOfQuestions(numQuestions);
    
    // Redistribute points
    const pointsPerQuestion = Math.round(marks / numQuestions);
    setQuestionSpecificSettings(prev => 
      prev.slice(0, numQuestions).map(q => ({...q, points: pointsPerQuestion}))
    );
  };

  // Handle question-specific setting changes
  const handleQuestionSettingChange = (index, key, value) => {
    const updatedSettings = [...questionSpecificSettings];
    updatedSettings[index] = {
      ...updatedSettings[index],
      [key]: value
    };
    
    setQuestionSpecificSettings(updatedSettings);
  };

  // Demo recording functions - now specific to a question index
  const startDemoRecording = (index) => {
    const newDemoStates = [...demoRecordingStates];
    newDemoStates[index] = 'recording';
    setDemoRecordingStates(newDemoStates);
    
    const newDemoSeconds = [...demoSeconds];
    newDemoSeconds[index] = 0;
    setDemoSeconds(newDemoSeconds);
  };

  const pauseDemoRecording = (index) => {
    const newDemoStates = [...demoRecordingStates];
    newDemoStates[index] = 'paused';
    setDemoRecordingStates(newDemoStates);
  };

  const resumeDemoRecording = (index) => {
    const newDemoStates = [...demoRecordingStates];
    newDemoStates[index] = 'recording';
    setDemoRecordingStates(newDemoStates);
  };

  const stopDemoRecording = (index) => {
    const newDemoStates = [...demoRecordingStates];
    newDemoStates[index] = 'completed';
    setDemoRecordingStates(newDemoStates);
  };

  const resetDemoRecording = (index) => {
    const newDemoStates = [...demoRecordingStates];
    newDemoStates[index] = 'idle';
    setDemoRecordingStates(newDemoStates);
    
    const newDemoSeconds = [...demoSeconds];
    newDemoSeconds[index] = 0;
    setDemoSeconds(newDemoSeconds);
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
        <Typography variant="caption">Total Points: {calculateTotalMarks()}</Typography>
        <Typography variant="caption">Questions: {numberOfQuestions}</Typography>
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
          Create a multi-question audio response component for LLM-generated questions.
          Students can record separate audio responses for each question.
        </Typography>
      </Paper>
      
      {/* LLM Session Type Selector */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>LLM Session Type</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant={llmSessionType === "question-response" ? "contained" : "outlined"}
            startIcon={<QuestionAnswerIcon />}
            onClick={() => setLlmSessionType("question-response")}
            size="small"
          >
            Question & Response
          </Button>
          <Button
            variant={llmSessionType === "conversation" ? "contained" : "outlined"}
            startIcon={<ChatIcon />}
            onClick={() => setLlmSessionType("conversation")}
            size="small"
          >
            Conversation
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {llmSessionType === "question-response" 
            ? "Students will respond to a series of individual questions." 
            : "Students will respond as part of a flowing conversation."}
        </Typography>
      </Box>
      
      {/* Difficulty Selector Component */}
      <Box sx={{ mb: 3 }}>
        <DifficultySelector 
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          totalMarks={calculateTotalMarks()}
        />
      </Box>
      
      {/* Number of Questions */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Number of Questions</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={() => handleNumberOfQuestionsChange(numberOfQuestions - 1)}
            disabled={numberOfQuestions <= 1}
          >
            <RemoveIcon />
          </IconButton>
          
          <Typography variant="h6" sx={{ mx: 2, minWidth: '30px', textAlign: 'center' }}>
            {numberOfQuestions}
          </Typography>
          
          <IconButton 
            onClick={() => handleNumberOfQuestionsChange(numberOfQuestions + 1)}
            disabled={numberOfQuestions >= 10}
          >
            <AddIcon />
          </IconButton>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Set how many questions the LLM will generate (1-10)
        </Typography>
      </Box>
      
      {/* Main Instructions */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="General Instructions"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          helperText="These instructions will be shown to students for all questions"
          placeholder="Example: Listen to each question and click record to answer."
          size="small"
        />
      </Box>

      {/* General Question Text */}
      <TextField
        fullWidth
        variant="outlined"
        label="Activity Introduction"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        multiline
        minRows={2}
        sx={{ mb: 2 }}
        helperText="Introduce the activity to students"
      />
      
      {/* Question Media - can be used for instructions or context */}
      <QuestionMedia
        media={questionMedia}
        onMediaChange={handleMediaChange}
        label="Add Media to Activity"
        type="question"
      />
      
      {/* Global Recording Customization */}
      <Box sx={{ mt: 3, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
          <TimerIcon fontSize="small" sx={{ mr: 0.5 }} />
          Default Maximum Recording Duration
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
            onChange={(_, value) => {
              setMaxSeconds(value);
              // Update all question settings with this new value
              setQuestionSpecificSettings(prev => 
                prev.map(q => ({...q, maxSeconds: value}))
              );
            }}
            sx={{
              '& .MuiSlider-markLabel': {
                fontSize: '0.75rem'
              }
            }}
          />
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Recording Options (applied to all questions)
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
      
      {/* Per-Question Settings */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Per-Question Settings
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          Customize settings for each individual question. These will be used when the LLM generates questions.
        </Alert>
        
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          {questionSpecificSettings.map((_, index) => (
            <Tab 
              key={index} 
              label={`Q${index + 1}`} 
              id={`question-tab-${index}`}
              aria-controls={`question-panel-${index}`}
            />
          ))}
        </Tabs>
        
        {questionSpecificSettings.map((qSettings, index) => (
          <Box
            key={index}
            role="tabpanel"
            hidden={activeTab !== index}
            id={`question-panel-${index}`}
            aria-labelledby={`question-tab-${index}`}
          >
            {activeTab === index && (
              <Box sx={{ p: 1 }}>
                <TextField
                  fullWidth
                  label={`Question ${index + 1} Title`}
                  value={qSettings.title}
                  onChange={(e) => handleQuestionSettingChange(index, 'title', e.target.value)}
                  size="small"
                  sx={{ mb: 2 }}
                  helperText="A title or label for this question"
                />
                
                <TextField
                  fullWidth
                  label={`Question ${index + 1} Instructions`}
                  value={qSettings.instruction}
                  onChange={(e) => handleQuestionSettingChange(index, 'instruction', e.target.value)}
                  size="small"
                  multiline
                  rows={2}
                  sx={{ mb: 2 }}
                  helperText="Specific instructions for this question"
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TextField
                    label="Points"
                    type="number"
                    value={qSettings.points}
                    onChange={(e) => handleQuestionSettingChange(
                      index, 
                      'points', 
                      Math.max(1, Math.min(10, parseInt(e.target.value) || 1))
                    )}
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <GradeIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    inputProps={{ min: 1, max: 10 }}
                    sx={{ width: '120px' }}
                  />
                  
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    Max Duration: 
                    <Box component="span" sx={{ fontWeight: 'bold', ml: 1 }}>
                      {formatTime(qSettings.maxSeconds)}
                    </Box>
                  </Typography>
                  
                  <Button 
                    size="small" 
                    onClick={() => handleQuestionSettingChange(index, 'maxSeconds', maxSeconds)}
                    variant="outlined"
                  >
                    Reset to Default
                  </Button>
                </Box>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>Question-Specific Recording Duration</Typography>
                  <Slider
                    value={qSettings.maxSeconds}
                    min={5}
                    max={300}
                    step={5}
                    marks={[
                      { value: 30, label: '30s' },
                      { value: 60, label: '1m' },
                      { value: 120, label: '2m' },
                      { value: 180, label: '3m' },
                    ]}
                    valueLabelDisplay="on"
                    valueLabelFormat={(value) => formatTime(value)}
                    onChange={(_, value) => handleQuestionSettingChange(index, 'maxSeconds', value)}
                  />
                </Box>
              </Box>
            )}
          </Box>
        ))}
      </Paper>
      
      {/* Preview Section */}
      <Typography variant="h6" gutterBottom>
        Student View Preview
      </Typography>
      
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
            {llmSessionType === "conversation" ? "Conversation" : "Question & Response"} Activity Preview
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
              label={`${calculateTotalMarks()} ${calculateTotalMarks() === 1 ? 'point' : 'points'}`}
              size="small"
              sx={{ fontWeight: 'medium' }}
            />
          </Box>
        </Box>
        
        {/* Main activity introduction */}
        <Typography variant="h6" gutterBottom>
          {llmSessionType === "conversation" ? "Conversation Practice" : "Speaking Practice"}
        </Typography>
        
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
        
        <Typography variant="body1" sx={{ mb: 3 }}>
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
        
        {/* Preview tabs for each question */}
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          {questionSpecificSettings.map((qSettings, index) => (
            <Tab 
              key={index} 
              label={qSettings.title || `Question ${index + 1}`} 
              id={`preview-tab-${index}`}
              aria-controls={`preview-panel-${index}`}
            />
          ))}
        </Tabs>
        
        {/* Question-specific panels */}
        {questionSpecificSettings.map((qSettings, index) => (
          <Box
            key={index}
            role="tabpanel"
            hidden={activeTab !== index}
            id={`preview-panel-${index}`}
            aria-labelledby={`preview-tab-${index}`}
          >
            {activeTab === index && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    {llmSessionType === "conversation" 
                      ? `Turn ${index + 1}: The AI asks you...` 
                      : `Question ${index + 1}`}
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic' }}>
                    "[LLM will generate a question here]"
                  </Typography>
                  
                  {qSettings.instruction && (
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
                      {qSettings.instruction}
                    </Typography>
                  )}
                  
                  {/* Audio recorder UI for this question */}
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
                        <AudiotrackIcon sx={{ mr: 1, color: demoRecordingStates[index] === 'idle' ? 'text.secondary' : 'error.main' }} />
                        <Typography variant="subtitle2">
                          Audio Response {index + 1}
                        </Typography>
                      </Box>
                      
                      {showTimer && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TimerIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {formatTime(demoSeconds[index])} / {formatTime(qSettings.maxSeconds)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, py: 2 }}>
                      {demoRecordingStates[index] === 'idle' && (
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<MicIcon />}
                          onClick={() => startDemoRecording(index)}
                        >
                          Start Recording
                        </Button>
                      )}
                      
                      {demoRecordingStates[index] === 'recording' && (
                        <>
                          {allowPause && (
                            <IconButton
                              color="primary"
                              onClick={() => pauseDemoRecording(index)}
                              size="large"
                            >
                              <PauseIcon />
                            </IconButton>
                          )}
                          
                          <IconButton
                            color="error"
                            onClick={() => stopDemoRecording(index)}
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
                      
                      {demoRecordingStates[index] === 'paused' && (
                        <>
                          <IconButton
                            color="primary"
                            onClick={() => resumeDemoRecording(index)}
                            size="large"
                          >
                            <PlayArrowIcon />
                          </IconButton>
                          
                          <IconButton
                            color="error"
                            onClick={() => stopDemoRecording(index)}
                            size="large"
                          >
                            <StopIcon />
                          </IconButton>
                          
                          <Typography variant="caption" color="text.secondary">
                            Recording paused
                          </Typography>
                        </>
                      )}
                      
                      {demoRecordingStates[index] === 'completed' && (
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
                              onClick={() => resetDemoRecording(index)}
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
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        This is a preview of the recording interface
                      </Typography>
                      
                      <Chip 
                        size="small" 
                        icon={<GradeIcon fontSize="small"/>} 
                        label={`${qSettings.points} ${qSettings.points === 1 ? 'point' : 'points'}`}
                      />
                    </Box>
                  </Paper>
                </CardContent>
              </Card>
            )}
          </Box>
        ))}
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Students will see the above interface with LLM-generated questions.
            They'll be able to record separate answers for each question.
          </Typography>
        </Box>
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
      
      {/* Configuration Summary */}
      <Box sx={{ mt: 2, mb: 3, p: 2, backgroundColor: "rgba(25, 118, 210, 0.08)", borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Configuration Summary
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>LLM Session Type:</strong> {llmSessionType === "conversation" ? "Conversation" : "Question & Response"}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Number of Questions:</strong> {numberOfQuestions}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Total Points:</strong> {calculateTotalMarks()}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Recording Settings:</strong>
        </Typography>
        
        <Box component="ul" sx={{ mt: 0, pl: 4 }}>
          <Typography component="li" variant="body2">
            {allowRerecording ? "Students can re-record their answers" : "Students cannot re-record after completion"}
          </Typography>
          <Typography component="li" variant="body2">
            {allowPause ? "Students can pause and resume while recording" : "Students cannot pause during recording"}
          </Typography>
          <Typography component="li" variant="body2">
            {showTimer ? "Students will see a timer during recording" : "Students will not see a timer during recording"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LLMAudioResponseCard;