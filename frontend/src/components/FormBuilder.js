import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableItem from "./SortableItem"; // Custom sortable item component
import { TextField, Button, Typography, Box } from "@mui/material";

const initialQuestions = [
  { id: "1", type: "text", label: "Enter your name:" },
  { id: "2", type: "checkbox", label: "Select your preferences:" },
];

const FormBuilder = () => {
  const [questions, setQuestions] = useState(initialQuestions);

  // Sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor), // For mouse/touch support
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Form Builder
      </Typography>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={questions.map((question) => question.id)}
          strategy={verticalListSortingStrategy}
        >
          {questions.map((question) => (
            <SortableItem key={question.id} id={question.id} question={question} />
          ))}
        </SortableContext>
      </DndContext>
      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
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