export const exportFormAsJson = (pages) => {
  try {
    // Create a structured representation of your form data
    const formData = {
      title: "Form Builder Export",
      exportDate: new Date().toISOString(),
      pages: pages.map((page, pageIndex) => {
        // Extract essential data from each page
        // Include the page metadata like examCategories
        return {
          page_index: page.id || pageIndex,
          exam_categories: page.examCategories || {}, // Include exam categories
          exam_language: page.language || "en", // Include exam language with default
          cards: page.cards.map((cardType, cardIndex) => {
            // Get contents for this card
            const contents = page.cardContents?.[cardType] || [];
            
            return {
              card_type: cardType,
              position: cardIndex,
              contents: contents.map(content => {
                return {
                  // ...baseContent,
                  ...content
                };
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
    link.download = `form-export-${new Date().toISOString().slice(0, 10)}.json`;
    
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