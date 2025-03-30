// LLMSessionComponents/EvaluationSettings.js
import React from "react";
import {
  Box, Typography, Grid, Switch, Chip, Alert,
  Accordion, AccordionSummary, AccordionDetails
} from "@mui/material";
import { ChevronDown, CheckSquare } from "lucide-react";

const EvaluationSettings = ({ 
  settings, 
  onSettingChange,
  onMultiSelectChange,
  expandedSection, 
  handleAccordionChange,
  optionsConstants
}) => {
  const { EVALUATION_CRITERIA } = optionsConstants;

  return (
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
              <Typography variant="subtitle1">Enable {settings.sessionType === "conversation" ? "Session" : "Response"} Evaluation</Typography>
              <Switch
                checked={settings.evaluationEnabled}
                onChange={(e) => onSettingChange('evaluationEnabled', e.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
              />
            </Box>
          </Grid>
          
          {settings.evaluationEnabled && (
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
                      color={settings.evaluationCriteria.includes(criterion.value) ? "primary" : "default"}
                      onClick={() => onMultiSelectChange('evaluationCriteria', criterion.value)}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Alert severity="info" sx={{ my: 1 }}>
                  <Typography variant="body2">
                    The LLM will provide feedback based on the selected criteria after the {settings.sessionType === "conversation" ? "session ends" : "student responds"}.
                  </Typography>
                </Alert>
              </Grid>
            </>
          )}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default EvaluationSettings;