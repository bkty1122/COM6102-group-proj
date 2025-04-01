// QuestionTypeMap.js
import { Typography } from "@mui/material";
import SingleChoiceQuestion from "./content/question/SingleChoiceQuestion";
import FillInTheBlankQuestion from "./content/question/FillInTheBlankQuestion";
import MultipleChoiceQuestion from "./content/question/MultipleChoiceQuestion";
import MatchingQuestion from "./content/question/MatchingQuestion";
import LongTextQuestion from "./content/question/LongTextQuestion";
import AudioQuestion from "./content/question/AudioQuestion";

// Question type mapping configuration
export const QUESTION_TYPE_MAP = {
  "single-choice": {
    component: SingleChoiceQuestion,
    defaultProps: {
      defaultQuestion: "Enter your question here...",
      defaultOptions: ["Option 1", "Option 2"],
      defaultInstruction: "Select the correct answer from the options below.",
      defaultDifficulty: 'medium',
      defaultMarks: 1
    }
  },
  "multiple-choice": {
    component: MultipleChoiceQuestion,
    defaultProps: {
      defaultQuestion: "Enter your question here...",
      defaultOptions: ["Option 1", "Option 2"],
      defaultInstruction: "Select all correct answers from the options below.",
      defaultCorrectAnswers: [],
      defaultDifficulty: 'medium',
      defaultMarks: 1
    }
  },
  "fill-in-the-blank": {
    component: FillInTheBlankQuestion,
    defaultProps: {
      defaultQuestion: "Enter your question here...",
      defaultInstruction: "Fill in the blanks with the correct words.",
      defaultDifficulty: 'medium'
    }
  },
  "matching": {
    component: MatchingQuestion,
    defaultProps: {
      defaultQuestion: "Enter your question here...",
      defaultInstruction: "Fill in the blanks with the correct answers below.",
      defaultDifficulty: 'medium'
    }
  },
  "long-text": {
    component: LongTextQuestion,
    defaultProps: {
      defaultQuestion: "Enter your question here...",
      defaultPlaceholder: "Write your answer here...",
      defaultRows: 4,
      defaultSuggestedAnswer: "",
      defaultDifficulty: 'medium',
      defaultMarks: 1,
      defaultInstruction: "Provide a detailed response to the question below."
    }
  },
  "audio": {
    component: AudioQuestion,
    defaultProps: {
      defaultQuestion: "Record your answer to the question below.",
      defaultMaxSeconds: 60,
      defaultDifficulty: 'medium',
      defaultMarks: 1,
      defaultInstruction: "Click the record button and speak your answer clearly.",
      defaultAllowRerecording: true,
      defaultAllowPause: true,
      defaultShowTimer: true
    }
  }
};

// Component for rendering the appropriate question component
export const QuestionComponentRenderer = ({ 
  normalizedContent, 
  questionMedia, 
  optionMedia,
  onRemove,
  handleContentUpdate,
  useAnswerIdManager = true,
  questionTypeMap
}) => {
  // Get question type configuration
  const questionTypeConfig = questionTypeMap[normalizedContent.type];
  
  // If unknown question type, show error message
  if (!questionTypeConfig) {
    return <Typography>Unknown content type: {normalizedContent.type}</Typography>;
  }
  
  // Extract component and default props
  const { component: QuestionComponent, defaultProps } = questionTypeConfig;
  
  // Prepare common props for all question types
  const commonProps = {
    questionId: normalizedContent.id,
    order_id: normalizedContent.order_id,
    onRemove,
    onUpdate: handleContentUpdate,
    useAnswerIdManager
  };
  
  // Build type-specific props
  const specificProps = {};
  
  // Set answer_id based on question type
  if (['single-choice', 'multiple-choice', 'long-text', 'audio'].includes(normalizedContent.type)) {
    specificProps.answer_id = normalizedContent.answer_id;
  } else if (['fill-in-the-blank', 'matching'].includes(normalizedContent.type)) {
    specificProps.startingAnswerId = normalizedContent.answer_id;
  }
  
  // Add media props for types that support them
  if (['single-choice', 'multiple-choice', 'fill-in-the-blank', 'matching', 'long-text', 'audio'].includes(normalizedContent.type)) {
    specificProps.defaultQuestionMedia = questionMedia;
    specificProps.defaultOptionMedia = optionMedia;
  }// Option media is only relevant for choice-based questions
  
  // Override defaults with content values
  const overrideProps = {
    defaultQuestion: normalizedContent.question || normalizedContent.questionText || defaultProps.defaultQuestion,
    defaultDifficulty: normalizedContent.difficulty || defaultProps.defaultDifficulty,
    defaultInstruction: normalizedContent.instruction || defaultProps.defaultInstruction
  };
  
  // Add type-specific override props
  if (normalizedContent.type === 'single-choice') {
    overrideProps.defaultOptions = normalizedContent.options || defaultProps.defaultOptions;
    overrideProps.defaultCorrectAnswer = normalizedContent.correctAnswer;
    overrideProps.defaultMarks = normalizedContent.marks || defaultProps.defaultMarks;
  } 
  else if (normalizedContent.type === 'multiple-choice') {
    overrideProps.defaultOptions = normalizedContent.options || defaultProps.defaultOptions;
    overrideProps.defaultCorrectAnswers = normalizedContent.correctAnswers || defaultProps.defaultCorrectAnswers;
    overrideProps.defaultMarks = normalizedContent.marks || defaultProps.defaultMarks;
  } 
  else if (normalizedContent.type === 'fill-in-the-blank') {
    overrideProps.defaultBlanks = normalizedContent.blanks || normalizedContent.options || [];
  } 
  else if (normalizedContent.type === 'matching') {
    overrideProps.defaultBlanks = normalizedContent.blanks || [];
  } 
  else if (normalizedContent.type === 'long-text') {
    overrideProps.defaultPlaceholder = normalizedContent.placeholder || defaultProps.defaultPlaceholder;
    overrideProps.defaultRows = normalizedContent.rows || defaultProps.defaultRows;
    overrideProps.defaultSuggestedAnswer = normalizedContent.suggestedAnswer || defaultProps.defaultSuggestedAnswer;
    overrideProps.defaultMarks = normalizedContent.marks || defaultProps.defaultMarks;
  } 
  else if (normalizedContent.type === 'audio') {
    overrideProps.defaultMaxSeconds = normalizedContent.maxSeconds || defaultProps.defaultMaxSeconds;
    overrideProps.defaultMarks = normalizedContent.marks || defaultProps.defaultMarks;
    overrideProps.defaultAllowRerecording = normalizedContent.allowRerecording !== false;
    overrideProps.defaultAllowPause = normalizedContent.allowPause !== false;
    overrideProps.defaultShowTimer = normalizedContent.showTimer !== false;
  }
  
  // Combine all props
  const combinedProps = {
    ...defaultProps,
    ...commonProps,
    ...specificProps,
    ...overrideProps
  };
  
  return <QuestionComponent {...combinedProps} />;
};