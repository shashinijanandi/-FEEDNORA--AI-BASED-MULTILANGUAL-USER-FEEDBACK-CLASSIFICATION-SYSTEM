-- AI Feedback Analytics Platform - Database Schema
-- PostgreSQL 16+

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- This file runs only on first initialization.
-- SQLAlchemy will create all tables via create_tables() on app startup.
-- This script just ensures extensions are available.

SELECT 'Database initialized for AI Feedback Analytics Platform' AS message;
