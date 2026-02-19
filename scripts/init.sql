-- ParkEase Database Initialization Script
-- This script runs automatically when the PostgreSQL container starts for the first time
-- It creates initial tables, indexes, and sample data (if needed)

-- Create extensions (if needed for future features)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- This file can be expanded with:
-- 1. CREATE TABLE statements (once Prisma migrations are set up)
-- 2. Initial seed data
-- 3. User creation and permissions
-- 4. Indexes and constraints

-- For now, the main tables will be created via Prisma migrations:
-- Run: docker-compose exec app npx prisma migrate dev --name init

-- Example: Create a schema version table
CREATE TABLE IF NOT EXISTS _schema_version (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50) NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

INSERT INTO _schema_version (version, description) 
VALUES ('0.1.0', 'Database initialized for ParkEase application')
ON CONFLICT DO NOTHING;

-- Grant permissions if needed
-- GRANT ALL PRIVILEGES ON DATABASE parkease_dev TO parkease;
-- GRANT USAGE ON SCHEMA public TO parkease;
-- GRANT CREATE ON SCHEMA public TO parkease;

-- Note: Ensure database encoding is UTF-8 by setting:
-- POSTGRES_INITDB_ARGS=--encoding=UTF8 in docker-compose.yml
