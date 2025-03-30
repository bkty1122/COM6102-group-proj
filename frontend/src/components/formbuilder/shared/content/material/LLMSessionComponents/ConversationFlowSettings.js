// LLMSessionComponents/ConversationFlowSettings.js
import React, { useState } from "react";
import {
  Box, Typography, TextField, Grid, FormControl,
  InputLabel, Select, MenuItem, Chip, Button, Accordion,
  AccordionSummary, AccordionDetails
} from "@mui/material";
import { ChevronDown, Repeat, PlusCircle } from "lucide-react";

const ConversationFlowSettings = ({ 
  settings, 
  onSettingChange,
  onMultiSelectChange,
  expandedSection, 
  handleAccordionChange,
  optionsConstants
}) => {
  const { RESPONSE_LENGTH_OPTIONS, TONE_OPTIONS, SKILLS_FOCUS_OPTIONS } = optionsConstants;
  const [newTopic, setNewTopic] = useState("");

  // Add a new forced topic
  const handleAddTopic = () => {
    if (newTopic.trim() && !settings.forcedTopics.includes(newTopic.trim())) {
      onSettingChange('forcedTopics', [...settings.forcedTopics, newTopic.trim()]);
      setNewTopic("");
    }
  };

  // Remove a forced topic
  const handleRemoveTopic = (topic) => {
    onSettingChange('forcedTopics', settings.forcedTopics.filter(t => t !== topic));
  };

  return (
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
          {settings.sessionType === "conversation" ? "Conversation Flow Settings" : "Response Settings"}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={settings.sessionType === "conversation" ? "Initial Question / Prompt" : "Question / Prompt"}
              variant="outlined"
              value={settings.initialQuestion}
              onChange={(e) => onSettingChange('initialQuestion', e.target.value)}
              multiline
              rows={2}
              helperText={settings.sessionType === "conversation" 
                ? "The first question or prompt to start the conversation" 
                : "The question or prompt for the student to respond to"}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Response Length</InputLabel>
              <Select
                value={settings.responseLength}
                label="Response Length"
                onChange={(e) => onSettingChange('responseLength', e.target.value)}
              >
                {RESPONSE_LENGTH_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Expected length of student's response
              </Typography>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>
                {settings.sessionType === "conversation" ? "Conversation Tone" : "Response Tone"}
              </InputLabel>
              <Select
                value={settings.toneStyle}
                label={settings.sessionType === "conversation" ? "Conversation Tone" : "Response Tone"}
                onChange={(e) => onSettingChange('toneStyle', e.target.value)}
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
                  color={settings.skillsFocus.includes(skill.value) ? "primary" : "default"}
                  onClick={() => onMultiSelectChange('skillsFocus', skill.value)}
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
          </Grid>
          
          {settings.sessionType === "conversation" && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Forced Topics (LLM must include these topics)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                {settings.forcedTopics.map(topic => (
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
          )}
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Post-Session Instructions"
              variant="outlined"
              value={settings.postInstructions}
              onChange={(e) => onSettingChange('postInstructions', e.target.value)}
              multiline
              rows={2}
              helperText="Instructions shown to students after completing the activity"
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default ConversationFlowSettings;