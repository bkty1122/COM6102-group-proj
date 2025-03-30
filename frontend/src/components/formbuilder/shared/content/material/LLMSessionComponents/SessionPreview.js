// LLMSessionComponents/SessionPreview.js
import React from "react";
import {
  Box, Typography, Paper, Chip, Grid
} from "@mui/material";
import { Clock, MessageSquare, Timer, Info, CheckSquare } from "lucide-react";

const SessionPreview = ({ settings, optionsConstants }) => {
  const {
    SESSION_TYPE_OPTIONS,
    TOPIC_CATEGORIES,
    DIFFICULTY_LEVELS,
    RESPONSE_LENGTH_OPTIONS,
    TONE_OPTIONS,
    SKILLS_FOCUS_OPTIONS,
    EVALUATION_CRITERIA
  } = optionsConstants;

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
          {/* Session type chip */}
          <Chip
            label={SESSION_TYPE_OPTIONS.find(t => t.value === settings.sessionType)?.label || settings.sessionType}
            size="small"
            color="primary"
          />
          
          {/* Show preparation time if enabled */}
          {settings.enablePreparation && (
            <Chip
              icon={<Timer size={14} />}
              label={`${Math.floor(settings.preparationTime / 60)}m ${settings.preparationTime % 60}s prep`}
              size="small"
              variant="outlined"
              color="secondary"
            />
          )}
          
          <Chip
            icon={<Clock size={14} />}
            label={`${settings.sessionDuration} min`}
            size="small"
            variant="outlined"
          />
          <Chip
            icon={<MessageSquare size={14} />}
            label={`${settings.maxTurns} ${settings.sessionType === "conversation" ? "turns" : "questions"}`}
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
      
      {/* Show preparation information if enabled */}
      {settings.enablePreparation && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Timer size={18} />
            Preparation Phase:
          </Typography>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              borderRadius: '12px', 
              borderColor: '#e0e0e0',
              backgroundColor: '#fff8e1'
            }}
          >
            <Typography variant="body1" gutterBottom>
              You will have {Math.floor(settings.preparationTime / 60)} minute{settings.preparationTime >= 120 ? 's' : ''} 
              {settings.preparationTime % 60 > 0 ? ` ${settings.preparationTime % 60} seconds` : ''} 
              to prepare before the {settings.sessionType === "conversation" ? "conversation begins" : "question is shown"}.
            </Typography>
            <Typography variant="body2">
              {settings.preparationInstructions}
            </Typography>
          </Paper>
        </Box>
      )}
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
          {settings.sessionType === "conversation" ? "Starting Prompt:" : "Question:"}
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
          {settings.sessionType === "conversation" ? "Session" : "Activity"} Information
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                {settings.sessionType === "conversation" ? "Conversation Type" : "Activity Type"}
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
          After {settings.sessionType === "conversation" ? "Session" : "Response"}:
        </Typography>
        <Typography variant="body2">
          {settings.postInstructions}
        </Typography>
      </Box>
    </Paper>
  );
};

export default SessionPreview;