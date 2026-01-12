-- Migration: 002_ai_assistant
-- Description: AI Intake Assistant session and turn tracking
-- Created: 2026-01-09

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE ai_session_status AS ENUM (
  'active',           -- Session in progress
  'resolved',         -- Issues resolved, gate passed after clarification
  'manual',           -- Max questions reached or unresolved, route to manual review
  'expired',          -- Session TTL exceeded without completion
  'error'             -- System error during processing
);

CREATE TYPE ai_trigger_reason AS ENUM (
  'ambiguity',              -- Unclear or "unsure" answers need specificity
  'contradiction',          -- Conflict between structured answers and context_raw
  'budget_scope_mismatch',  -- Project complexity exceeds stated budget
  'intelligence'            -- Gate passed, gathering additional intel (low priority)
);

CREATE TYPE ai_question_type AS ENUM (
  'single_choice',    -- One option from a list (maps to enum value)
  'text',             -- Free-form text input
  'confirmation'      -- Yes/No confirmation
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- AI Sessions: Tracks multi-turn clarification sessions
CREATE TABLE ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 minutes'),

  -- Session state
  status ai_session_status NOT NULL DEFAULT 'active',
  trigger_reasons ai_trigger_reason[] NOT NULL,

  -- Progress tracking
  question_count INTEGER NOT NULL DEFAULT 0,
  max_questions INTEGER NOT NULL DEFAULT 3,

  -- Form field updates made during session
  -- Format: {"budget_range": {"old": "unsure", "new": "25k_50k", "turn_index": 0}}
  field_updates JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Re-gating results after each turn (updated on each answer)
  provisional_gate_status gate_status,
  latest_gate_status gate_status,
  latest_routing_result routing_result,

  -- Final output when session completes (built by backend, not LLM)
  -- Contains: clarifications[], intelligence_gathered{}, ai_pre_call_notes{}
  final_output JSONB,

  -- Error tracking
  error_message TEXT,

  CONSTRAINT max_questions_positive CHECK (max_questions > 0),
  CONSTRAINT question_count_within_max CHECK (question_count <= max_questions)
);

-- AI Turns: Individual question-answer pairs within a session
CREATE TABLE ai_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Turn ordering (0-indexed)
  turn_index INTEGER NOT NULL,

  -- Question details
  question_text TEXT NOT NULL,
  question_type ai_question_type NOT NULL,
  question_purpose TEXT,  -- Human-readable explanation of why this question

  -- Options for choice questions
  -- Format: [{"value": "25k_50k", "label": "$25k-$50k", "maps_to_field": "budget_range", "maps_to_value": "25k_50k"}]
  options JSONB,

  -- User response
  answer_text TEXT,                  -- Display text of the answer
  answer_value JSONB,                -- Structured value (e.g., selected option value)
  answered_at TIMESTAMPTZ,

  -- Field update tracking
  target_field TEXT,                 -- Which form field this question resolves
  field_updated BOOLEAN DEFAULT FALSE,
  old_field_value JSONB,
  new_field_value JSONB,

  -- LLM tracking (no chain-of-thought, just relevant structured output)
  llm_model TEXT,
  llm_prompt_tokens INTEGER,
  llm_completion_tokens INTEGER,
  raw_llm_response JSONB,            -- Structured JSON output only, no reasoning

  CONSTRAINT unique_turn_per_session UNIQUE (session_id, turn_index),
  CONSTRAINT turn_index_non_negative CHECK (turn_index >= 0)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Session lookups
CREATE INDEX idx_ai_sessions_inquiry_id ON ai_sessions(inquiry_id);
CREATE INDEX idx_ai_sessions_status ON ai_sessions(status);
CREATE INDEX idx_ai_sessions_expires_at ON ai_sessions(expires_at);
CREATE INDEX idx_ai_sessions_created_at ON ai_sessions(created_at DESC);

-- Turn lookups
CREATE INDEX idx_ai_turns_session_id ON ai_turns(session_id);
CREATE INDEX idx_ai_turns_session_turn ON ai_turns(session_id, turn_index);

-- Find active sessions for cleanup job
CREATE INDEX idx_ai_sessions_active_expires
  ON ai_sessions(expires_at)
  WHERE status = 'active';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER ai_sessions_updated_at
  BEFORE UPDATE ON ai_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_turns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on ai_sessions"
  ON ai_sessions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on ai_turns"
  ON ai_turns FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ai_sessions IS 'AI clarification sessions for intake form ambiguity resolution';
COMMENT ON TABLE ai_turns IS 'Individual Q&A turns within an AI clarification session';

COMMENT ON COLUMN ai_sessions.trigger_reasons IS 'Array of reasons that triggered AI clarification';
COMMENT ON COLUMN ai_sessions.field_updates IS 'Cumulative map of field updates made during session';
COMMENT ON COLUMN ai_sessions.provisional_gate_status IS 'Gate status at session start (before clarification)';
COMMENT ON COLUMN ai_sessions.latest_gate_status IS 'Most recent gate status after re-gating';
COMMENT ON COLUMN ai_sessions.final_output IS 'Structured output built by backend when session completes';

COMMENT ON COLUMN ai_turns.options IS 'For choice questions: [{value, label, maps_to_field, maps_to_value}]';
COMMENT ON COLUMN ai_turns.raw_llm_response IS 'Structured LLM output only (no chain-of-thought)';
COMMENT ON COLUMN ai_turns.target_field IS 'Form field this question is intended to resolve';
