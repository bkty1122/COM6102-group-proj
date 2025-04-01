// components/LinkedFieldsTreeView.js
import React, { useState, useEffect } from "react";
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText, Collapse, Chip } from "@mui/material";
import {
  ChevronDown,
  ChevronRight,
  Layers,
  Tag
} from "lucide-react";

const LinkedFieldsTreeView = ({ data, onNodeSelect }) => {
  const [expanded, setExpanded] = useState({});
  const [categories, setCategories] = useState([]);

  // Update the categories list when data changes
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setCategories(Object.keys(data));
      
      // Auto-expand first category if nothing is expanded yet
      if (Object.keys(expanded).length === 0 && Object.keys(data).length > 0) {
        setExpanded({ [Object.keys(data)[0]]: true });
      }
    } else {
      setCategories([]);
    }
  }, [data]);

  // Toggle expand/collapse state for a node
  const toggleExpand = (path) => {
    setExpanded(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Check if we have data to display
  const hasData = data && Object.keys(data).length > 0;

  // Log the data for debugging
  console.log("TreeView Data:", data);
  console.log("Categories:", categories);

  // If no data is available
  if (!hasData) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No category data available. Add a root category to get started.
        </Typography>
      </Box>
    );
  }

  // Render the root categories
  return (
    <Box sx={{ width: '100%', backgroundColor: 'background.paper' }}>
      <List sx={{ width: '100%', bgcolor: 'background.paper' }} component="nav">
        {categories.map(key => (
          <div key={key}>
            <ListItem 
              button 
              onClick={() => {
                toggleExpand(key);
                onNodeSelect(key, { id: key, label: data[key]?.label || key });
              }}
              sx={{ 
                pl: 1,
                borderLeft: '3px solid transparent',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                  borderLeft: '3px solid #1976d2',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 30 }}>
                {expanded[key] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </ListItemIcon>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Layers size={20} />
              </ListItemIcon>
              <ListItemText primary={data[key]?.label || key} />
            </ListItem>
            
            <Collapse in={expanded[key]} timeout="auto" unmountOnExit>
              {data[key]?.options && (
                <List component="div" disablePadding>
                  {data[key].options.map(option => {
                    const currentPath = `${key}.${option.id}`;
                    const hasChildren = option.children && Object.keys(option.children).length > 0;
                    
                    return (
                      <div key={currentPath}>
                      <ListItem 
                        button 
                        sx={{ 
                          pl: 4,
                          borderLeft: '3px solid transparent',
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.04)',
                            borderLeft: '3px solid #1976d2',
                          },
                        }}
                        onClick={() => {
                          if (hasChildren) {
                            toggleExpand(currentPath);
                          }
                          onNodeSelect(currentPath, option);
                        }}
                      >
                        {hasChildren && (
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            {expanded[currentPath] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                          </ListItemIcon>
                        )}
                        {!hasChildren && <Box sx={{ width: 30 }} />}
                        
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Tag size={20} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {option.label || option.id}
                              {option.linkedTo && (
                                <Chip 
                                  size="small" 
                                  label={option.isLinkedCategory ? "Linked Category" : "Linked"} 
                                  color={option.isLinkedCategory ? "secondary" : "primary"}
                                  sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          }
                          secondary={option.linkedTo ? `↳ ${option.linkedTo}` : null}
                        />
                      </ListItem>
                        
                        {hasChildren && (
                          <Collapse in={expanded[currentPath]} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                              {Object.keys(option.children).map(childKey => {
                                const childPath = `${currentPath}.${childKey}`;
                                const childCategory = option.children[childKey];
                                
                                return (
                                  <div key={childPath}>
                                    <ListItem 
                                      button 
                                      sx={{ 
                                        pl: 7,
                                        borderLeft: '3px solid transparent',
                                        '&:hover': {
                                          bgcolor: 'rgba(0, 0, 0, 0.04)',
                                          borderLeft: '3px solid #1976d2',
                                        },
                                      }}
                                      onClick={() => {
                                        toggleExpand(childPath);
                                        onNodeSelect(childPath, { id: childKey, label: childCategory.label || childKey });
                                      }}
                                    >
                                      <ListItemIcon sx={{ minWidth: 30 }}>
                                        {expanded[childPath] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                      </ListItemIcon>
                                      <ListItemIcon sx={{ minWidth: 40 }}>
                                        <Tag size={20} />
                                      </ListItemIcon>
                                      <ListItemText primary={childCategory.label || childKey} />
                                    </ListItem>
                                    
                                    <Collapse in={expanded[childPath]} timeout="auto" unmountOnExit>
                                      {childCategory.options && childCategory.options.length > 0 && (
                                        <List component="div" disablePadding>
                                          {childCategory.options.map(childOption => {
                                            const optionPath = `${childPath}.${childOption.id}`;
                                            
                                            return (
                                              <ListItem 
                                                key={optionPath}
                                                button 
                                                sx={{ 
                                                  pl: 10,
                                                  borderLeft: '3px solid transparent',
                                                  '&:hover': {
                                                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                                                    borderLeft: '3px solid #1976d2',
                                                  },
                                                }}
                                                onClick={() => onNodeSelect(optionPath, childOption)}
                                              >
                                                <ListItemIcon sx={{ minWidth: 40 }}>
                                                  <Tag size={20} />
                                                </ListItemIcon>
                                                <ListItemText primary={childOption.label || childOption.id} />
                                              </ListItem>
                                            );
                                          })}
                                        </List>
                                      )}
                                    </Collapse>
                                  </div>
                                );
                              })}
                            </List>
                          </Collapse>
                        )}
                      </div>
                    );
                  })}
                </List>
              )}
            </Collapse>
          </div>
        ))}
      </List>
    </Box>
  );
};

export default LinkedFieldsTreeView;