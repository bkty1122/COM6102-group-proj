-- Main question bank table
CREATE TABLE IF NOT EXISTS question_banks (
    id SERIAL PRIMARY KEY,
    questionbank_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    export_date TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'draft',
    author_id INTEGER,
    version INTEGER DEFAULT 1,
    is_deleted INTEGER DEFAULT 0
);

-- Pages metadata with cascading delete
CREATE TABLE IF NOT EXISTS question_bank_pages (
    id SERIAL PRIMARY KEY,
    questionbank_id TEXT NOT NULL,
    page_index INTEGER NOT NULL,
    exam_language TEXT,
    exam_type TEXT,
    component TEXT,
    category TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER DEFAULT 0,
    FOREIGN KEY (questionbank_id) REFERENCES question_banks(questionbank_id) ON DELETE CASCADE
);

-- Create a unique index that only applies to non-deleted pages
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_pages ON question_bank_pages(questionbank_id, page_index) WHERE is_deleted = 0;

-- Cards with cascading delete
CREATE TABLE IF NOT EXISTS cards (
    id SERIAL PRIMARY KEY,
    page_id INTEGER NOT NULL,
    card_type TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER DEFAULT 0,
    FOREIGN KEY (page_id) REFERENCES question_bank_pages(id) ON DELETE CASCADE
);

-- Create a unique index that only applies to non-deleted cards
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_cards ON cards(page_id, position) WHERE is_deleted = 0;

-- Single Choice Questions
CREATE TABLE IF NOT EXISTS single_choice_questions (
    id SERIAL PRIMARY KEY,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER DEFAULT 0,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- Create a unique index that only applies to non-deleted questions
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_single_choice ON single_choice_questions(card_id, order_id) WHERE is_deleted = 0;


-- Multiple Choice Questions
CREATE TABLE IF NOT EXISTS multiple_choice_questions (
	id SERIAL PRIMARY KEY,
	content_id TEXT NOT NULL UNIQUE,
	card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer_id INTEGER,
	instruction TEXT,
    difficulty TEXT,
    marks INTEGER DEFAULT 1,
    options_data TEXT,
	correct_answer TEXT,
	media_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER DEFAULT 0,
	FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);
-- Create a unique index that only applies to non-deleted questions
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_multiple_choice ON multiple_choice_questions(card_id, order_id) WHERE is_deleted = 0;

-- Fill in the Blank Questions
CREATE TABLE IF NOT EXISTS fill_in_blank_questions (
	id SERIAL PRIMARY KEY,
	content_id TEXT NOT NULL UNIQUE,
	card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    question TEXT NOT NULL,
	instruction TEXT,
    difficulty TEXT,
	blanks_data TEXT,
	media_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER DEFAULT 0,
	FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);
-- Create a unique index that only applies to non-deleted questions
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_fill_in_blank ON fill_in_blank_questions(card_id, order_id) WHERE is_deleted = 0;

-- Matching Questions
CREATE TABLE IF NOT EXISTS matching_questions (
    id SERIAL PRIMARY KEY,
    content_id TEXT NOT NULL UNIQUE,
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    instruction TEXT,
    difficulty TEXT,
    options_data TEXT,
    media_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER DEFAULT 0,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- Create a unique index that only applies to non-deleted questions
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_matching ON matching_questions(card_id, order_id) WHERE is_deleted = 0;

-- Long Text Questions
CREATE TABLE IF NOT EXISTS long_text_questions (
    id SERIAL PRIMARY KEY,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER DEFAULT 0,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- Create a unique index that only applies to non-deleted questions
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_long_text ON long_text_questions(card_id, order_id) WHERE is_deleted = 0;

-- Audio Response Questions
CREATE TABLE IF NOT EXISTS audio_response_questions (
    id SERIAL PRIMARY KEY,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER DEFAULT 0,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- Create a unique index that only applies to non-deleted questions
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_audio_response ON audio_response_questions(card_id, order_id) WHERE is_deleted = 0;

-- Text Material
CREATE TABLE IF NOT EXISTS text_materials (
    id SERIAL PRIMARY KEY,
    content_id TEXT NOT NULL UNIQUE,
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    title TEXT,
    content TEXT,
    show_title INTEGER DEFAULT 1,
    title_style TEXT DEFAULT 'h2',
    is_rich_text INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER DEFAULT 0,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- Create a unique index that only applies to non-deleted materials
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_text_materials ON text_materials(card_id, order_id) WHERE is_deleted = 0;

-- Multimedia Material
CREATE TABLE IF NOT EXISTS multimedia_materials (
    id SERIAL PRIMARY KEY,
    content_id TEXT NOT NULL UNIQUE,
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    title TEXT,
    show_title INTEGER DEFAULT 1,
    title_style TEXT DEFAULT 'h2',
    media_type TEXT,
    media_data TEXT,
    settings_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER DEFAULT 0,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- Create a unique index that only applies to non-deleted materials
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_multimedia_materials ON multimedia_materials(card_id, order_id) WHERE is_deleted = 0;

-- LLM Session Material
CREATE TABLE IF NOT EXISTS llm_session_materials (
    id SERIAL PRIMARY KEY,
    content_id TEXT NOT NULL UNIQUE,
    card_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    title TEXT,
    show_title INTEGER DEFAULT 1,
    title_style TEXT DEFAULT 'h2',
    session_settings TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER DEFAULT 0,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- Create a unique index that only applies to non-deleted materials
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_llm_session_materials ON llm_session_materials(card_id, order_id) WHERE is_deleted = 0;

-- LLM Audio Response Questions
CREATE TABLE IF NOT EXISTS llm_audio_response_questions (
    id SERIAL PRIMARY KEY,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER DEFAULT 0,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- Create a unique index that only applies to non-deleted questions
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_llm_audio_response ON llm_audio_response_questions(card_id, order_id) WHERE is_deleted = 0;

-- Create a simple change history table (optional)
CREATE TABLE IF NOT EXISTS change_history (
    id SERIAL PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    user_id INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);