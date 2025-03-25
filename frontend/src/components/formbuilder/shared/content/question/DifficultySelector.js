// components/formbuilder/shared/DifficultySelector.js
import React from 'react';
import { 
  Box, Typography, FormControl, InputLabel, Select, 
  MenuItem, Chip 
} from "@mui/material";
import GradeIcon from "@mui/icons-material/Grade";

// Define difficulty levels - exported for reuse
export const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy', color: '#4caf50' },
  { value: 'medium', label: 'Medium', color: '#ff9800' },
  { value: 'hard', label: 'Hard', color: '#f44336' },
  { value: 'expert', label: 'Expert', color: '#9c27b0' }
];

// Helper function to get the color for a difficulty level
export const getDifficultyColor = (difficulty) => {
  const level = DIFFICULTY_LEVELS.find(level => level.value === difficulty);
  return level ? level.color : '#757575';
};

const DifficultySelector = ({ 
  difficulty, 
  setDifficulty, 
  totalMarks = 0,
  showTotalMarks = true,
  size = "small"
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
      <FormControl size={size} sx={{ minWidth: 150 }}>
        <InputLabel>Difficulty Level</InputLabel>
        <Select
          value={difficulty}
          label="Difficulty Level"
          onChange={(e) => setDifficulty(e.target.value)}
          sx={{
            '& .MuiSelect-select': {
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }
          }}
        >
          {DIFFICULTY_LEVELS.map((level) => (
            <MenuItem 
              key={level.value} 
              value={level.value}
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: level.color,
                  display: 'inline-block'
                }}
              />
              {level.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      {showTotalMarks && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          bgcolor: 'background.paper',
          border: '1px solid rgba(0, 0, 0, 0.23)',
          borderRadius: 1,
          px: 2,
          py: size === "small" ? 1 : 1.5
        }}>
          <GradeIcon sx={{ color: getDifficultyColor(difficulty) }} />
          <Typography variant="body2">
            Total Points: {totalMarks}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default DifficultySelector;