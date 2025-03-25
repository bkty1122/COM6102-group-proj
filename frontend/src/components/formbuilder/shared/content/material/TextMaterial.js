// TextMaterial.js 
import React, { useState, useEffect, useCallback } from "react";
import { 
  Box, 
  Typography, 
  TextField, 
  Paper, 
  Divider,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
  InputAdornment
} from "@mui/material";
import { 
  TextIcon, 
  Type, 
  Heading, 
  BookOpen,
  InfoIcon
} from "lucide-react";

/**
 * TextMaterial Component
 * 
 * A specialized component for rendering text-based instructional materials
 * like reading passages, explanations, or informational text.
 * 
 * This component is purely for display purposes and doesn't collect student answers.
 * 
 * @param {Object} props Component props
 * @param {string} props.materialId Unique ID for this material
 * @param {number} props.order_id Order within the page
 * @param {string} props.defaultTitle Default title for the material
 * @param {string} props.defaultContent Default content text
 * @param {boolean} props.defaultShowTitle Whether to display the title to students
 * @param {string} props.defaultTitleStyle Style of the title (h1, h2, h3, subtitle)
 * @param {function} props.onUpdate Callback when material is updated
 * @param {function} props.onRemove Callback to remove this material
 */
const TextMaterial = ({
  materialId,
  order_id = 0,
  defaultTitle = "Reading Passage",
  defaultContent = "Enter the text content here. This could be a reading passage, instructions, or explanatory text.",
  defaultShowTitle = true,
  defaultTitleStyle = "h2",
  onUpdate = () => {}
}) => {
  // State for material properties
  const [title, setTitle] = useState(defaultTitle);
  const [content, setContent] = useState(defaultContent);
  const [showTitle, setShowTitle] = useState(defaultShowTitle);
  const [titleStyle, setTitleStyle] = useState(defaultTitleStyle);
  const [isRichText, setIsRichText] = useState(false);
  
  // Update parent component when data changes
  useEffect(() => {
    onUpdate({
      id: materialId,
      type: 'text-material',
      order_id,
      title,
      content,
      showTitle,
      titleStyle,
      isRichText
    });
  }, [materialId, order_id, title, content, showTitle, titleStyle, isRichText, onUpdate]);

  // Helper to get title styling for preview
  const getTitleStyling = useCallback((style) => {
    switch(style) {
      case 'h1':
        return { fontSize: '1.8rem', fontWeight: 'bold', mb: 2 };
      case 'h2':
        return { fontSize: '1.5rem', fontWeight: 'bold', mb: 2 };
      case 'h3':
        return { fontSize: '1.25rem', fontWeight: 'bold', mb: 1.5 };
      case 'subtitle':
        return { fontSize: '1.1rem', fontWeight: 'medium', fontStyle: 'italic', mb: 1.5, color: 'text.secondary' };
      default:
        return { fontSize: '1.5rem', fontWeight: 'bold', mb: 2 };
    }
  }, []);

  // Helper to render title style selector
  const renderTitleStyleSelector = () => {
    const styles = [
      { value: 'h1', label: 'Heading 1 (Large)', icon: <Heading size={16} /> },
      { value: 'h2', label: 'Heading 2 (Medium)', icon: <Heading size={14} /> },
      { value: 'h3', label: 'Heading 3 (Small)', icon: <Heading size={12} /> },
      { value: 'subtitle', label: 'Subtitle', icon: <Type size={14} /> },
    ];

    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 2 }}>
        {styles.map((style) => (
          <Box 
            key={style.value}
            onClick={() => setTitleStyle(style.value)}
            sx={{ 
              border: '1px solid',
              borderColor: titleStyle === style.value ? 'primary.main' : 'divider',
              borderRadius: 1,
              p: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: titleStyle === style.value ? 'primary.lighter' : 'background.paper',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.lightest'
              },
              transition: 'all 0.2s'
            }}
          >
            {style.icon}
            <Typography variant="body2">{style.label}</Typography>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box>
      {/* Debug/metadata information */}
      <Box sx={{ mb: 1, display: "flex", gap: 2, fontSize: "12px", color: "#666" }}>
        <Typography variant="caption">Material ID: {materialId}</Typography>
        <Typography variant="caption">Order: {order_id}</Typography>
        <Typography variant="caption">Type: Text Material</Typography>
      </Box>
      
      {/* Instructions for the component author */}
      <Paper 
        elevation={0} 
        sx={{ 
          mb: 2, 
          p: 1.5, 
          backgroundColor: "#f5f5f5", 
          borderLeft: "4px solid #ff9800"
        }}
      >
        <Typography variant="body2">
          Create a text-based material like a reading passage, instructions, or explanatory text.
          This content is for display only and doesn't collect student answers.
        </Typography>
      </Paper>
      
      {/* Title input */}
      <TextField
        fullWidth
        label="Material Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        margin="normal"
        variant="outlined"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Heading size={18} />
            </InputAdornment>
          ),
        }}
      />
      
      {/* Title display options */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={showTitle}
              onChange={(e) => setShowTitle(e.target.checked)}
              color="primary"
            />
          }
          label="Display title to students"
        />
        
        <Tooltip title="Title style options">
          <IconButton size="small" onClick={() => {}}>
            <Type size={16} />
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* Title style options */}
      {showTitle && renderTitleStyleSelector()}
      
      {/* Content input */}
      <TextField
        fullWidth
        label="Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        margin="normal"
        variant="outlined"
        multiline
        minRows={6}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
              <TextIcon size={18} />
            </InputAdornment>
          ),
        }}
      />
      
      {/* Future feature note */}
      <Paper 
        elevation={0} 
        sx={{ 
          mt: 2,
          mb: 3, 
          p: 1.5, 
          backgroundColor: "#e3f2fd", 
          borderLeft: "4px solid #2196f3",
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1
        }}
      >
        <InfoIcon size={18} style={{ marginTop: '2px' }} />
        <Typography variant="body2">
          Rich text formatting options will be available in a future update, allowing you to add bold, 
          italic, lists, and other formatting to your content.
        </Typography>
      </Paper>
      
      {/* Material Preview */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
        Preview:
      </Typography>
      
      <Paper
        variant="outlined"
        sx={{ 
          p: 3,
          my: 2, 
          borderRadius: 1,
          backgroundColor: '#fff',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <BookOpen size={18} style={{ marginRight: '8px', opacity: 0.7 }} />
          <Typography variant="caption" color="text.secondary">
            Reading Material
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {showTitle && (
          <Typography sx={getTitleStyling(titleStyle)}>
            {title}
          </Typography>
        )}
        
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {content}
        </Typography>
      </Paper>
      
      {/* Design tips */}
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Tips for creating effective reading materials:
        </Typography>
        
        <Box component="ul" sx={{ pl: 2 }}>
          <Typography component="li" variant="body2" color="text.secondary">
            Keep passages concise and focused on the learning objective
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            Consider the reading level of your target audience
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            Break up long text with subheadings or paragraphs for better readability
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            Provide context or background information when necessary
          </Typography>
        </Box>
      </Box>
      
      <Divider sx={{ my: 3 }} />
      
      {/* Additional information */}
      <Box sx={{ 
        p: 2, 
        backgroundColor: '#f5f5f5', 
        borderRadius: 1,
      }}>
        <Typography variant="subtitle2" gutterBottom>
          About Text Materials
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Text materials are display-only content that doesn't require student responses. 
          They're ideal for providing context, instructions, reading passages, or explanatory text 
          before questions or interactive elements.
        </Typography>
      </Box>
    </Box>
  );
};

export default TextMaterial;