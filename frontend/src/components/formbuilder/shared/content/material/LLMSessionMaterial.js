// LLMSessionMaterial.js (simplified to match MaterialTypeMap)
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Paper,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Switch,
  Tooltip,
  Grid,
  Button,
  Alert,
  Stack
} from "@mui/material";
import {
  ChevronDown,
  Info,
  Edit3,
  Clock,
  MessageSquare,
  Repeat,
  Settings,
  Sparkles,
  PlusCircle,
  X,
  CheckSquare
} from "lucide-react";

// Available choices for different settings (same as in the full component)
const RESPONSE_LENGTH_OPTIONS = [
  { value: "brief", label: "Brief (1-2 sentences)" },
  { value: "medium", label: "Medium (3-5 sentences)" },
  { value: "detailed", label: "Detailed (6+ sentences)" },
  { value: "adaptive", label: "Adaptive (varies based on context)" }
];

const TONE_OPTIONS = [
  { value: "friendly", label: "Friendly & Casual" },
  { value: "professional", label: "Professional" },
  { value: "academic", label: "Academic" },
  { value: "socratic", label: "Socratic (question-based)" },
  { value: "challenging", label: "Challenging" }
];

const TOPIC_CATEGORIES = [
  { value: "general", label: "General Conversation" },
  { value: "academic", label: "Academic Discussions" },
  { value: "business", label: "Business & Professional" },
  { value: "daily_life", label: "Daily Life & Routines" },
  { value: "culture", label: "Cultural Topics" },
  { value: "current_events", label: "Current Events" },
  { value: "travel", label: "Travel & Geography" },
  { value: "technology", label: "Technology & Science" }
];

const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
  { value: "adaptive", label: "Adaptive (adjusts during conversation)" }
];

const SKILLS_FOCUS_OPTIONS = [
  { value: "speaking", label: "Speaking" },
  { value: "listening", label: "Listening" },
  { value: "vocabulary", label: "Vocabulary Building" },
  { value: "grammar", label: "Grammar Practice" },
  { value: "fluency", label: "Fluency" },
  { value: "pronunciation", label: "Pronunciation" },
  { value: "critical_thinking", label: "Critical Thinking" },
  { value: "persuasion", label: "Persuasion & Argumentation" }
];

const EVALUATION_CRITERIA = [
  { value: "fluency", label: "Fluency" },
  { value: "vocabulary", label: "Vocabulary Usage" },
  { value: "grammar", label: "Grammatical Accuracy" },
  { value: "pronunciation", label: "Pronunciation" },
  { value: "coherence", label: "Coherence" },
  { value: "content", label: "Content Relevance" },
  { value: "engagement", label: "Engagement" },
  { value: "turn_taking", label: "Turn Taking" }
];

const TOPICAL_GUIDANCE_OPTIONS = [
  { value: "strict", label: "Strict (stays strictly on topic)" },
  { value: "moderate", label: "Moderate (allows some exploration)" },
  { value: "flexible", label: "Flexible (follows user's lead)" }
];

// Adjusted LLM Session Material component to work with MaterialTypeMap
const LLMSessionMaterial = ({ 
  materialId, 
  page_index, 
  order_id, 
  onRemove, 
  onUpdate,
  defaultTitle,
  defaultSessionSettings,
  defaultShowTitle,
  defaultTitleStyle
}) => {
  // Material state
  const [title, setTitle] = useState(defaultTitle);
  const [showTitle, setShowTitle] = useState(defaultShowTitle);
  const [titleStyle, setTitleStyle] = useState(defaultTitleStyle);
  const [sessionSettings, setSessionSettings] = useState(defaultSessionSettings);
  
  // For expanded sections
  const [expandedSection, setExpandedSection] = useState("basic");
  
  // Preview mode toggle
  const [previewMode, setPreviewMode] = useState(false);
  
  // For adding new topics
  const [newTopic, setNewTopic] = useState("");

  // Update the parent component when settings change
  useEffect(() => {
    if (onUpdate) {
      onUpdate({
        id: materialId,
        type: "llm-session-material",
        page_index,
        order_id,
        title,
        showTitle,
        titleStyle,
        sessionSettings
      });
    }
  }, [materialId, page_index, order_id, title, showTitle, titleStyle, sessionSettings, onUpdate]);

  // Handle any setting change
  const handleSettingChange = (key, value) => {
    setSessionSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle nested setting change (for advancedOptions)
  const handleAdvancedSettingChange = (key, value) => {
    setSessionSettings(prev => ({
      ...prev,
      advancedOptions: {
        ...prev.advancedOptions,
        [key]: value
      }
    }));
  };

  // Handle multi-select changes (for arrays)
  const handleMultiSelectChange = (key, value) => {
    // If the value is already in the array, remove it, otherwise add it
    setSessionSettings(prev => {
      const currentValues = prev[key] || [];
      let newValues;
      
      if (currentValues.includes(value)) {
        newValues = currentValues.filter(item => item !== value);
      } else {
        newValues = [...currentValues, value];
      }
      
      return {
        ...prev,
        [key]: newValues
      };
    });
  };

  // Add a new forced topic
  const handleAddTopic = () => {
    if (newTopic.trim() && !sessionSettings.forcedTopics.includes(newTopic.trim())) {
      setSessionSettings(prev => ({
        ...prev,
        forcedTopics: [...prev.forcedTopics, newTopic.trim()]
      }));
      setNewTopic("");
    }
  };

  // Remove a forced topic
  const handleRemoveTopic = (topic) => {
    setSessionSettings(prev => ({
      ...prev,
      forcedTopics: prev.forcedTopics.filter(t => t !== topic)
    }));
  };

  // Toggle accordion sections
  const handleAccordionChange = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    setSessionSettings(defaultSessionSettings);
  };

  // Title change handler
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  // Toggle title visibility
  const handleShowTitleChange = (e) => {
    setShowTitle(e.target.checked);
  };

  // Change title style
  const handleTitleStyleChange = (e) => {
    setTitleStyle(e.target.value);
  };

  // Same component structure as the full version, but with simpler state management
  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      {/* Add title controls */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Switch 
            checked={showTitle} 
            onChange={handleShowTitleChange}
            size="small"
          />
          <Typography variant="body2" sx={{ ml: 1 }}>Show Title</Typography>
        </Box>
        
        {showTitle && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Material Title"
              value={title}
              onChange={handleTitleChange}
              size="small"
            />
            
            <FormControl sx={{ minWidth: 120 }} size="small">
              <InputLabel>Style</InputLabel>
              <Select
                value={titleStyle}
                label="Style"
                onChange={handleTitleStyleChange}
              >
                <MenuItem value="h1">H1</MenuItem>
                <MenuItem value="h2">H2</MenuItem>
                <MenuItem value="h3">H3</MenuItem>
                <MenuItem value="h4">H4</MenuItem>
                <MenuItem value="h5">H5</MenuItem>
                <MenuItem value="h6">H6</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px'
        }}
      >
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MessageSquare size={20} />
          LLM Interactive Session Configuration
        </Typography>
        
        <Stack direction="row" spacing={2} alignItems="center">
          <Tooltip title={previewMode ? "Edit settings" : "Preview how this will appear to students"}>
            <Button 
              size="small" 
              variant="outlined"
              startIcon={previewMode ? <Edit3 size={16} /> : <Sparkles size={16} />}
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? "Edit Settings" : "Preview"}
            </Button>
          </Tooltip>
          
          <Tooltip title="Reset all settings to default values">
            <Button 
              size="small" 
              color="error" 
              variant="outlined"
              onClick={handleResetDefaults}
            >
              Reset
            </Button>
          </Tooltip>
        </Stack>
      </Paper>

      {previewMode ? (
        // Preview mode shows how the session will appear to students
        <SessionPreview settings={sessionSettings} />
      ) : (
        // Edit mode shows all configuration options
        <Box>
          {/* Basic Settings */}
          <Accordion 
            expanded={expandedSection === 'basic'} 
            onChange={() => handleAccordionChange('basic')}
            sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: '8px !important', overflow: 'hidden' }}
          >
            <AccordionSummary 
              expandIcon={<ChevronDown />}
              sx={{ backgroundColor: '#f9f9f9' }}
            >
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 500 }}>
                <Settings size={18} />
                Basic Session Settings
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Session Title"
                    variant="outlined"
                    value={sessionSettings.sessionTitle}
                    onChange={(e) => handleSettingChange('sessionTitle', e.target.value)}
                    helperText="Title visible to students"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Session Description"
                    variant="outlined"
                    value={sessionSettings.sessionDescription}
                    onChange={(e) => handleSettingChange('sessionDescription', e.target.value)}
                    multiline
                    rows={2}
                    helperText="Brief description of this conversation activity"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Topic Category</InputLabel>
                    <Select
                      value={sessionSettings.topicCategory}
                      label="Topic Category"
                      onChange={(e) => handleSettingChange('topicCategory', e.target.value)}
                    >
                      {TOPIC_CATEGORIES.map(option => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Difficulty Level</InputLabel>
                    <Select
                      value={sessionSettings.difficultyLevel}
                      label="Difficulty Level"
                      onChange={(e) => handleSettingChange('difficultyLevel', e.target.value)}
                    >
                      {DIFFICULTY_LEVELS.map(option => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Session Duration (minutes)
                    </Typography>
                    <Slider
                      value={sessionSettings.sessionDuration}
                      min={1}
                      max={20}
                      step={1}
                      marks={[
                        { value: 1, label: '1m' },
                        { value: 5, label: '5m' },
                        { value: 10, label: '10m' },
                        { value: 15, label: '15m' },
                        { value: 20, label: '20m' },
                      ]}
                      valueLabelDisplay="auto"
                      onChange={(_, value) => handleSettingChange('sessionDuration', value)}
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Maximum Conversation Turns
                    </Typography>
                    <Slider
                      value={sessionSettings.maxTurns}
                      min={2}
                      max={20}
                      step={1}
                      marks={[
                        { value: 2, label: '2' },
                        { value: 6, label: '6' },
                        { value: 10, label: '10' },
                        { value: 15, label: '15' },
                        { value: 20, label: '20' },
                      ]}
                      valueLabelDisplay="auto"
                      onChange={(_, value) => handleSettingChange('maxTurns', value)}
                    />
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Conversation Flow Settings */}
          <Accordion 
            expanded={expandedSection === 'flow'} 
            onChange={() => handleAccordionChange('flow')}
            sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: '8px !important', overflow: 'hidden' }}
          >
            <AccordionSummary 
              expandIcon={<ChevronDown />}
              sx={{ backgroundColor: '#f9f9f9' }}
            >
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 500 }}>
                <Repeat size={18} />
                Conversation Flow Settings
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Initial Question / Prompt"
                    variant="outlined"
                    value={sessionSettings.initialQuestion}
                    onChange={(e) => handleSettingChange('initialQuestion', e.target.value)}
                    multiline
                    rows={2}
                    helperText="The first question or prompt to start the conversation"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Response Length</InputLabel>
                    <Select
                      value={sessionSettings.responseLength}
                      label="Response Length"
                      onChange={(e) => handleSettingChange('responseLength', e.target.value)}
                    >
                      {RESPONSE_LENGTH_OPTIONS.map(option => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Conversation Tone</InputLabel>
                    <Select
                      value={sessionSettings.toneStyle}
                      label="Conversation Tone"
                      onChange={(e) => handleSettingChange('toneStyle', e.target.value)}
                    >
                      {TONE_OPTIONS.map(option => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Skills Focus
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {SKILLS_FOCUS_OPTIONS.map(skill => (
                      <Chip
                        key={skill.value}
                        label={skill.label}
                        clickable
                        color={sessionSettings.skillsFocus.includes(skill.value) ? "primary" : "default"}
                        onClick={() => handleMultiSelectChange('skillsFocus', skill.value)}
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Forced Topics (LLM must include these topics)
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                    {sessionSettings.forcedTopics.map(topic => (
                      <Chip
                        key={topic}
                        label={topic}
                        onDelete={() => handleRemoveTopic(topic)}
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      size="small"
                      label="Add topic"
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTopic()}
                    />
                    <Button 
                      variant="outlined" 
                      startIcon={<PlusCircle size={16} />}
                      onClick={handleAddTopic}
                    >
                      Add
                    </Button>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Post-Session Instructions"
                    variant="outlined"
                    value={sessionSettings.postInstructions}
                    onChange={(e) => handleSettingChange('postInstructions', e.target.value)}
                    multiline
                    rows={2}
                    helperText="Instructions shown to students after completing the conversation"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Evaluation Settings */}
          <Accordion 
            expanded={expandedSection === 'evaluation'} 
            onChange={() => handleAccordionChange('evaluation')}
            sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: '8px !important', overflow: 'hidden' }}
          >
            <AccordionSummary 
              expandIcon={<ChevronDown />}
              sx={{ backgroundColor: '#f9f9f9' }}
            >
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 500 }}>
                <CheckSquare size={18} />
                Evaluation Settings
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1">Enable Session Evaluation</Typography>
                    <Switch
                      checked={sessionSettings.evaluationEnabled}
                      onChange={(e) => handleSettingChange('evaluationEnabled', e.target.checked)}
                      inputProps={{ 'aria-label': 'controlled' }}
                    />
                  </Box>
                </Grid>
                
                {sessionSettings.evaluationEnabled && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Evaluation Criteria
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {EVALUATION_CRITERIA.map(criterion => (
                          <Chip
                            key={criterion.value}
                            label={criterion.label}
                            clickable
                            color={sessionSettings.evaluationCriteria.includes(criterion.value) ? "primary" : "default"}
                            onClick={() => handleMultiSelectChange('evaluationCriteria', criterion.value)}
                            sx={{ m: 0.5 }}
                          />
                        ))}
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ my: 1 }}>
                        The LLM will provide feedback based on the selected criteria after the session ends.
                      </Alert>
                    </Grid>
                  </>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Advanced Options */}
          <Accordion 
            expanded={expandedSection === 'advanced'} 
            onChange={() => handleAccordionChange('advanced')}
            sx={{ mb: 2, boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: '8px !important', overflow: 'hidden' }}
          >
            <AccordionSummary 
              expandIcon={<ChevronDown />}
              sx={{ backgroundColor: '#f9f9f9' }}
            >
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 500 }}>
                <Settings size={18} />
                Advanced Options
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="System Instructions (for LLM)"
                    variant="outlined"
                    value={sessionSettings.systemInstructions}
                    onChange={(e) => handleSettingChange('systemInstructions', e.target.value)}
                    multiline
                    rows={4}
                    helperText="Instructions for the LLM about how to behave during the conversation (not shown to students)"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Response Timeout (seconds)</span>
                      <Tooltip title="Maximum time students have to respond before the system moves on">
                        <Info size={16} />
                      </Tooltip>
                    </Typography>
                    <Slider
                      value={sessionSettings.responseTimeout}
                      min={10}
                      max={300}
                      step={10}
                      marks={[
                        { value: 30, label: '30s' },
                        { value: 60, label: '1m' },
                        { value: 120, label: '2m' },
                        { value: 180, label: '3m' },
                        { value: 300, label: '5m' },
                      ]}
                      valueLabelDisplay="auto"
                      onChange={(_, value) => handleSettingChange('responseTimeout', value)}
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Topical Guidance</InputLabel>
                    <Select
                      value={sessionSettings.advancedOptions.topicalGuidance}
                      label="Topical Guidance"
                      onChange={(e) => handleAdvancedSettingChange('topicalGuidance', e.target.value)}
                    >
                      {TOPICAL_GUIDANCE_OPTIONS.map(option => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>Additional Features</Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Enable follow-up questions</Typography>
                        <Switch
                          checked={sessionSettings.advancedOptions.enableFollowUpQuestions}
                          onChange={(e) => handleAdvancedSettingChange('enableFollowUpQuestions', e.target.checked)}
                          size="small"
                        />
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Allow users to end early</Typography>
                        <Switch
                          checked={sessionSettings.advancedOptions.allowUserToEndEarly}
                          onChange={(e) => handleAdvancedSettingChange('allowUserToEndEarly', e.target.checked)}
                          size="small"
                        />
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Provide conversation hints</Typography>
                        <Switch
                          checked={sessionSettings.advancedOptions.provideHints}
                          onChange={(e) => handleAdvancedSettingChange('provideHints', e.target.checked)}
                          size="small"
                        />
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Record conversation</Typography>
                        <Switch
                          checked={sessionSettings.advancedOptions.recordConversation}
                          onChange={(e) => handleAdvancedSettingChange('recordConversation', e.target.checked)}
                          size="small"
                        />
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Adaptive difficulty</Typography>
                        <Switch
                          checked={sessionSettings.advancedOptions.adaptiveDifficulty}
                          onChange={(e) => handleAdvancedSettingChange('adaptiveDifficulty', e.target.checked)}
                          size="small"
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Alert severity="success" sx={{ width: '100%' }}>
              <Typography variant="body2">
                Changes are automatically saved. Use the preview button to see how this session will appear to students.
              </Typography>
            </Alert>
          </Box>
        </Box>
      )}
      
      {/* Remove button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="outlined" 
          color="error"
          startIcon={<X size={16} />}
          onClick={onRemove}
        >
          Remove LLM Session
        </Button>
      </Box>
    </Box>
  );
};

// Preview component to show how the session will appear to students
const SessionPreview = ({ settings }) => {
  return (
    <Paper elevation={1} sx={{ p: 3, borderRadius: '8px' }}>
      <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid #eee' }}>
        <Typography variant="h5" gutterBottom>
          {settings.sessionTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {settings.sessionDescription}
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
          <Chip
            icon={<Clock size={14} />}
            label={`${settings.sessionDuration} min`}
            size="small"
            variant="outlined"
          />
          <Chip
            icon={<MessageSquare size={14} />}
            label={`${settings.maxTurns} turns`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={DIFFICULTY_LEVELS.find(d => d.value === settings.difficultyLevel)?.label || settings.difficultyLevel}
            size="small"
            color="primary"
            variant="outlined"
          />
          
          {settings.skillsFocus.slice(0, 2).map(skill => (
            <Chip
              key={skill}
              label={SKILLS_FOCUS_OPTIONS.find(s => s.value === skill)?.label || skill}
              size="small"
              color="secondary"
              variant="outlined"
            />
          ))}
          
          {settings.skillsFocus.length > 2 && (
            <Chip
              label={`+${settings.skillsFocus.length - 2} more`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
          Starting Prompt:
        </Typography>
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2, 
            borderRadius: '12px', 
            borderColor: '#e0e0e0',
            backgroundColor: '#f9f9f9'
          }}
        >
          <Typography variant="body1">
            {settings.initialQuestion}
          </Typography>
        </Paper>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Info size={18} />
          Session Information
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Conversation Type
              </Typography>
              <Typography variant="body2">
                {TOPIC_CATEGORIES.find(t => t.value === settings.topicCategory)?.label || settings.topicCategory} with 
                {' '}{TONE_OPTIONS.find(t => t.value === settings.toneStyle)?.label || settings.toneStyle} tone
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Response Format
              </Typography>
              <Typography variant="body2">
                {RESPONSE_LENGTH_OPTIONS.find(r => r.value === settings.responseLength)?.label || settings.responseLength}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Skills Development
              </Typography>
              <Typography variant="body2">
                {settings.skillsFocus.map(skill => 
                  SKILLS_FOCUS_OPTIONS.find(s => s.value === skill)?.label || skill
                ).join(', ')}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      {settings.evaluationEnabled && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckSquare size={18} />
            Evaluation Criteria
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {settings.evaluationCriteria.map(criterion => (
              <Chip
                key={criterion}
                label={EVALUATION_CRITERIA.find(c => c.value === criterion)?.label || criterion}
                size="small"
                color="success"
              />
            ))}
          </Box>
        </Box>
      )}
      
      <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #eee' }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
          After Session:
        </Typography>
        <Typography variant="body2">
          {settings.postInstructions}
        </Typography>
      </Box>
    </Paper>
  );
};

export default LLMSessionMaterial;