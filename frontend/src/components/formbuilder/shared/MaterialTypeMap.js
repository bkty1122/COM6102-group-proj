// MaterialTypeMap.js
import { Typography } from "@mui/material";
import TextMaterial from "./content/material/TextMaterial";
import LLMSessionMaterial from "./content/material/LLMSessionMaterial";
import MultimediaMaterial from "./content/material/MultimediaMaterial";

// Material type mapping configuration
export const MATERIAL_TYPE_MAP = {
  "text-material": {
    component: TextMaterial,
    defaultProps: {
      defaultTitle: "Reading Passage",
      defaultContent: "Enter the text content here. This could be a reading passage, instructions, or explanatory text.",
      defaultShowTitle: true,
      defaultTitleStyle: "h2"
    }
  },
  "llm-session-material": {
    component: LLMSessionMaterial,
    defaultProps: {
      defaultTitle: "Interactive LLM Session",
      defaultSessionSettings: {
        sessionTitle: "Interactive Conversation Practice",
        sessionDescription: "Practice your conversational skills with our AI assistant.",
        initialQuestion: "Could you introduce yourself and tell me about your interests?",
        sessionDuration: 5, // minutes
        maxTurns: 6,
        responseLength: "medium",
        responseTimeout: 60, // seconds
        toneStyle: "friendly",
        topicCategory: "general",
        difficultyLevel: "intermediate",
        skillsFocus: ["speaking", "listening"],
        forcedTopics: [],
        postInstructions: "Reflect on the conversation. What did you learn from this exchange?",
        evaluationEnabled: true,
        evaluationCriteria: ["fluency", "vocabulary", "grammar"],
        systemInstructions: "You are a helpful conversation partner. Engage the user in a natural dialogue. Ask follow-up questions to keep the conversation flowing. Provide encouragement and gentle corrections when appropriate.",
        advancedOptions: {
          enableFollowUpQuestions: true,
          allowUserToEndEarly: true,
          provideHints: true,
          recordConversation: true,
          topicalGuidance: "moderate",
          adaptiveDifficulty: true
        }
      },
      defaultShowTitle: true,
      defaultTitleStyle: "h2"
    }
  },
  "multimedia-material": {
    component: MultimediaMaterial,
    defaultProps: {
      defaultTitle: "Multimedia Content",
      defaultShowTitle: true,
      defaultTitleStyle: "h2",
      defaultMediaType: "image",
      defaultMedia: null,
      defaultSettings: {
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
      }
    }
  }
};

// Component for rendering the appropriate material component
// Component for rendering the appropriate material component
export const MaterialComponentRenderer = ({ 
  normalizedContent, 
  onRemove,
  handleContentUpdate,
  materialTypeMap
}) => {
  // Get material type configuration
  const materialTypeConfig = materialTypeMap[normalizedContent.type];
  
  // If unknown material type, show error message
  if (!materialTypeConfig) {
    return <Typography>Unknown material type: {normalizedContent.type}</Typography>;
  }
  
  // Extract component and default props
  const { component: MaterialComponent, defaultProps } = materialTypeConfig;
  
  // Prepare common props for all material types
  const commonProps = {
    materialId: normalizedContent.id,
    page_index: normalizedContent.page_index || 0,
    order_id: normalizedContent.order_id,
    onRemove,
    onUpdate: handleContentUpdate
  };
  
  // Build type-specific props based on material type
  const specificProps = {};
  
  // Override defaults with content values
  const overrideProps = {};
  
  // Add type-specific override props
  if (normalizedContent.type === 'text-material') {
    overrideProps.defaultTitle = normalizedContent.title || defaultProps.defaultTitle;
    overrideProps.defaultContent = normalizedContent.content || defaultProps.defaultContent;
    overrideProps.defaultShowTitle = normalizedContent.showTitle !== undefined ? 
      normalizedContent.showTitle : defaultProps.defaultShowTitle;
    overrideProps.defaultTitleStyle = normalizedContent.titleStyle || defaultProps.defaultTitleStyle;
  } else if (normalizedContent.type === 'multimedia-material') {
    overrideProps.defaultTitle = normalizedContent.title || defaultProps.defaultTitle;
    overrideProps.defaultShowTitle = normalizedContent.showTitle !== undefined ? 
      normalizedContent.showTitle : defaultProps.defaultShowTitle;
    overrideProps.defaultTitleStyle = normalizedContent.titleStyle || defaultProps.defaultTitleStyle;
    overrideProps.defaultMediaType = normalizedContent.mediaType || defaultProps.defaultMediaType;
    overrideProps.defaultMedia = normalizedContent.media || defaultProps.defaultMedia;
    
    // Merge settings objects if they exist
    if (normalizedContent.settings) {
      overrideProps.defaultSettings = {
        common: { ...defaultProps.defaultSettings.common, ...normalizedContent.settings?.common },
        image: { ...defaultProps.defaultSettings.image, ...normalizedContent.settings?.image },
        video: { ...defaultProps.defaultSettings.video, ...normalizedContent.settings?.video },
        audio: { ...defaultProps.defaultSettings.audio, ...normalizedContent.settings?.audio }
      };
    }
  } else if (normalizedContent.type === 'llm-session-material') {
    overrideProps.defaultTitle = normalizedContent.title || defaultProps.defaultTitle;
    overrideProps.defaultShowTitle = normalizedContent.showTitle !== undefined ? 
      normalizedContent.showTitle : defaultProps.defaultShowTitle;
    overrideProps.defaultTitleStyle = normalizedContent.titleStyle || defaultProps.defaultTitleStyle;
    
    // Handle session settings - merge default settings with any existing ones
    overrideProps.defaultSessionSettings = {
      ...defaultProps.defaultSessionSettings,
      ...normalizedContent.sessionSettings
    };
    
    // Handle nested advancedOptions if they exist
    if (normalizedContent.sessionSettings?.advancedOptions) {
      overrideProps.defaultSessionSettings.advancedOptions = {
        ...defaultProps.defaultSessionSettings.advancedOptions,
        ...normalizedContent.sessionSettings.advancedOptions
      };
    }
  }
  
  // Combine all props
  const combinedProps = {
    ...defaultProps,
    ...commonProps,
    ...specificProps,
    ...overrideProps
  };
  
  return <MaterialComponent {...combinedProps} />;
};