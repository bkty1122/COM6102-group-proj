// LLMSessionMaterial.js - Main component
import React, { useState, useEffect } from "react";
import {
  Box, Typography, TextField, Switch, FormControl,
  InputLabel, Select, MenuItem, Divider, Paper,
  Button, Tooltip, Stack
} from "@mui/material";
import { MessageSquare, Edit3, Sparkles, X } from "lucide-react";

// Import sub-components
import BasicSettings from "./LLMSessionComponents/BasicSettings";
import ConversationFlowSettings from "./LLMSessionComponents/ConversationFlowSettings";
import EvaluationSettings from "./LLMSessionComponents/EvaluationSettings";
import AdvancedOptions from "./LLMSessionComponents/AdvancedOptions";
import SessionPreview from "./LLMSessionComponents/SessionPreview";

// Options constants
import { 
  SESSION_TYPE_OPTIONS, 
  TOPIC_CATEGORIES,
  DIFFICULTY_LEVELS,
  RESPONSE_LENGTH_OPTIONS,
  TONE_OPTIONS,
  SKILLS_FOCUS_OPTIONS,
  EVALUATION_CRITERIA,
  TOPICAL_GUIDANCE_OPTIONS
} from "./LLMSessionComponents/optionsConstants";

// Main component
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
  
  // Initialize with default settings and ensure all required properties exist
  const [sessionSettings, setSessionSettings] = useState({
    // Ensure all required properties have defaults
    sessionTitle: "Interactive Language Session",
    sessionDescription: "Practice your language skills with an AI conversation partner.",
    topicCategory: "general",
    difficultyLevel: "intermediate",
    sessionDuration: 5,
    maxTurns: 6,
    responseLength: "medium",
    toneStyle: "friendly",
    initialQuestion: "Tell me about yourself. What are your interests?",
    skillsFocus: ["speaking", "fluency"],
    forcedTopics: [],
    postInstructions: "Thank you for participating in this conversation practice.",
    systemInstructions: "You are a helpful language practice assistant.",
    responseTimeout: 60,
    evaluationEnabled: false,
    evaluationCriteria: ["fluency", "vocabulary", "grammar"],
    enablePreparation: false,
    preparationTime: 30,
    preparationInstructions: "Take this time to think about the topic and prepare your thoughts.",
    sessionType: "conversation", // New field: conversation or question-response
    advancedOptions: {
      topicalGuidance: "moderate",
      enableFollowUpQuestions: true,
      allowUserToEndEarly: true,
      provideHints: false,
      recordConversation: true,
      adaptiveDifficulty: false
    },
    ...defaultSessionSettings // Override defaults with any provided settings
  });
  
  // For expanded sections
  const [expandedSection, setExpandedSection] = useState("basic");
  
  // Preview mode toggle
  const [previewMode, setPreviewMode] = useState(false);

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

  // Toggle accordion sections
  const handleAccordionChange = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    // Reset to the original defaults but keep the ID and other metadata
    const { id, page_index, order_id, ...rest } = defaultSessionSettings;
    setSessionSettings({
      sessionTitle: "Interactive Language Session",
      sessionDescription: "Practice your language skills with an AI conversation partner.",
      topicCategory: "general",
      difficultyLevel: "intermediate",
      sessionDuration: 5,
      maxTurns: 6,
      responseLength: "medium",
      toneStyle: "friendly",
      initialQuestion: "Tell me about yourself. What are your interests?",
      skillsFocus: ["speaking", "fluency"],
      forcedTopics: [],
      postInstructions: "Thank you for participating in this conversation practice.",
      systemInstructions: "You are a helpful language practice assistant.",
      responseTimeout: 60,
      evaluationEnabled: false,
      evaluationCriteria: ["fluency", "vocabulary", "grammar"],
      enablePreparation: false,
      preparationTime: 30,
      preparationInstructions: "Take this time to think about the topic and prepare your thoughts.",
      sessionType: "conversation",
      advancedOptions: {
        topicalGuidance: "moderate",
        enableFollowUpQuestions: true,
        allowUserToEndEarly: true,
        provideHints: false,
        recordConversation: true,
        adaptiveDifficulty: false
      },
      ...rest
    });
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

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      {/* Title controls */}
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
      
      {/* Header */}
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
        // Preview mode
        <SessionPreview 
          settings={sessionSettings} 
          optionsConstants={{
            SESSION_TYPE_OPTIONS,
            TOPIC_CATEGORIES,
            DIFFICULTY_LEVELS,
            RESPONSE_LENGTH_OPTIONS,
            TONE_OPTIONS,
            SKILLS_FOCUS_OPTIONS,
            EVALUATION_CRITERIA
          }}
        />
      ) : (
        // Edit mode - use modular components
        <Box>
          {/* Basic Settings Section */}
          <BasicSettings
            settings={sessionSettings}
            onSettingChange={handleSettingChange}
            onMultiSelectChange={handleMultiSelectChange}
            expandedSection={expandedSection}
            handleAccordionChange={handleAccordionChange}
            optionsConstants={{
              SESSION_TYPE_OPTIONS,
              TOPIC_CATEGORIES,
              DIFFICULTY_LEVELS
            }}
          />

          {/* Conversation Flow Section */}
          <ConversationFlowSettings
            settings={sessionSettings}
            onSettingChange={handleSettingChange}
            onMultiSelectChange={handleMultiSelectChange}
            expandedSection={expandedSection}
            handleAccordionChange={handleAccordionChange}
            optionsConstants={{
              RESPONSE_LENGTH_OPTIONS,
              TONE_OPTIONS,
              SKILLS_FOCUS_OPTIONS
            }}
          />

          {/* Evaluation Settings Section */}
          <EvaluationSettings
            settings={sessionSettings}
            onSettingChange={handleSettingChange}
            onMultiSelectChange={handleMultiSelectChange}
            expandedSection={expandedSection}
            handleAccordionChange={handleAccordionChange}
            optionsConstants={{
              EVALUATION_CRITERIA
            }}
          />

          {/* Advanced Options Section */}
          <AdvancedOptions
            settings={sessionSettings}
            onSettingChange={handleSettingChange}
            onAdvancedSettingChange={handleAdvancedSettingChange}
            expandedSection={expandedSection}
            handleAccordionChange={handleAccordionChange}
            optionsConstants={{
              TOPICAL_GUIDANCE_OPTIONS
            }}
          />
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

export default LLMSessionMaterial;