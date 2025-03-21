// src/components/formbuilder/shared/useMediaSelection.js
import { useState } from 'react';

const useMediaSelection = (defaultMedia = null) => {
  const [media, setMedia] = useState(defaultMedia);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState({ type: null, index: null });

  const openMediaPicker = (type, index = null) => {
    setMediaTarget({ type, index });
    setDialogOpen(true);
  };

  const handleMediaSelect = (selectedMedia) => {
    if (mediaTarget.type === 'main') {
      setMedia(selectedMedia);
    } else if (typeof mediaTarget.handler === 'function') {
      mediaTarget.handler(selectedMedia, mediaTarget.index);
    }
  };

  const removeMedia = () => {
    setMedia(null);
  };

  return {
    media,
    setMedia,
    dialogOpen,
    setDialogOpen,
    openMediaPicker,
    handleMediaSelect,
    removeMedia,
    mediaTarget
  };
};

export default useMediaSelection;