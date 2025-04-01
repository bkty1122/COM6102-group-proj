// src/components/formbuilder/hooks/useFormBuilder.js
import { useState, useEffect, useCallback, useRef } from "react";
import AnswerIdManager from '../utils/answerIdManager';

export default function useFormBuilder() {
  const [pages, setPages] = useState([
    { 
      id: 1, 
      cards: [], 
      cardContents: {}, 
      examCategories: {
        exam_language: "en", // Default language
        exam_type: "",
        component: "",
        category: ""
      }
    },
  ]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Use a ref to track if initialization has happened
  const initialized = useRef(false);
  
  // Initialize the AnswerIdManager only once
  useEffect(() => {
    if (!initialized.current) {
      AnswerIdManager.initialize(pages);
      initialized.current = true;
    }
  }, []);

  // Remove the debug logging effect that was causing re-renders
  
  // Memoize functions to prevent recreation on every render
  const addPage = useCallback(() => {
    setPages(prevPages => [
      ...prevPages,
      { 
        id: prevPages.length + 1, 
        cards: [], 
        cardContents: {},
        examCategories: {
          exam_language: "en", // Default language
          exam_type: "",
          component: "",
          category: ""
        }
      }
    ]);
    setCurrentPage(prevPages => prevPages.length);
  }, []);

  const deletePage = useCallback(() => {
    if (pages.length > 1) {
      setPages(prevPages => prevPages.filter((_, index) => index !== currentPage));
      setCurrentPage(prev => (prev > 0 ? prev - 1 : 0));
    }
  }, [pages.length, currentPage]);

  // Add this new function to update page metadata
  const updatePageMetadata = useCallback((pageId, metadata) => {
    console.log("Updating metadata for page", pageId, metadata);
    
    setPages(prevPages => 
      prevPages.map(page => {
        if (page.id === pageId) {
          // Handle examCategories specially to ensure proper nesting
          if (metadata.examCategories) {
            // Create a new object with all existing page properties
            const updatedPage = { ...page };
            
            // Properly merge the examCategories object
            updatedPage.examCategories = {
              ...updatedPage.examCategories, // Keep existing categories
              ...metadata.examCategories     // Add/update with new categories
            };
            
            // Remove examCategories from metadata to avoid double-application
            const { examCategories, ...otherMetadata } = metadata;
            
            // Apply any other metadata updates
            return { ...updatedPage, ...otherMetadata };
          }
          
          // If no examCategories in the update, just do a regular merge
          return { ...page, ...metadata };
        }
        return page;
      })
    );
  }, []);  // Empty dependency array means this function won't change between renders

  const addCard = useCallback((type) => {
    setPages(prevPages => {
      const currentPageData = prevPages[currentPage] || { cards: [], cardContents: {} };
      const currentCards = currentPageData.cards || [];
      
      const alreadyHasType = currentCards.includes(type);
      const hasMaxCards = currentCards.length >= 2;
      
      if (alreadyHasType || hasMaxCards) {
        return prevPages; // Return original state if conditions aren't met
      }
      
      return prevPages.map((page, index) => {
        if (index !== currentPage) return page;
        
        return {
          ...page,
          cards: [...page.cards, type],
          cardContents: {
            ...page.cardContents,
            [type]: []
          }
        };
      });
    });
  }, [currentPage]);

  const removeCardContent = useCallback((cardType, contentId) => {
    setPages(prevPages => {
      return prevPages.map((page, index) => {
        if (index !== currentPage) return page;
        
        if (!page.cardContents[cardType]) return page;
        
        const updatedContents = page.cardContents[cardType].filter(
          content => content.id !== contentId
        );
        
        return {
          ...page,
          cardContents: {
            ...page.cardContents,
            [cardType]: updatedContents
          }
        };
      });
    });
  }, [currentPage]);

  const removeCard = useCallback((type) => {
    setPages(prevPages => {
      return prevPages.map((page, index) => {
        if (index !== currentPage) return page;
        
        const { [type]: removedContent, ...remainingContents } = page.cardContents;
        
        return {
          ...page,
          cards: page.cards.filter(card => card !== type),
          cardContents: remainingContents
        };
      });
    });
  }, [currentPage]);

  const addCardContent = useCallback((cardType, contentType) => {
    setPages(prevPages => {
      return prevPages.map((page, index) => {
        if (index !== currentPage) return page;
        
        const currentContents = page.cardContents[cardType] || [];
        const contentId = `${contentType}-${Date.now()}`;
        
        let newContent = {
          id: contentId,
          type: contentType,
          order_id: currentContents.length,
        };
        
        if (contentType === 'single-choice') {
          const newAnswerId = AnswerIdManager.getNextId();
          
          newContent = {
            ...newContent,
            answer_id: newAnswerId,
            question: 'Enter your question here...',
            options: [
              { 
                id: 0, 
                answer_id: newAnswerId,
                option_value: 'Option 1',
                option_image: null,
                option_audio: null,
                option_video: null 
              },
              { 
                id: 1, 
                answer_id: newAnswerId,
                option_value: 'Option 2',
                option_image: null,
                option_audio: null,
                option_video: null 
              },
              { 
                id: 2, 
                answer_id: newAnswerId,
                option_value: 'Option 3',
                option_image: null,
                option_audio: null,
                option_video: null 
              }
            ],
            correctAnswer: null
          };
        } 
        else if (contentType === 'fill-in-the-blank') {
          const firstBlankAnswerId = AnswerIdManager.getNextId();
          
          newContent = {
            ...newContent,
            question: 'Enter your question with [blank_1] placeholders...',
            blanks: [{
              id: 0,
              answer_id: firstBlankAnswerId,
              placeholder: '[blank_1]',
              correctAnswers: ['']
            }]
          };
        }
        
        const newContents = [...currentContents, newContent];
        
        return {
          ...page,
          cardContents: {
            ...page.cardContents,
            [cardType]: newContents
          }
        };
      });
    });
  }, [currentPage]);

  // Create a debounced update function to batch frequent updates
  const debouncedUpdateRef = useRef(null);
  
  const updateCardContent = useCallback((cardType, updatedContent) => {
    // Clear any existing timeout
    if (debouncedUpdateRef.current) {
      clearTimeout(debouncedUpdateRef.current);
    }
    
    // Schedule the update after a short delay to batch multiple rapid updates
    debouncedUpdateRef.current = setTimeout(() => {
      // Update AnswerIdManager with any new answer_ids from this content
      if (updatedContent.answer_id !== undefined) {
        AnswerIdManager.reserveId(updatedContent.answer_id);
      }
      
      // For fill-in-the-blank, check all blanks
      if (updatedContent.type === 'fill-in-the-blank' && updatedContent.blanks) {
        updatedContent.blanks.forEach(blank => {
          if (blank.answer_id !== undefined) {
            AnswerIdManager.reserveId(blank.answer_id);
          }
        });
      }
      
      setPages(prevPages => {
        return prevPages.map((page, index) => {
          if (index !== currentPage) return page;
          
          if (!page.cardContents[cardType]) return page;
          
          const updatedContents = page.cardContents[cardType].map(content => {
            if (content.id === updatedContent.id) {
              const newContent = JSON.parse(JSON.stringify(content));
              
              const answer_id = updatedContent.answer_id !== undefined 
                ? updatedContent.answer_id 
                : content.answer_id;
              
              Object.keys(updatedContent).forEach(key => {
                if (key === 'question_image' || key === 'question_audio' || key === 'question_video') {
                  if (updatedContent[key]) {
                    newContent[key] = JSON.parse(JSON.stringify(updatedContent[key]));
                  } else {
                    newContent[key] = null;
                  }
                } 
                else if (key === 'options' && Array.isArray(updatedContent.options)) {
                  newContent.options = updatedContent.options.map(option => {
                    if (typeof option === 'string') {
                      return {
                        option_value: option,
                        answer_id: answer_id,
                        option_image: null,
                        option_audio: null,
                        option_video: null
                      };
                    }
                    
                    const optionCopy = { ...option };
                    optionCopy.answer_id = answer_id;
                    
                    if (option.option_image) {
                      optionCopy.option_image = JSON.parse(JSON.stringify(option.option_image));
                    }
                    if (option.option_audio) {
                      optionCopy.option_audio = JSON.parse(JSON.stringify(option.option_audio));
                    }
                    if (option.option_video) {
                      optionCopy.option_video = JSON.parse(JSON.stringify(option.option_video));
                    }
                    
                    return optionCopy;
                  });
                }
                else if (key === 'blanks' && Array.isArray(updatedContent.blanks)) {
                  newContent.blanks = updatedContent.blanks.map(blank => {
                    if (blank.answer_id === undefined) {
                      blank.answer_id = AnswerIdManager.getNextId();
                    } else {
                      AnswerIdManager.reserveId(blank.answer_id);
                    }
                    
                    return JSON.parse(JSON.stringify(blank));
                  });
                }
                else {
                  newContent[key] = updatedContent[key];
                }
              });
              
              if (newContent.type === 'single-choice') {
                newContent.answer_id = answer_id;
                
                if (newContent.options) {
                  newContent.options = newContent.options.map(option => ({
                    ...option,
                    answer_id: answer_id
                  }));
                }
              }
              
              return newContent;
            }
            return content;
          });
          
          return {
            ...page,
            cardContents: {
              ...page.cardContents,
              [cardType]: updatedContents
            }
          };
        });
      });
      
      debouncedUpdateRef.current = null;
    }, 50); // 50ms debounce
  }, [currentPage]);

  const reorderContent = useCallback((cardType, contentId, direction, targetIndex) => {
    setPages(prevPages => {
      return prevPages.map((page, index) => {
        if (index !== currentPage) return page;
        
        const cardContents = page.cardContents[cardType] || [];
        if (cardContents.length <= 1) return page;
        
        const contentIndex = cardContents.findIndex(item => item.id === contentId);
        if (contentIndex === -1) return page;
        
        let newIndex;
        if (direction === 'up') {
          newIndex = Math.max(0, contentIndex - 1);
        } else if (direction === 'down') {
          newIndex = Math.min(cardContents.length - 1, contentIndex + 1);
        } else if (direction === 'custom' && typeof targetIndex === 'number') {
          newIndex = targetIndex;
        } else {
          return page;
        }
        
        if (newIndex === contentIndex) return page;
        
        const newContents = [...cardContents];
        const [removed] = newContents.splice(contentIndex, 1);
        newContents.splice(newIndex, 0, removed);
        
        const updatedContents = newContents.map((item, idx) => ({
          ...item,
          order_id: idx,
        }));
        
        return {
          ...page,
          cardContents: {
            ...page.cardContents,
            [cardType]: updatedContents
          }
        };
      });
    });
  }, [currentPage]);

  const reorderCards = useCallback((sourceIndex, destinationIndex) => {
    if (sourceIndex === destinationIndex) {
      return;
    }
    
    setPages(prevPages => {
      const page = prevPages[currentPage];
      if (!page) return prevPages;
      
      const newCards = [...page.cards];
      const [movedCard] = newCards.splice(sourceIndex, 1);
      newCards.splice(destinationIndex, 0, movedCard);
      
      return prevPages.map((p, idx) => 
        idx === currentPage ? { ...p, cards: newCards } : p
      );
    });
  }, [currentPage]);

  // Update the loadFormData function to ensure examCategories is preserved
  const loadFormData = useCallback((formData) => {
    if (!formData || !formData.pages) {
      console.error("Invalid form data provided");
      return;
    }
    
    // Ensure each page has examCategories
    const pagesWithCategories = formData.pages.map(page => ({
      ...page,
      examCategories: page.examCategories || { exam_language: "en" }
    }));
    
    setPages(pagesWithCategories);
    AnswerIdManager.initialize(pagesWithCategories);
    setCurrentPage(0);
  }, []);

  // Get the current page data safely
  const currentPageData = pages[currentPage] || { cards: [], cardContents: {} };

  // Memoized next answer ID to avoid re-renders
  const nextAnswerId = AnswerIdManager.getCurrentNextId();

  return {
    pages,
    setPages,
    currentPage,
    setCurrentPage,
    isDragging,
    setIsDragging,
    currentPageData,
    nextAnswerId,
    addPage,
    deletePage,
    addCard,
    removeCard,
    addCardContent,
    removeCardContent,
    updateCardContent,
    reorderContent,
    reorderCards,
    loadFormData,
    updatePageMetadata  // Include the new function here
  };
}