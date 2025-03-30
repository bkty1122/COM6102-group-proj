// LLMSessionComponents/AdvancedOptions.js
import React from "react";
import {
  Box, Typography, TextField, Grid, FormControl,
  InputLabel, Select, MenuItem, Slider, Divider, Switch,
  Tooltip, Accordion, AccordionSummary, AccordionDetails
} from "@mui/material";
import { ChevronDown, Settings, Info } from "lucide-react";

const AdvancedOptions = ({ 
  settings, 
  onSettingChange,
  onAdvancedSettingChange,
  expandedSection, 
  handleAccordionChange,
  optionsConstants
}) => {
  const { TOPICAL_GUIDANCE_OPTIONS } = optionsConstants;

  return (
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
              value={settings.systemInstructions}
              onChange={(e) => onSettingChange('systemInstructions', e.target.value)}
              multiline
              rows={4}
              helperText="Instructions for the LLM about how to behave (not shown to students)"
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
                value={settings.responseTimeout}
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
                onChange={(_, value) => onSettingChange('responseTimeout', value)}
              />
            </Box>
          </Grid>
          
          {settings.sessionType === "conversation" && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Topical Guidance</InputLabel>
                <Select
                  value={settings.advancedOptions.topicalGuidance}
                  label="Topical Guidance"
                  onChange={(e) => onAdvancedSettingChange('topicalGuidance', e.target.value)}
                >
                  {TOPICAL_GUIDANCE_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Additional Features</Typography>
            
            <Grid container spacing={2}>
              {settings.sessionType === "conversation" && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Enable follow-up questions</Typography>
                    <Switch
                      checked={settings.advancedOptions.enableFollowUpQuestions}
                      onChange={(e) => onAdvancedSettingChange('enableFollowUpQuestions', e.target.checked)}
                      size="small"
                    />
                  </Box>
                </Grid>
              )}
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Allow users to end early</Typography>
                  <Switch
                    checked={settings.advancedOptions.allowUserToEndEarly}
                    onChange={(e) => onAdvancedSettingChange('allowUserToEndEarly', e.target.checked)}
                    size="small"
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Provide {settings.sessionType === "conversation" ? "conversation" : "response"} hints</Typography>
                  <Switch
                    checked={settings.advancedOptions.provideHints}
                    onChange={(e) => onAdvancedSettingChange('provideHints', e.target.checked)}
                    size="small"
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Record {settings.sessionType === "conversation" ? "conversation" : "response"}</Typography>
                  <Switch
                    checked={settings.advancedOptions.recordConversation}
                    onChange={(e) => onAdvancedSettingChange('recordConversation', e.target.checked)}
                    size="small"
                  />
                </Box>
              </Grid>
              
              {settings.sessionType === "conversation" && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Adaptive difficulty</Typography>
                    <Switch
                      checked={settings.advancedOptions.adaptiveDifficulty}
                      onChange={(e) => onAdvancedSettingChange('adaptiveDifficulty', e.target.checked)}
                      size="small"
                    />
                  </Box>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default AdvancedOptions;