// src/components/formbuilder/utils/exportUtils.js

export const exportFormAsJson = (pages) => {
    try {
      // Create a structured representation of your form data
      const formData = {
        title: "Form Builder Export",
        exportDate: new Date().toISOString(),
        pages: pages.map((page, pageIndex) => {
          // Extract essential data from each page
          return {
            page_index: page.id || pageIndex,
            cards: page.cards.map((cardType, cardIndex) => {
              // Get contents for this card
              const contents = page.cardContents?.[cardType] || [];
              
              return {
                card_type: cardType,
                position: cardIndex,
                contents: contents.map(content => {
                  // Base content data that all types have
                  // remove answer_id as not all content types have it
                  const baseContent = {
                    content_id: content.id,
                    content_type: content.type,
                    order_id: content.order_id
                  };
                  // Add type-specific data
                  if (content.type === 'single-choice') {
                    return {
                      ...baseContent,
                      answer_id: content.answer_id,
                      question_text: content.question, // Fixed typo
                      option_values: content.options, // Changed to be consistent
                      correct_answer: content.correctAnswer
                    };
                  } else {
                    // Generic fallback for other types
                    return {
                      ...baseContent,
                      ...content
                    };
                  }
                })
              };
            })
          };
        })
      };
      
      // Convert the data to a JSON string with pretty formatting
      const jsonData = JSON.stringify(formData, null, 2);
      
      // Create a blob with the JSON data
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `form-export-${new Date().toISOString().slice(0, 10)}.json`; // Fixed this
      
      // Append the link to the document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Release the URL object
      URL.revokeObjectURL(url);
      
      console.log("Form exported successfully!");
      return true;
    } catch (error) {
      console.error("Error exporting form:", error);
      alert("Failed to export form. See console for details.");
      return false;
    }
  };