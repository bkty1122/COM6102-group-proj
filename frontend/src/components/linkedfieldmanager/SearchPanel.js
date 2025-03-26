// components/SearchPanel.js
import React from "react";
import {
  Box,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText
} from "@mui/material";
import { Search } from "lucide-react";

const SearchPanel = ({
  searchQuery,
  setSearchQuery,
  searchResults,
  handleSearch,
  flattenedHierarchy,
  setSelectedPath,
  setSelectedNode,
  setSearchResults
}) => {
  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <TextField
        fullWidth
        placeholder="Search categories and options..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          handleSearch(e.target.value);
        }}
        InputProps={{
          startAdornment: <Search size={16} style={{ marginRight: 8 }} />,
          sx: { borderRadius: '8px' }
        }}
      />
      
      {searchResults.length > 0 && (
        <Paper elevation={1} sx={{ mt: 1, maxHeight: '300px', overflow: 'auto' }}>
          <List dense>
            {searchResults.map(result => (
              <ListItem 
                key={result.path} 
                button
                onClick={() => {
                  setSelectedPath(result.path);
                  // Need to find the actual node from the path
                  const parts = result.path.split('.');
                  const lastPart = parts[parts.length - 1];
                  setSelectedNode({ id: lastPart, label: result.label });
                  setSearchQuery("");
                  setSearchResults([]);
                }}
              >
                <ListItemText 
                  primary={result.label} 
                  secondary={result.path} 
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default SearchPanel;