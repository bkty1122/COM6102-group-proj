// MultimediaMaterial.js
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Paper,
  Divider,
  Grid,
  Button,
  Slider,
  Chip,
  Stack,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Music as AudioIcon,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Edit3,
  Check,
  Trash2,
} from "lucide-react";
import { MediaSelector, MediaPreview, MediaPicker } from "../../media/MediaComponents";

// Image alignment options
const ALIGNMENT_OPTIONS = [
  { value: "center", label: "Center", icon: <AlignCenter size={18} /> },
  { value: "left", label: "Left", icon: <AlignLeft size={18} /> },
  { value: "right", label: "Right", icon: <AlignRight size={18} /> }
];

// Media sizing options
const SIZE_OPTIONS = [
  { value: "small", label: "Small (25%)" },
  { value: "medium", label: "Medium (50%)" },
  { value: "large", label: "Large (75%)" },
  { value: "full", label: "Full Width (100%)" },
  { value: "custom", label: "Custom Size" }
];

// License options
const LICENSE_OPTIONS = [
  { value: "CC BY", label: "CC BY - Attribution" },
  { value: "CC BY-SA", label: "CC BY-SA - Attribution-ShareAlike" },
  { value: "CC BY-ND", label: "CC BY-ND - Attribution-NoDerivs" },
  { value: "CC BY-NC", label: "CC BY-NC - Attribution-NonCommercial" },
  { value: "CC BY-NC-SA", label: "CC BY-NC-SA - Attribution-NonCommercial-ShareAlike" },
  { value: "CC BY-NC-ND", label: "CC BY-NC-ND - Attribution-NonCommercial-NoDerivs" },
  { value: "CC0", label: "CC0 - Public Domain" },
  { value: "All Rights Reserved", label: "All Rights Reserved" },
  { value: "Fair Use", label: "Fair Use" },
  { value: "Public Domain", label: "Public Domain" },
  { value: "Other", label: "Other License" }
];

// Video display options
const VIDEO_DISPLAY_OPTIONS = [
  { value: "normal", label: "Normal Controls" },
  { value: "minimal", label: "Minimal Controls" },
  { value: "autoplay", label: "Autoplay (muted)" },
  { value: "looping", label: "Looping Video" }
];

// Audio player styles
const AUDIO_PLAYER_STYLES = [
  { value: "standard", label: "Standard Player" },
  { value: "minimal", label: "Minimal Player" },
  { value: "waveform", label: "Waveform Visualization" }
];

// Default settings for different media types
const DEFAULT_SETTINGS = {
  common: {
    alignment: "center",
    size: "medium",
    customSize: 50,
    caption: "",
    showBorder: true,
    addAttribution: false,
    attribution: {
      creator: "",
      source: "",
      license: "CC BY"
    }
  },
  image: {
    altText: "",
    cropMode: "none",
    clickToEnlarge: true
  },
  video: {
    displayMode: "normal",
    startTime: 0,
    endTime: null,
    showControls: true,
    autoplay: false,
    muted: false,
    loop: false,
    thumbnailUrl: "",
    showThumbnail: true
  },
  audio: {
    playerStyle: "standard",
    startTime: 0,
    endTime: null,
    showControls: true,
    autoplay: false,
    loop: false,
    showTranscript: false,
    transcript: ""
  }
};

// MaterialMedia component (similar to QuestionMedia but adapted for material context)
const MaterialMedia = ({ 
  media, 
  onMediaChange, 
  label = "Add Media",
  mediaType = "image",
  index = null
}) => {
  const [localMediaDialogOpen, setLocalMediaDialogOpen] = useState(false);
  
  const handleSelectMedia = (selectedMedia) => {
    onMediaChange(selectedMedia);
    setLocalMediaDialogOpen(false);
  };
  
  const handleRemoveMedia = () => {
    onMediaChange(null);
  };
  
  const getMediaTypeIcon = () => {
    switch (mediaType) {
      case 'video': return <VideoIcon size={20} />;
      case 'audio': return <AudioIcon size={20} />;
      default: return <ImageIcon size={20} />;
    }
  };
  
  return (
    <>
      <MediaSelector 
        label={label}
        currentMedia={media}
        onSelectMedia={handleSelectMedia}  // Fix: Pass the handler function directly
        onRemoveMedia={handleRemoveMedia}  // Fix: Pass the handler function directly
      />
      
      <MediaPreview 
        media={media} 
        onRemove={handleRemoveMedia}
      />
      
      {/* Remove the redundant MediaPicker since it's already in MediaSelector */}
    </>
  );
};

const MultimediaMaterial = ({
  materialId,
  order_id,
  onRemove,
  onUpdate,
  defaultTitle = "Multimedia Content",
  defaultShowTitle = true,
  defaultTitleStyle = "h2",
  defaultMedia = null,
  defaultMediaType = "image",
  defaultSettings = null
}) => {
  // Material state
  const [title, setTitle] = useState(defaultTitle);
  const [showTitle, setShowTitle] = useState(defaultShowTitle);
  const [titleStyle, setTitleStyle] = useState(defaultTitleStyle);
  const [media, setMedia] = useState(defaultMedia);
  const [mediaType, setMediaType] = useState(defaultMediaType);
  
  // Initialize settings with defaults and any provided settings
  const [settings, setSettings] = useState(() => {
    const defaultSettingsCopy = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    if (defaultSettings) {
      return {
        common: { ...defaultSettingsCopy.common, ...defaultSettings.common },
        image: { ...defaultSettingsCopy.image, ...defaultSettings.image },
        video: { ...defaultSettingsCopy.video, ...defaultSettings.video },
        audio: { ...defaultSettingsCopy.audio, ...defaultSettings.audio }
      };
    }
    return defaultSettingsCopy;
  });

  // Show advanced settings state
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // State for media picker dialog
  const [localMediaDialogOpen, setLocalMediaDialogOpen] = useState(false);
  
  // Update parent component when settings change
  useEffect(() => {
    if (onUpdate) {
      onUpdate({
        id: materialId,
        type: "multimedia-material",
        order_id,
        title,
        showTitle,
        titleStyle,
        media,
        mediaType,
        settings
      });
    }
  }, [materialId, order_id, title, showTitle, titleStyle, media, mediaType, settings, onUpdate]);

  // Handle common settings changes
  const handleCommonSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      common: {
        ...prev.common,
        [key]: value
      }
    }));
  };

  // Handle type-specific settings changes
  const handleTypeSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [mediaType]: {
        ...prev[mediaType],
        [key]: value
      }
    }));
  };

  // Handle nested attribution changes
  const handleAttributionChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      common: {
        ...prev.common,
        attribution: {
          ...prev.common.attribution,
          [key]: value
        }
      }
    }));
  };

  // Handle media change
  const handleMediaChange = (newMedia) => {
    setMedia(newMedia);
    
    // If new media has appropriate properties, update settings
    if (newMedia) {
      if (mediaType === 'image' && !settings.image.altText && newMedia.filename) {
        // Update alt text with image filename if no alt text is set
        const filename = newMedia.filename.split('.').slice(0, -1).join('.');
        handleTypeSettingChange('altText', filename);
      }
      
      if (mediaType === 'video' && newMedia.duration) {
        // Set end time to full duration for videos
        handleTypeSettingChange('endTime', newMedia.duration);
      }
      
      if (mediaType === 'audio' && newMedia.duration) {
        // Set end time to full duration for audio
        handleTypeSettingChange('endTime', newMedia.duration);
      }
    }
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

  // Handle media type change
  const handleMediaTypeChange = (event, newValue) => {
    if (newValue !== null) {
      setMediaType(newValue);
      // Clear media when changing types
      if (media && media.type !== newValue) {
        setMedia(null);
      }
    }
  };

  // Get appropriate media type label
  const getMediaTypeLabel = () => {
    switch (mediaType) {
      case 'video': return 'Video';
      case 'audio': return 'Audio';
      default: return 'Image';
    }
  };

  // Get appropriate media type icon
  const getMediaTypeIcon = () => {
    switch (mediaType) {
      case 'video': return <VideoIcon size={20} />;
      case 'audio': return <AudioIcon size={20} />;
      default: return <ImageIcon size={20} />;
    }
  };

  // Render media preview based on type and settings
  const renderMediaPreview = () => {
    if (!media) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            height: '200px',
            borderRadius: '8px',
            border: '1px dashed #ccc',
            p: 3
          }}
        >
          {getMediaTypeIcon()}
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            No {mediaType} selected
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => setLocalMediaDialogOpen(true)}
            sx={{ mt: 2 }}
          >
            Select {getMediaTypeLabel()}
          </Button>
        </Box>
      );
    }

    // Calculate width based on size setting
    let width;
    switch (settings.common.size) {
      case 'small':
        width = '25%';
        break;
      case 'medium':
        width = '50%';
        break;
      case 'large':
        width = '75%';
        break;
      case 'full':
        width = '100%';
        break;
      case 'custom':
        width = `${settings.common.customSize}%`;
        break;
      default:
        width = '50%';
    }

    const previewContainerStyle = {
      textAlign: settings.common.alignment,
      mt: 2,
      mb: 3
    };

    const mediaContainerStyle = {
      width: width,
      maxWidth: '100%',
      display: 'inline-block',
      border: settings.common.showBorder ? '1px solid #ddd' : 'none',
      borderRadius: '4px',
      overflow: 'hidden'
    };

    // Media type specific preview
    let mediaPreview;
    
    if (mediaType === 'image') {
      mediaPreview = (
        <Box 
          component="img" 
          src={media.url || media.dataUrl}
          alt={settings.image.altText || 'Image'}
          sx={{ 
            width: '100%',
            cursor: settings.image.clickToEnlarge ? 'zoom-in' : 'default'
          }}
        />
      );
    } else if (mediaType === 'video') {
      mediaPreview = (
        <Box 
          component="video"
          controls={settings.video.showControls}
          autoPlay={settings.video.autoplay}
          muted={settings.video.muted || settings.video.autoplay}
          loop={settings.video.loop}
          sx={{ width: '100%' }}
          poster={settings.video.showThumbnail ? (settings.video.thumbnailUrl || undefined) : undefined}
        >
          <source src={media.url || media.dataUrl} type={media.mimeType || "video/mp4"} />
          Your browser does not support the video tag.
        </Box>
      );
    } else if (mediaType === 'audio') {
      mediaPreview = (
        <Box sx={{ p: 2, backgroundColor: '#f9f9f9', width: '100%' }}>
          <Box 
            component="audio"
            controls={settings.audio.showControls}
            autoPlay={settings.audio.autoplay}
            loop={settings.audio.loop}
            sx={{ width: '100%' }}
          >
            <source src={media.url || media.dataUrl} type={media.mimeType || "audio/mpeg"} />
            Your browser does not support the audio tag.
          </Box>
          
          {settings.audio.showTranscript && settings.audio.transcript && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #eee' }}>
              <Typography variant="subtitle2" gutterBottom>Transcript:</Typography>
              <Typography variant="body2">{settings.audio.transcript}</Typography>
            </Box>
          )}
        </Box>
      );
    }

    return (
      <Box sx={previewContainerStyle}>
        <Box sx={mediaContainerStyle}>
          {mediaPreview}
        </Box>
        
        {settings.common.caption && (
          <Typography 
            variant="caption" 
            component="div"
            sx={{ 
              mt: 1, 
              fontStyle: 'italic',
              color: 'text.secondary',
              maxWidth: width,
              mx: 'auto'
            }}
          >
            {settings.common.caption}
          </Typography>
        )}

        {settings.common.addAttribution && (
          <Typography 
            variant="caption" 
            component="div"
            sx={{ 
              mt: 0.5, 
              fontSize: '10px',
              color: 'text.disabled',
              maxWidth: width,
              mx: 'auto'
            }}
          >
            {settings.common.attribution.creator && `Creator: ${settings.common.attribution.creator}`}
            {settings.common.attribution.source && ` | Source: ${settings.common.attribution.source}`}
            {settings.common.attribution.license && ` | License: ${settings.common.attribution.license}`}
          </Typography>
        )}
      </Box>
    );
  };

  // Render type-specific settings
  const renderTypeSpecificSettings = () => {
    if (mediaType === 'image') {
      return (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Alt Text (for accessibility):
            </Typography>
            <TextField
              fullWidth
              placeholder="Describe the image for screen readers or helping LLM to read the image and judge"
              value={settings.image.altText}
              onChange={(e) => handleTypeSettingChange('altText', e.target.value)}
              size="small"
              helperText="Provide a description of the image for students using screen readers"
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Switch
              checked={settings.image.clickToEnlarge}
              onChange={(e) => handleTypeSettingChange('clickToEnlarge', e.target.checked)}
              size="small"
            />
            <Typography variant="body2">Enable Click to Enlarge</Typography>
          </Box>
        </Box>
      );
    } 
    
    if (mediaType === 'video') {
      return (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Video Display Options:
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Display Mode</InputLabel>
            <Select
              value={settings.video.displayMode}
              label="Display Mode"
              onChange={(e) => handleTypeSettingChange('displayMode', e.target.value)}
            >
              {VIDEO_DISPLAY_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Switch
                  checked={settings.video.showControls}
                  onChange={(e) => handleTypeSettingChange('showControls', e.target.checked)}
                  size="small"
                />
                <Typography variant="body2">Show Controls</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Switch
                  checked={settings.video.autoplay}
                  onChange={(e) => {
                    const autoplay = e.target.checked;
                    handleTypeSettingChange('autoplay', autoplay);
                    // If autoplay is enabled, also set muted (browser requirement)
                    if (autoplay) {
                      handleTypeSettingChange('muted', true);
                    }
                  }}
                  size="small"
                />
                <Typography variant="body2">
                  Autoplay 
                  {settings.video.autoplay && (
                    <Chip size="small" label="Muted" sx={{ ml: 1, fontSize: '10px' }} />
                  )}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Switch
                  checked={settings.video.muted}
                  onChange={(e) => handleTypeSettingChange('muted', e.target.checked)}
                  size="small"
                  disabled={settings.video.autoplay}
                />
                <Typography variant="body2">Muted</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Switch
                  checked={settings.video.loop}
                  onChange={(e) => handleTypeSettingChange('loop', e.target.checked)}
                  size="small"
                />
                <Typography variant="body2">Loop Video</Typography>
              </Box>
            </Grid>
          </Grid>
          
          {settings.video.displayMode === 'normal' && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Switch
                  checked={settings.video.showThumbnail}
                  onChange={(e) => handleTypeSettingChange('showThumbnail', e.target.checked)}
                  size="small"
                />
                <Typography variant="body2">Show Thumbnail Before Play</Typography>
              </Box>
              
              {settings.video.showThumbnail && (
                <TextField
                  fullWidth
                  label="Thumbnail URL (optional)"
                  value={settings.video.thumbnailUrl}
                  onChange={(e) => handleTypeSettingChange('thumbnailUrl', e.target.value)}
                  size="small"
                  sx={{ mt: 1 }}
                  helperText="Leave empty to use the video's default thumbnail"
                />
              )}
            </Box>
          )}
        </Box>
      );
    }
    
    if (mediaType === 'audio') {
      return (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Audio Player Style:
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Player Style</InputLabel>
            <Select
              value={settings.audio.playerStyle}
              label="Player Style"
              onChange={(e) => handleTypeSettingChange('playerStyle', e.target.value)}
            >
              {AUDIO_PLAYER_STYLES.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Switch
                  checked={settings.audio.showControls}
                  onChange={(e) => handleTypeSettingChange('showControls', e.target.checked)}
                  size="small"
                />
                <Typography variant="body2">Show Controls</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Switch
                  checked={settings.audio.autoplay}
                  onChange={(e) => handleTypeSettingChange('autoplay', e.target.checked)}
                  size="small"
                />
                <Typography variant="body2">Autoplay</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Switch
                  checked={settings.audio.loop}
                  onChange={(e) => handleTypeSettingChange('loop', e.target.checked)}
                  size="small"
                />
                <Typography variant="body2">Loop Audio</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Switch
                  checked={settings.audio.showTranscript}
                  onChange={(e) => handleTypeSettingChange('showTranscript', e.target.checked)}
                  size="small"
                />
                <Typography variant="body2">Show Transcript</Typography>
              </Box>
            </Grid>
          </Grid>
          
          {settings.audio.showTranscript && (
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Audio Transcript"
                multiline
                rows={4}
                value={settings.audio.transcript}
                onChange={(e) => handleTypeSettingChange('transcript', e.target.value)}
                placeholder="Enter transcript text here..."
                helperText="Provide a text transcript of the audio content for accessibility"
              />
            </Box>
          )}
        </Box>
      );
    }
    
    return null;
  };

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
          mb: 3, 
          backgroundColor: '#f8f9ff',
          borderRadius: '8px'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getMediaTypeIcon()}
            {getMediaTypeLabel()} Content
          </Typography>
          
          <ToggleButtonGroup
            value={mediaType}
            exclusive
            onChange={handleMediaTypeChange}
            size="small"
          >
            <ToggleButton value="image">
              <Tooltip title="Image">
                <ImageIcon size={18} />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="video">
              <Tooltip title="Video">
                <VideoIcon size={18} />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="audio">
              <Tooltip title="Audio">
                <AudioIcon size={18} />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        {/* Media selector */}
        <MaterialMedia 
          media={media}
          onMediaChange={handleMediaChange}
          label={`Select ${getMediaTypeLabel()}`}
          mediaType={mediaType}
        />
        
        {/* Media preview */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Preview:
          </Typography>
          {renderMediaPreview()}
        </Box>
        
        {/* Media settings */}
        {media && (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Caption (optional):
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder={`Add a descriptive caption for this ${mediaType}...`}
                value={settings.common.caption}
                onChange={(e) => handleCommonSettingChange('caption', e.target.value)}
                size="small"
              />
            </Box>
            
            {/* Type-specific settings */}
            {renderTypeSpecificSettings()}
            
            {/* Common settings for alignment and size */}
            <Grid container spacing={3} sx={{ mt: 1, mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Media Alignment:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {ALIGNMENT_OPTIONS.map(option => (
                    <Tooltip key={option.value} title={option.label}>
                      <Button
                        variant={settings.common.alignment === option.value ? "contained" : "outlined"}
                        color="primary"
                        onClick={() => handleCommonSettingChange('alignment', option.value)}
                        sx={{ minWidth: '48px', p: 1 }}
                      >
                        {option.icon}
                      </Button>
                    </Tooltip>
                  ))}
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Media Size:
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={settings.common.size}
                    onChange={(e) => handleCommonSettingChange('size', e.target.value)}
                  >
                    {SIZE_OPTIONS.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {settings.common.size === 'custom' && (
                  <Box sx={{ mt: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Slider
                        value={settings.common.customSize}
                        min={10}
                        max={100}
                        step={5}
                        marks={[
                          { value: 25, label: '25%' },
                          { value: 50, label: '50%' },
                          { value: 75, label: '75%' },
                          { value: 100, label: '100%' }
                        ]}
                        onChange={(_, value) => handleCommonSettingChange('customSize', value)}
                      />
                      <Chip 
                        label={`${settings.common.customSize}%`} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </Stack>
                  </Box>
                )}
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Switch
                  checked={settings.common.showBorder}
                  onChange={(e) => handleCommonSettingChange('showBorder', e.target.checked)}
                  size="small"
                />
                <Typography variant="body2">Show Border</Typography>
              </Box>
            </Box>
            
            <Box>
              <Button
                variant="text"
                color="primary"
                onClick={() => setShowAdvanced(!showAdvanced)}
                endIcon={showAdvanced ? <Check size={16} /> : <Edit3 size={16} />}
                sx={{ mb: 2 }}
              >
                {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
              </Button>
              
              {showAdvanced && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Switch
                        checked={settings.common.addAttribution}
                        onChange={(e) => handleCommonSettingChange('addAttribution', e.target.checked)}
                        size="small"
                      />
                      <Typography variant="subtitle2">Add Attribution</Typography>
                    </Box>
                    
                    {settings.common.addAttribution && (
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Creator/Author"
                            value={settings.common.attribution.creator}
                            onChange={(e) => handleAttributionChange('creator', e.target.value)}
                            size="small"
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Source URL"
                            value={settings.common.attribution.source}
                            onChange={(e) => handleAttributionChange('source', e.target.value)}
                            size="small"
                          />
                        </Grid>
                        
                        <Grid item xs={12}>
                          <FormControl fullWidth size="small">
                            <InputLabel>License</InputLabel>
                            <Select
                              value={settings.common.attribution.license}
                              label="License"
                              onChange={(e) => handleAttributionChange('license', e.target.value)}
                            >
                              {LICENSE_OPTIONS.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    )}
                  </Box>
                </Paper>
              )}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Media dialog */}
      <MediaPicker
        open={localMediaDialogOpen}
        onClose={() => setLocalMediaDialogOpen(false)}
        onSelectMedia={handleMediaChange}
        mediaType={mediaType}
      />
      
      {/* Remove button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="outlined" 
          color="error"
          startIcon={<Trash2 size={16} />}
          onClick={onRemove}
        >
          Remove Media Material
        </Button>
      </Box>
    </Box>
  );
};

export default MultimediaMaterial;