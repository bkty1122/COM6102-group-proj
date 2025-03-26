// components/AddCategoryDialog.js
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button
} from "@mui/material";

const AddCategoryDialog = ({
  open,
  onClose,
  selectedPath,
  newCategoryId,
  setNewCategoryId,
  newCategoryName,
  setNewCategoryName,
  handleAddRootCategory,
  handleAddChildCategory
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {selectedPath ? "Add Child Category" : "Add Root Category"}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Category ID"
          fullWidth
          value={newCategoryId}
          onChange={(e) => setNewCategoryId(e.target.value)}
          helperText="Unique identifier, lowercase with underscores"
        />
        <TextField
          margin="dense"
          label="Category Name"
          fullWidth
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          helperText="Display name for the category"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={selectedPath ? handleAddChildCategory : handleAddRootCategory}
          variant="contained"
          disabled={!newCategoryId || !newCategoryName}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCategoryDialog;