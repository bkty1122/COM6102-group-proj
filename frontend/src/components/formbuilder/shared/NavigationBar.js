import React, { useState } from "react";
import { AppBar, Toolbar, IconButton, Typography, Box, Button } from "@mui/material";
import { Plus, Trash2 } from "lucide-react"; // Import "plus" and "delete" icons from lucide-react

const NavigationBar = ({ pages, currentPage, setCurrentPage, addPage, deletePage }) => {
  return (
    <AppBar position="static" color="default" sx={{
         mb: 2,
         boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
         }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Page Navigation
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {pages.map((page, index) => (
            <Button
              key={index}
              variant={index === currentPage ? "contained" : "outlined"}
              color={index === currentPage ? "primary" : "default"}
              onClick={() => setCurrentPage(index)} // Navigate to the selected page
            >
              Page {index + 1}
            </Button>
          ))}
        </Box>
        <IconButton color="primary" onClick={addPage} sx={{ ml: 2 }}>
          <Plus />
        </IconButton>
        <IconButton
          color="secondary"
          onClick={deletePage}
          disabled={pages.length === 1} // Disable delete if only one page exists
        >
          <Trash2 />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default NavigationBar;