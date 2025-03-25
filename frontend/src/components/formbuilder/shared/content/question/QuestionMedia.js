// src/components/formbuilder/shared/QuestionMedia.js
import React, { useState } from "react";
import { MediaSelector, MediaPreview, MediaPicker } from "../../media/MediaComponents";

const QuestionMedia = ({ 
  media, 
  onMediaChange, 
  label = "Add Media",
  type = "question",
  index = null
}) => {
  const [localMediaDialogOpen, setLocalMediaDialogOpen] = useState(false);
  
  const handleSelectMedia = (selectedMedia) => {
    onMediaChange(type, selectedMedia, index);
    setLocalMediaDialogOpen(false);
  };
  
  const handleRemoveMedia = () => {
    onMediaChange(type, null, index);
  };
  
  return (
    <>
      <MediaSelector 
        label={label}
        currentMedia={media}
        onSelectMedia={(media) => onMediaChange(type, media, index)}
        onRemoveMedia={handleRemoveMedia}
      />
      
      <MediaPreview 
        media={media} 
        onRemove={handleRemoveMedia} 
      />
      
      <MediaPicker
        open={localMediaDialogOpen}
        onClose={() => setLocalMediaDialogOpen(false)}
        onSelectMedia={handleSelectMedia}
      />
    </>
  );
};

export default QuestionMedia;