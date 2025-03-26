// utils/hierarchyUtils.js

/**
 * Converts a hierarchical structure to a flat path representation
 * @param {Object} data - The hierarchical data structure
 * @param {string} parentPath - The current parent path
 * @param {Object} result - The accumulator for the result
 * @returns {Object} - Flattened representation of the hierarchy
 */
export const flattenHierarchy = (data, parentPath = "", result = {}) => {
    if (!data) return result;
  
    if (data.options) {
      data.options.forEach(option => {
        const currentPath = parentPath ? `${parentPath}.${option.id}` : option.id;
        result[currentPath] = {
          id: option.id,
          label: option.label,
          parentPath
        };
  
        if (option.children) {
          Object.keys(option.children).forEach(childKey => {
            const childData = option.children[childKey];
            const childParentPath = `${currentPath}.${childKey}`;
            result[childParentPath] = {
              id: childKey,
              label: childData.label,
              parentPath: currentPath
            };
  
            flattenHierarchy(childData, childParentPath, result);
          });
        }
      });
    }
  
    return result;
  };
  
  /**
   * Find a category in the hierarchy by its ID
   * @param {Object} hierarchy - The full hierarchy object
   * @param {string} categoryId - The ID of the category to find
   * @returns {Object|null} - The category object if found, null otherwise
   */
  export const findCategoryInHierarchy = (hierarchy, categoryId) => {
    // Check if it's a root category
    if (hierarchy[categoryId]) {
      return hierarchy[categoryId];
    }
    
    // Check in nested categories
    for (const rootCat in hierarchy) {
      const result = findNestedCategory(hierarchy[rootCat], categoryId);
      if (result) return result;
    }
    
    return null;
  };
  
  /**
   * Find a nested category within a node
   * @param {Object} node - The node to search in
   * @param {string} categoryId - The ID of the category to find
   * @returns {Object|null} - The category object if found, null otherwise
   */
  export const findNestedCategory = (node, categoryId) => {
    if (!node) return null;
    
    if (node.options) {
      for (const option of node.options) {
        if (option.children && option.children[categoryId]) {
          return option.children[categoryId];
        }
        
        // Recursively check in children
        for (const childCat in option.children || {}) {
          const result = findNestedCategory(option.children[childCat], categoryId);
          if (result) return result;
        }
      }
    }
    
    return null;
  };
  
  /**
   * Find an option in a category by its ID
   * @param {Object} hierarchy - The full hierarchy object
   * @param {string} categoryId - The ID of the category
   * @param {string} optionId - The ID of the option to find
   * @returns {Object|null} - The option object if found, null otherwise
   */
  export const findOptionInCategory = (hierarchy, categoryId, optionId) => {
    const category = findCategoryInHierarchy(hierarchy, categoryId);
    if (!category || !category.options) return null;
    
    return category.options.find(opt => opt.id === optionId);
  };