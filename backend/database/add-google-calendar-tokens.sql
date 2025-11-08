-- ============================================================================
-- Google Calendar OAuth Tokens Table
-- ============================================================================
-- Stores OAuth tokens for Google Calendar integration per user
-- ============================================================================

CREATE TABLE IF NOT EXISTS auth.google_calendar_tokens (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expiry_date TIMESTAMPTZ,
    token_type TEXT DEFAULT 'Bearer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_user_id ON auth.google_calendar_tokens(user_id);

COMMENT ON TABLE auth.google_calendar_tokens IS 'Stores Google Calendar OAuth tokens for each user';

