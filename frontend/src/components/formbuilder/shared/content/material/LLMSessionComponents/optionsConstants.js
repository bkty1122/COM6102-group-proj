// LLMSessionComponents/optionsConstants.js
export const SESSION_TYPE_OPTIONS = [
    { value: "conversation", label: "Interactive Conversation" },
    { value: "question-response", label: "Question & Response" }
  ];
  
  export const RESPONSE_LENGTH_OPTIONS = [
    { value: "brief", label: "Brief (1-2 sentences)" },
    { value: "medium", label: "Medium (3-5 sentences)" },
    { value: "detailed", label: "Detailed (6+ sentences)" },
    { value: "adaptive", label: "Adaptive (varies based on context)" }
  ];
  
  export const TONE_OPTIONS = [
    { value: "friendly", label: "Friendly & Casual" },
    { value: "professional", label: "Professional" },
    { value: "academic", label: "Academic" },
    { value: "socratic", label: "Socratic (question-based)" },
    { value: "challenging", label: "Challenging" }
  ];
  
  export const TOPIC_CATEGORIES = [
    { value: "general", label: "General Conversation" },
    { value: "academic", label: "Academic Discussions" },
    { value: "business", label: "Business & Professional" },
    { value: "daily_life", label: "Daily Life & Routines" },
    { value: "culture", label: "Cultural Topics" },
    { value: "current_events", label: "Current Events" },
    { value: "travel", label: "Travel & Geography" },
    { value: "technology", label: "Technology & Science" }
  ];
  
  export const DIFFICULTY_LEVELS = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
    { value: "expert", label: "Expert" },
    { value: "adaptive", label: "Adaptive (adjusts during conversation)" }
  ];
  
  export const SKILLS_FOCUS_OPTIONS = [
    { value: "speaking", label: "Speaking" },
    { value: "listening", label: "Listening" },
    { value: "vocabulary", label: "Vocabulary Building" },
    { value: "grammar", label: "Grammar Practice" },
    { value: "fluency", label: "Fluency" },
    { value: "pronunciation", label: "Pronunciation" },
    { value: "critical_thinking", label: "Critical Thinking" },
    { value: "persuasion", label: "Persuasion & Argumentation" }
  ];
  
  export const EVALUATION_CRITERIA = [
    { value: "fluency", label: "Fluency" },
    { value: "vocabulary", label: "Vocabulary Usage" },
    { value: "grammar", label: "Grammatical Accuracy" },
    { value: "pronunciation", label: "Pronunciation" },
    { value: "coherence", label: "Coherence" },
    { value: "content", label: "Content Relevance" },
    { value: "engagement", label: "Engagement" },
    { value: "turn_taking", label: "Turn Taking" }
  ];
  
  export const TOPICAL_GUIDANCE_OPTIONS = [
    { value: "strict", label: "Strict (stays strictly on topic)" },
    { value: "moderate", label: "Moderate (allows some exploration)" },
    { value: "flexible", label: "Flexible (follows user's lead)" }
  ];