-- Main question bank table
CREATE TABLE IF NOT EXISTS question_banks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionbank_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    export_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'draft',
    author_id INTEGER,
    version INTEGER DEFAULT 1
);

-- Pages metadata
CREATE TABLE IF NOT EXISTS question_bank_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionbank_id TEXT NOT NULL,
    page_index INTEGER NOT NULL,
    exam_language TEXT,
    exam_type TEXT,
    component TEXT,
    category TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (questionbank_id) REFERENCES question_banks(questionbank_id),
    UNIQUE (questionbank_id, page_index)
);

-- Cards (parent for both card types)
CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id INTEGER NOT NULL,
    card_type TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (page_id) REFERENCES question_bank_pages(id),
    UNIQUE (page_id, position)
);

-- Single Choice Questions
CREATE TABLE IF NOT EXISTS single_choice_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id TEXT NOT NULL UNIQUE,
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer_id INTEGER,
    correct_answer TEXT,
    instruction TEXT,
    difficulty TEXT,
    marks INTEGER DEFAULT 1,
    options_data TEXT,
    media_data TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id),
    UNIQUE (card_id, order_id)
);

-- Multiple Choice Questions
CREATE TABLE IF NOT EXISTS multiple_choice_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id TEXT NOT NULL UNIQUE,
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer_id INTEGER,
    instruction TEXT,
    difficulty TEXT,
    marks INTEGER DEFAULT 1,
    options_data TEXT,
    correct_answers TEXT,
    media_data TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id),
    UNIQUE (card_id, order_id)
);

-- Fill in the Blank Questions
CREATE TABLE IF NOT EXISTS fill_in_blank_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id TEXT NOT NULL UNIQUE,
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    instruction TEXT,
    difficulty TEXT,
    blanks_data TEXT,
    media_data TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id),
    UNIQUE (card_id, order_id)
);

-- Matching Questions
CREATE TABLE IF NOT EXISTS matching_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id TEXT NOT NULL UNIQUE,
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    instruction TEXT,
    difficulty TEXT,
    options_data TEXT,
    media_data TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id),
    UNIQUE (card_id, order_id)
);

-- Long Text Questions
CREATE TABLE IF NOT EXISTS long_text_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id TEXT NOT NULL UNIQUE,
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    instruction TEXT,
    difficulty TEXT,
    placeholder TEXT,
    rows INTEGER DEFAULT 4,
    suggested_answer TEXT,
    marks INTEGER DEFAULT 1,
    media_data TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id),
    UNIQUE (card_id, order_id)
);

-- Audio Response Questions
CREATE TABLE IF NOT EXISTS audio_response_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id TEXT NOT NULL UNIQUE,
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    instruction TEXT,
    difficulty TEXT,
    max_seconds INTEGER DEFAULT 60,
    marks INTEGER DEFAULT 1,
    allow_rerecording INTEGER DEFAULT 1,
    allow_pause INTEGER DEFAULT 1,
    show_timer INTEGER DEFAULT 1,
    media_data TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id),
    UNIQUE (card_id, order_id)
);

-- Text Material
CREATE TABLE IF NOT EXISTS text_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id TEXT NOT NULL UNIQUE,
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    title TEXT,
    content TEXT,
    show_title INTEGER DEFAULT 1,
    title_style TEXT DEFAULT 'h2',
    is_rich_text INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id),
    UNIQUE (card_id, order_id)
);

-- Multimedia Material
CREATE TABLE IF NOT EXISTS multimedia_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id TEXT NOT NULL UNIQUE,
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    title TEXT,
    show_title INTEGER DEFAULT 1,
    title_style TEXT DEFAULT 'h2',
    media_type TEXT,
    media_data TEXT,
    settings_data TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id),
    UNIQUE (card_id, order_id)
);

-- LLM Session Material
CREATE TABLE IF NOT EXISTS llm_session_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id TEXT NOT NULL UNIQUE,
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    title TEXT,
    show_title INTEGER DEFAULT 1,
    title_style TEXT DEFAULT 'h2',
    session_settings TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id),
    UNIQUE (card_id, order_id)
);

-- LLM Audio Response Questions
CREATE TABLE IF NOT EXISTS llm_audio_response_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id TEXT NOT NULL UNIQUE,
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    instruction TEXT,
    difficulty TEXT,
    max_seconds INTEGER DEFAULT 60,
    marks INTEGER DEFAULT 1,
    allow_rerecording INTEGER DEFAULT 1,
    allow_pause INTEGER DEFAULT 1,
    show_timer INTEGER DEFAULT 1,
    number_of_questions INTEGER DEFAULT 1,
    llm_session_type TEXT,
    linked_llm_session_id TEXT,
    question_specific_settings TEXT,
    media_data TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id),
    UNIQUE (card_id, order_id)
);