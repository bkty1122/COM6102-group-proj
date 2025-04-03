// LLMSessionComponents/BasicSettings.js
import React, { useState } from "react";
import {
  Box, Typography, TextField, Grid, FormControl,
  InputLabel, Select, MenuItem, Slider, Accordion,
  AccordionSummary, AccordionDetails, Switch, Tooltip
} from "@mui/material";
import { ChevronDown, Settings, Timer, Info } from "lucide-react";

const BasicSettings = ({ 
  settings, 
  onSettingChange, 
  expandedSection, 
  handleAccordionChange, 
  optionsConstants 
}) => {
  const { SESSION_TYPE_OPTIONS, TOPIC_CATEGORIES, DIFFICULTY_LEVELS } = optionsConstants;

  return (
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
              value={settings.sessionTitle}
              onChange={(e) => onSettingChange('sessionTitle', e.target.value)}
              helperText="Title visible to students"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Session Description"
              variant="outlined"
              value={settings.sessionDescription}
              onChange={(e) => onSettingChange('sessionDescription', e.target.value)}
              multiline
              rows={2}
              helperText="Brief description of this conversation activity"
            />
          </Grid>
          
          {/* Session Type - NEW FIELD */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Session Type</InputLabel>
              <Select
                value={settings.sessionType}
                label="Session Type"
                onChange={(e) => onSettingChange('sessionType', e.target.value)}
              >
                {SESSION_TYPE_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {settings.sessionType === "conversation" 
                  ? "Interactive back-and-forth conversation between student and AI" 
                  : "Simple question-answer format without extended conversation"}
              </Typography>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Topic Category</InputLabel>
              <Select
                value={settings.topicCategory}
                label="Topic Category"
                onChange={(e) => onSettingChange('topicCategory', e.target.value)}
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
                value={settings.difficultyLevel}
                label="Difficulty Level"
                onChange={(e) => onSettingChange('difficultyLevel', e.target.value)}
              >
                {DIFFICULTY_LEVELS.map(option => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Added Preparation Time Settings */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Timer size={18} />
                Enable Preparation Time
                <Tooltip title="Allow students time to prepare before the conversation starts">
                  <Info size={16} />
                </Tooltip>
              </Typography>
              <Switch
                checked={settings.enablePreparation}
                onChange={(e) => onSettingChange('enablePreparation', e.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
              />
            </Box>
            
            {settings.enablePreparation && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Preparation Time (seconds)
                  </Typography>
                  <Slider
                    value={settings.preparationTime}
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
                    onChange={(_, value) => onSettingChange('preparationTime', value)}
                  />
                </Box>
                
                <TextField
                  fullWidth
                  label="Preparation Instructions"
                  variant="outlined"
                  value={settings.preparationInstructions}
                  onChange={(e) => onSettingChange('preparationInstructions', e.target.value)}
                  multiline
                  rows={2}
                  helperText="Instructions shown during the preparation phase"
                />
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Session Duration (minutes)
              </Typography>
              <Slider
                value={settings.sessionDuration}
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
                onChange={(_, value) => onSettingChange('sessionDuration', value)}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Maximum {settings.sessionType === "conversation" ? "Conversation Turns" : "Questions"}
              </Typography>
              <Slider
                value={settings.maxTurns}
                min={1}
                max={20}
                step={1}
                marks={[
                  { value: 1, label: '1' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' },
                  { value: 15, label: '15' },
                  { value: 20, label: '20' },
                ]}
                valueLabelDisplay="auto"
                onChange={(_, value) => onSettingChange('maxTurns', value)}
              />
            </Box>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default BasicSettings;