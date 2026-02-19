-- ParkEase Database Schema
-- PostgreSQL 15+ DDL Statements
-- This file defines the complete database schema for the ParkEase parking management system

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User roles enumeration
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');

-- Parking slot status enumeration
CREATE TYPE slot_status AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE');

-- Booking status enumeration
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- Crowd report action enumeration
CREATE TYPE crowd_action AS ENUM ('LEFT', 'OCCUPIED');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users table
-- Stores user account information
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'USER',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Parking slots table
-- Stores information about parking slots
CREATE TABLE parking_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  row INTEGER NOT NULL,
  column INTEGER NOT NULL,
  status slot_status NOT NULL DEFAULT 'AVAILABLE',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure row and column combination is unique
  CONSTRAINT unique_slot_location UNIQUE(row, column),
  
  -- Validate row and column are positive
  CONSTRAINT positive_row CHECK (row > 0),
  CONSTRAINT positive_column CHECK (column > 0)
);

-- Bookings table
-- Stores parking slot bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES parking_slots(id) ON DELETE RESTRICT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status booking_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure end_time is after start_time
  CONSTRAINT end_time_after_start_time CHECK (end_time > start_time),
  
  -- Ensure booking duration is at least 15 minutes
  CONSTRAINT minimum_booking_duration CHECK (
    EXTRACT(EPOCH FROM (end_time - start_time)) >= 900
  ),
  
  -- Ensure booking duration is at most 24 hours
  CONSTRAINT maximum_booking_duration CHECK (
    EXTRACT(EPOCH FROM (end_time - start_time)) <= 86400
  )
);

-- Crowd reports table
-- Stores crowd-sourced reports about parking slot availability
CREATE TABLE crowd_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES parking_slots(id) ON DELETE CASCADE,
  action crowd_action NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure reports are not from the future
  CONSTRAINT report_not_future CHECK (timestamp <= CURRENT_TIMESTAMP)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- User indexes
-- Speed up email lookups (already covered by UNIQUE constraint)
CREATE INDEX idx_users_email ON users(email);

-- Speed up role-based queries
CREATE INDEX idx_users_role ON users(role);

-- Parking slot indexes
-- Speed up status lookups
CREATE INDEX idx_parking_slots_status ON parking_slots(status);

-- Speed up location-based queries
CREATE INDEX idx_parking_slots_row_column ON parking_slots(row, column);

-- Booking indexes
-- Speed up user bookings lookup
CREATE INDEX idx_bookings_user_id ON bookings(user_id);

-- Speed up slot bookings lookup
CREATE INDEX idx_bookings_slot_id ON bookings(slot_id);

-- Speed up status lookups
CREATE INDEX idx_bookings_status ON bookings(status);

-- Speed up time-based queries for availability checks
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_end_time ON bookings(end_time);

-- Composite index for time-range queries
CREATE INDEX idx_bookings_slot_time ON bookings(slot_id, start_time, end_time);

-- Speed up finding active bookings for a slot
CREATE INDEX idx_bookings_slot_status_time ON bookings(
  slot_id,
  status,
  start_time,
  end_time
);

-- Booking creation time index (for recent bookings)
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);

-- Crowd report indexes
-- Speed up user reports lookup
CREATE INDEX idx_crowd_reports_user_id ON crowd_reports(user_id);

-- Speed up slot reports lookup
CREATE INDEX idx_crowd_reports_slot_id ON crowd_reports(slot_id);

-- Speed up timestamp-based queries
CREATE INDEX idx_crowd_reports_timestamp ON crowd_reports(timestamp DESC);

-- Composite index for recent reports on specific slots
CREATE INDEX idx_crowd_reports_slot_timestamp ON crowd_reports(
  slot_id,
  timestamp DESC
);

-- ============================================================================
-- VIEWS (OPTIONAL)
-- ============================================================================

-- View for available slots with booking count
CREATE OR REPLACE VIEW available_slots_view AS
SELECT
  ps.id,
  ps.row,
  ps.column,
  ps.status,
  COUNT(b.id) AS active_bookings,
  ps.created_at,
  ps.updated_at
FROM parking_slots ps
LEFT JOIN bookings b ON ps.id = b.slot_id 
  AND b.status IN ('PENDING', 'CONFIRMED')
  AND NOW() BETWEEN b.start_time AND b.end_time
GROUP BY ps.id, ps.row, ps.column, ps.status, ps.created_at, ps.updated_at;

-- View for user booking history
CREATE OR REPLACE VIEW user_booking_history AS
SELECT
  b.id,
  b.user_id,
  u.email,
  u.name,
  b.slot_id,
  ps.row,
  ps.column,
  b.start_time,
  b.end_time,
  b.status,
  b.created_at,
  (b.end_time - b.start_time) AS duration
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN parking_slots ps ON b.slot_id = ps.id;

-- ============================================================================
-- FUNCTIONS (OPTIONAL)
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update users.updated_at on modification
CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update parking_slots.updated_at on modification
CREATE TRIGGER trigger_parking_slots_updated_at
BEFORE UPDATE ON parking_slots
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

-- Table comments
COMMENT ON TABLE users IS 'User accounts and authentication information';
COMMENT ON TABLE parking_slots IS 'Parking slot master data';
COMMENT ON TABLE bookings IS 'Parking slot bookings and reservations';
COMMENT ON TABLE crowd_reports IS 'Crowd-sourced parking availability reports';

-- Column comments
COMMENT ON COLUMN users.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN users.email IS 'User email address (unique, case-insensitive)';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN users.role IS 'User role: USER or ADMIN';

COMMENT ON COLUMN parking_slots.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN parking_slots.row IS 'Parking lot row number (1-indexed)';
COMMENT ON COLUMN parking_slots.column IS 'Parking lot column number (1-indexed)';
COMMENT ON COLUMN parking_slots.status IS 'Current slot status';

COMMENT ON COLUMN bookings.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN bookings.user_id IS 'FK to users table';
COMMENT ON COLUMN bookings.slot_id IS 'FK to parking_slots table';
COMMENT ON COLUMN bookings.start_time IS 'Booking start timestamp (inclusive)';
COMMENT ON COLUMN bookings.end_time IS 'Booking end timestamp (exclusive)';
COMMENT ON COLUMN bookings.status IS 'Booking status lifecycle';

COMMENT ON COLUMN crowd_reports.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN crowd_reports.user_id IS 'FK to users table (reporter)';
COMMENT ON COLUMN crowd_reports.slot_id IS 'FK to parking_slots table';
COMMENT ON COLUMN crowd_reports.action IS 'Report action: LEFT or OCCUPIED';
COMMENT ON COLUMN crowd_reports.timestamp IS 'Report timestamp (UTC)';

-- Type comments
COMMENT ON TYPE user_role IS 'User role: USER (regular user), ADMIN (administrator)';
COMMENT ON TYPE slot_status IS 'Parking slot status: AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE';
COMMENT ON TYPE booking_status IS 'Booking status: PENDING, CONFIRMED, CANCELLED, COMPLETED';
COMMENT ON TYPE crowd_action IS 'Crowd report action: LEFT (slot freed), OCCUPIED (slot taken)';

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample users (passwords should be hashed in production)
-- INSERT INTO users (email, password_hash, name, role) VALUES
-- ('admin@parkease.com', '$2a$10$...', 'Admin User', 'ADMIN'),
-- ('user1@parkease.com', '$2a$10$...', 'John Doe', 'USER'),
-- ('user2@parkease.com', '$2a$10$...', 'Jane Smith', 'USER');

-- Insert sample parking slots (10x10 grid = 100 slots)
-- INSERT INTO parking_slots (row, column, status)
-- SELECT
--   (((i-1) / 10) + 1) AS row,
--   (((i-1) % 10) + 1) AS column,
--   'AVAILABLE'::slot_status
-- FROM generate_series(1, 100) i;

-- ============================================================================
-- NOTES FOR PRODUCTION
-- ============================================================================

/*
1. SECURITY:
   - Always hash passwords using bcrypt (min 10 rounds)
   - Use environment-specific connection strings
   - Restrict access by role using database-level permissions
   - Audit sensitive operations (user creation, booking changes)

2. PERFORMANCE:
   - Consider partitioning bookings table by date for large datasets
   - Archive old crowd reports (>90 days) to separate table
   - Vacuum and analyze tables regularly
   - Monitor slow queries with pg_stat_statements

3. BACKUP & RECOVERY:
   - Schedule daily backups (pg_dump)
   - Test restore procedures monthly
   - Keep backups in separate geographic location
   - Use PITR (Point-In-Time Recovery) for critical data

4. MONITORING:
   - Monitor table sizes and growth rates
   - Check index bloat and rebuild as needed
   - Monitor connection pool utilization
   - Set up alerts for disk space and replication lag

5. DATA INTEGRITY:
   - Use transactions for multi-table operations
   - Implement application-level validation
   - Regular consistency checks on booking overlaps
   - Archive and purge old crowd reports

6. OPTIMIZATION:
   - Consider materialized views for reports
   - Use connection pooling (pgBouncer)
   - Cache frequently accessed data (Redis)
   - Implement read replicas for analytics queries

7. FUTURE ENHANCEMENTS:
   - Add payment information table
   - Add parking lot zones/areas
   - Add vehicle information table
   - Add booking cancellation reasons
   - Add review/rating system
   - Add occupancy tracking (time-series data)
*/
