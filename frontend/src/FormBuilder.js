import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { TextField, Button, Checkbox, Typography, Box } from "@mui/material";

const initialQuestions = [
  { id: "1", type: "text", label: "Enter your name:" },
  { id: "2", type: "checkbox", label: "Select your preferences:" },
];

const FormBuilder = () => {
  const [questions, setQuestions] = useState(initialQuestions);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reorderedQuestions = Array.from(questions);
    const [movedItem] = reorderedQuestions.splice(result.source.index, 1);
    reorderedQuestions.splice(result.destination.index, 0, movedItem);
    setQuestions(reorderedQuestions);
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Form Builder
      </Typography>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="questions">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {questions.map((question, index) => (
                <Draggable key={question.id} draggableId={question.id} index={index}>
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      sx={{
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        padding: 2,
                        marginBottom: 2,
                        backgroundColor: "#f9f9f9",
                      }}
                    >
                      <Typography variant="h6">{question.label}</Typography>
                      {question.type === "text" && <TextField fullWidth />}
                      {question.type === "checkbox" && (
                        <Checkbox />
                      )}
                    </Box>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <Button
        variant="contained"
        color="primary"
        onClick={() =>
          setQuestions([
            ...questions,
            { id: `${questions.length + 1}`, type: "text", label: "New Question" },
          ])
        }
      >
        Add Question
      </Button>
    </Box>
  );
};

export default FormBuilder;