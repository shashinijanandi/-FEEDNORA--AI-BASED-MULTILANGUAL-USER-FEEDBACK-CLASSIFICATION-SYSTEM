-- ─────────────────────────────────────────────────────────────────────────────
-- FeedbackAI — PostgreSQL 16 Database Initialization
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- for fast text search

-- ─── Enums ───────────────────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE userrole      AS ENUM ('admin', 'user');
    CREATE TYPE sentimentlabel AS ENUM ('positive', 'neutral', 'negative');
    CREATE TYPE approvalstatus AS ENUM ('auto', 'needs_review', 'approved', 'rejected');
    CREATE TYPE trenddirection AS ENUM ('Rising', 'Stable', 'Falling');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id               SERIAL PRIMARY KEY,
    email            VARCHAR(255) UNIQUE NOT NULL,
    full_name        VARCHAR(255) NOT NULL,
    hashed_password  VARCHAR(255) NOT NULL,
    role             userrole    NOT NULL DEFAULT 'user',
    is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS feedbacks (
    id                   SERIAL PRIMARY KEY,
    user_id              INTEGER REFERENCES users(id) ON DELETE SET NULL,
    text                 TEXT        NOT NULL,
    language             VARCHAR(10) DEFAULT 'EN',
    product_category     VARCHAR(100),

    -- AI outputs
    sentiment            sentimentlabel,
    sentiment_conf       FLOAT,
    detected_topic       VARCHAR(100),
    topic_probability    FLOAT,
    topic_keywords       JSONB,

    -- Response
    generated_response   TEXT,
    approval_status      approvalstatus NOT NULL DEFAULT 'needs_review',
    approved_response    TEXT,

    -- Evaluation
    bleu_score           FLOAT,
    rouge_l_score        FLOAT,
    semantic_similarity  FLOAT,
    model_confidence     FLOAT,

    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS topics (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) UNIQUE NOT NULL,
    color       VARCHAR(20)  DEFAULT '#22d3ee',
    keywords    JSONB,
    probability FLOAT        DEFAULT 0.0,
    doc_count   INTEGER      DEFAULT 0,
    trend       trenddirection DEFAULT 'Stable',
    trend_delta FLOAT        DEFAULT 0.0,
    is_active   BOOLEAN      DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS topic_time_series (
    id          SERIAL PRIMARY KEY,
    topic_id    INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    period      VARCHAR(20) NOT NULL,   -- e.g. '2024-08'
    probability FLOAT  DEFAULT 0.0,
    doc_count   INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id                    SERIAL PRIMARY KEY,
    snapshot_date         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_feedback        INTEGER DEFAULT 0,
    positive_count        INTEGER DEFAULT 0,
    neutral_count         INTEGER DEFAULT 0,
    negative_count        INTEGER DEFAULT 0,
    ai_responses_today    INTEGER DEFAULT 0,
    avg_bleu              FLOAT   DEFAULT 0.0,
    avg_confidence        FLOAT   DEFAULT 0.0,
    avg_response_time_ms  FLOAT   DEFAULT 0.0
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id      ON feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_sentiment    ON feedbacks(sentiment);
CREATE INDEX IF NOT EXISTS idx_feedbacks_topic        ON feedbacks(detected_topic);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at   ON feedbacks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_approval     ON feedbacks(approval_status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_language     ON feedbacks(language);
CREATE INDEX IF NOT EXISTS idx_topic_ts_topic_id      ON topic_time_series(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_ts_period        ON topic_time_series(period);

-- Full text search on feedback text
CREATE INDEX IF NOT EXISTS idx_feedbacks_text_trgm
    ON feedbacks USING GIN (text gin_trgm_ops);

-- ─── Useful Views ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_feedback_summary AS
SELECT
    DATE(created_at)            AS feedback_date,
    COUNT(*)                    AS total,
    COUNT(*) FILTER (WHERE sentiment = 'positive') AS positive,
    COUNT(*) FILTER (WHERE sentiment = 'neutral')  AS neutral,
    COUNT(*) FILTER (WHERE sentiment = 'negative') AS negative,
    ROUND(AVG(bleu_score)::numeric, 3)             AS avg_bleu,
    ROUND(AVG(model_confidence)::numeric, 1)       AS avg_confidence,
    ROUND(AVG(sentiment_conf)::numeric, 1)         AS avg_sentiment_conf
FROM feedbacks
GROUP BY DATE(created_at)
ORDER BY feedback_date DESC;

CREATE OR REPLACE VIEW v_topic_summary AS
SELECT
    detected_topic               AS topic,
    COUNT(*)                     AS doc_count,
    ROUND((COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0))::numeric, 2) AS pct,
    ROUND(AVG(topic_probability)::numeric, 2) AS avg_prob
FROM feedbacks
WHERE detected_topic IS NOT NULL
GROUP BY detected_topic
ORDER BY doc_count DESC;

-- ─────────────────────────────────────────────────────────────────────────────
-- Done
-- ─────────────────────────────────────────────────────────────────────────────
