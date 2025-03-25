// MaterialTypeMap.js
import { Typography } from "@mui/material";
import TextMaterial from "./content/material/TextMaterial";

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
  }
  // Add future material types here, such as:
  // "image-material": { ... }
  // "video-material": { ... }
  // "audio-material": { ... }
  // "interactive-material": { ... }
};

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
  
  // Add media props for types that support them
  if (normalizedContent.type === 'text-material') {
    // No specific props needed for text materials beyond the defaults
  }
  // For future material types, add their specific props here
  
  // Override defaults with content values
  const overrideProps = {};
  
  // Add type-specific override props
  if (normalizedContent.type === 'text-material') {
    overrideProps.defaultTitle = normalizedContent.title || defaultProps.defaultTitle;
    overrideProps.defaultContent = normalizedContent.content || defaultProps.defaultContent;
    overrideProps.defaultShowTitle = normalizedContent.showTitle !== undefined ? 
      normalizedContent.showTitle : defaultProps.defaultShowTitle;
    overrideProps.defaultTitleStyle = normalizedContent.titleStyle || defaultProps.defaultTitleStyle;
  }
  // For future material types, add their override props here
  
  // Combine all props
  const combinedProps = {
    ...defaultProps,
    ...commonProps,
    ...specificProps,
    ...overrideProps
  };
  
  return <MaterialComponent {...combinedProps} />;
};