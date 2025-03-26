// components/JsonEditorDialog.js
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert
} from "@mui/material";

const JsonEditorDialog = ({
  open,
  onClose,
  jsonValue,
  setJsonValue,
  handleSaveJson
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Edit JSON Configuration</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Be careful when editing JSON directly. Incorrect format may break the system.
        </Alert>
        <TextField
          fullWidth
          multiline
          rows={20}
          value={jsonValue}
          onChange={(e) => setJsonValue(e.target.value)}
          variant="outlined"
          InputProps={{
            sx: { fontFamily: 'monospace' }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSaveJson} variant="contained">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JsonEditorDialog;