// src/components/formbuilder/hooks/useQuestionMedia.js
import { useState, useCallback } from 'react';
import { extractMediaUrl } from '../utils/mediaUtils';

export const useQuestionMedia = (initialQuestionMedia = null, initialOptionMedia = {}) => {
  const [questionMedia, setQuestionMedia] = useState(initialQuestionMedia);
  const [optionMedia, setOptionMedia] = useState(initialOptionMedia || {});
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState({ type: null, index: null });

  // Open media picker
  const openMediaPicker = useCallback((type, index = null) => {
    setMediaTarget({ type, index });
    setMediaDialogOpen(true);
  }, []);

  // Handle media selection
  const handleMediaSelect = useCallback((media) => {
    // Extract just the URL from the media object
    const mediaUrl = extractMediaUrl(media);
    
    if (mediaTarget.type === 'question') {
      setQuestionMedia(mediaUrl);
    } else if (mediaTarget.type === 'option' && mediaTarget.index !== null) {
      setOptionMedia(prev => ({
        ...prev,
        [mediaTarget.index]: mediaUrl
      }));
    }
    setMediaDialogOpen(false);
  }, [mediaTarget]);

  // Handle media change from QuestionMedia component
  const handleMediaChange = useCallback((type, media, index = null) => {
    // Extract just the URL from the media object
    const mediaUrl = extractMediaUrl(media);
    
    if (type === 'question') {
      setQuestionMedia(mediaUrl);
    } else if (type === 'option' && index !== null) {
      if (mediaUrl === null) {
        // Remove media for this option
        setOptionMedia(prev => {
          const newOptionMedia = { ...prev };
          delete newOptionMedia[index];
          return newOptionMedia;
        });
      } else {
        // Set media for this option
        setOptionMedia(prev => ({
          ...prev,
          [index]: mediaUrl
        }));
      }
    }
  }, []);

  // Remove media
  const removeMedia = useCallback((type, index = null) => {
    if (type === 'question') {
      setQuestionMedia(null);
    } else if (type === 'option' && index !== null) {
      setOptionMedia(prev => {
        const newOptionMedia = { ...prev };
        delete newOptionMedia[index];
        return newOptionMedia;
      });
    }
  }, []);

  // Reindex option media when options are removed or reordered
  const reindexOptionMedia = useCallback((removedIndex) => {
    const updatedOptionMedia = {};
    
    Object.keys(optionMedia).forEach(key => {
      const keyIndex = parseInt(key);
      if (keyIndex > removedIndex) {
        updatedOptionMedia[keyIndex - 1] = optionMedia[keyIndex];
      } else if (keyIndex !== removedIndex) {
        updatedOptionMedia[keyIndex] = optionMedia[keyIndex];
      }
    });
    
    setOptionMedia(updatedOptionMedia);
  }, [optionMedia]);

  return {
    questionMedia,
    optionMedia,
    mediaDialogOpen,
    mediaTarget,
    setQuestionMedia,
    setOptionMedia,
    openMediaPicker,
    setMediaDialogOpen,
    handleMediaSelect,
    handleMediaChange,
    removeMedia,
    reindexOptionMedia
  };
};

export default useQuestionMedia;