# ParkEase Database Schema

This document describes the complete database schema for the ParkEase parking management system.

## Table of Contents
- [Overview](#overview)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Tables](#tables)
- [Enums](#enums)
- [Indexes](#indexes)
- [Constraints](#constraints)
- [Setup Instructions](#setup-instructions)
- [Queries](#queries)
- [Performance Considerations](#performance-considerations)

---

## Overview

ParkEase uses PostgreSQL 15+ with UUID primary keys and comprehensive indexing for optimal performance. The schema supports:

- **User Management**: Authentication and role-based access control
- **Parking Inventory**: Slot management with status tracking
- **Booking System**: Reservation management with temporal constraints
- **Crowd-Sourcing**: Community reports on parking availability

**Total Tables**: 4  
**Total Indexes**: 17  
**Enums**: 4  
**Views**: 2 (optional)

---

## Entity Relationship Diagram

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (UUID)       │◄─────┐
│ email (unique)  │      │
│ password_hash   │      │
│ name            │      │
│ role            │      │
│ created_at      │      │
│ updated_at      │      │
└─────────────────┘      │
        │                │
        │         ┌──────┴──────────┐
        │         │                 │
        │    ┌─────────────┐   ┌──────────────┐
        │    │  bookings   │   │ crowd_reports│
        │    ├─────────────┤   ├──────────────┤
        │    │ id (UUID)   │   │ id (UUID)    │
        └───►│ user_id (FK)│   │ user_id (FK) │
             │ slot_id (FK)├──►│ slot_id (FK) │
             │ start_time  │   │ action       │
             │ end_time    │   │ timestamp    │
             │ status      │   └──────────────┘
             │ created_at  │
             └─────────────┘
                   │
                   │
        ┌──────────┘
        │
        ▼
┌──────────────────┐
│ parking_slots    │
├──────────────────┤
│ id (UUID)        │
│ row (int)        │
│ column (int)     │
│ status           │
│ created_at       │
│ updated_at       │
└──────────────────┘
```

---

## Tables

### 1. users

Stores user account and authentication information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email address (login) |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `name` | VARCHAR(255) | NOT NULL | User's full name |
| `role` | user_role enum | NOT NULL, DEFAULT 'USER' | USER or ADMIN |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes**:
- `idx_users_email` - Speed up email lookups during login
- `idx_users_role` - Speed up role-based queries (admin operations)

**Example**:
```sql
INSERT INTO users (email, password_hash, name, role)
VALUES (
  'john@parkease.com',
  '$2a$10$...',
  'John Doe',
  'USER'
);
```

---

### 2. parking_slots

Stores parking slot information and status.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `row` | INTEGER | NOT NULL, CHECK > 0 | Parking lot row (1-indexed) |
| `column` | INTEGER | NOT NULL, CHECK > 0 | Parking lot column (1-indexed) |
| `status` | slot_status enum | NOT NULL, DEFAULT 'AVAILABLE' | Current status |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Unique Constraints**:
- `unique_slot_location` - (row, column) must be unique

**Indexes**:
- `idx_parking_slots_status` - Quick availability checks
- `idx_parking_slots_row_column` - Location-based queries

**Slot Status Values**:
- `AVAILABLE` - Free and can be booked
- `OCCUPIED` - Currently in use
- `RESERVED` - Reserved by booking
- `MAINTENANCE` - Out of service

**Example**:
```sql
INSERT INTO parking_slots (row, column, status)
VALUES (1, 5, 'AVAILABLE');
```

---

### 3. bookings

Stores parking slot reservations and bookings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `user_id` | UUID | FK → users.id, NOT NULL | User who booked |
| `slot_id` | UUID | FK → parking_slots.id, NOT NULL | Parking slot |
| `start_time` | TIMESTAMP | NOT NULL | Booking start (inclusive) |
| `end_time` | TIMESTAMP | NOT NULL | Booking end (exclusive) |
| `status` | booking_status enum | NOT NULL, DEFAULT 'PENDING' | Lifecycle status |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |

**Check Constraints**:
- `end_time_after_start_time` - end_time > start_time
- `minimum_booking_duration` - At least 15 minutes (900 seconds)
- `maximum_booking_duration` - At most 24 hours (86400 seconds)

**Foreign Keys**:
- `user_id` → users.id (CASCADE delete)
- `slot_id` → parking_slots.id (RESTRICT delete)

**Indexes** (for high-traffic availability queries):
- `idx_bookings_user_id` - User's bookings
- `idx_bookings_slot_id` - Slot's bookings
- `idx_bookings_status` - Booking status queries
- `idx_bookings_start_time` - Find bookings starting at time T
- `idx_bookings_end_time` - Find bookings ending at time T
- `idx_bookings_slot_time` - Time-range queries for specific slot
- `idx_bookings_slot_status_time` - Active bookings for a slot
- `idx_bookings_created_at` - Recent bookings

**Booking Status Values**:
- `PENDING` - Awaiting confirmation
- `CONFIRMED` - Confirmed reservation
- `CANCELLED` - Cancelled by user
- `COMPLETED` - Booking period has ended

**Example**:
```sql
INSERT INTO bookings (user_id, slot_id, start_time, end_time, status)
VALUES (
  'a1234567-1234-1234-1234-123456789abc'::uuid,
  'b2345678-2345-2345-2345-234567890bcd'::uuid,
  NOW() + INTERVAL '1 hour',
  NOW() + INTERVAL '3 hours',
  'PENDING'
);
```

---

### 4. crowd_reports

Stores crowd-sourced parking availability reports.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `user_id` | UUID | FK → users.id, NOT NULL | Reporter (user) |
| `slot_id` | UUID | FK → parking_slots.id, NOT NULL | Parking slot |
| `action` | crowd_action enum | NOT NULL | LEFT or OCCUPIED |
| `timestamp` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Report time |

**Foreign Keys**:
- `user_id` → users.id (CASCADE delete)
- `slot_id` → parking_slots.id (CASCADE delete)

**Check Constraints**:
- `report_not_future` - timestamp ≤ CURRENT_TIMESTAMP

**Indexes**:
- `idx_crowd_reports_user_id` - User's reports
- `idx_crowd_reports_slot_id` - Slot reports
- `idx_crowd_reports_timestamp` - Recent reports (DESC)
- `idx_crowd_reports_slot_timestamp` - Recent reports for slot

**Crowd Action Values**:
- `LEFT` - User left the slot (now available)
- `OCCUPIED` - User occupied the slot

**Example**:
```sql
INSERT INTO crowd_reports (user_id, slot_id, action)
VALUES (
  'a1234567-1234-1234-1234-123456789abc'::uuid,
  'b2345678-2345-2345-2345-234567890bcd'::uuid,
  'OCCUPIED'
);
```

---

## Enums

### UserRole
```sql
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
```
- **USER**: Regular application user
- **ADMIN**: Administrator with elevated privileges

### SlotStatus
```sql
CREATE TYPE slot_status AS ENUM (
  'AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'
);
```
- **AVAILABLE**: Slot is free
- **OCCUPIED**: Slot is currently in use
- **RESERVED**: Slot is reserved by a booking
- **MAINTENANCE**: Slot is out of service

### BookingStatus
```sql
CREATE TYPE booking_status AS ENUM (
  'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'
);
```
- **PENDING**: Awaiting confirmation
- **CONFIRMED**: Confirmed by system
- **CANCELLED**: Cancelled by user or admin
- **COMPLETED**: Booking period ended

### CrowdAction
```sql
CREATE TYPE crowd_action AS ENUM ('LEFT', 'OCCUPIED');
```
- **LEFT**: User departed, slot became available
- **OCCUPIED**: User arrived, slot became occupied

---

## Indexes

### Summary
Total indexes: **17**

| Table | Index | Purpose |
|-------|-------|---------|
| users | idx_users_email | Login queries |
| users | idx_users_role | Admin queries |
| parking_slots | idx_parking_slots_status | Availability checks |
| parking_slots | idx_parking_slots_row_column | Location queries |
| bookings | idx_bookings_user_id | User bookings |
| bookings | idx_bookings_slot_id | Slot bookings |
| bookings | idx_bookings_status | Status queries |
| bookings | idx_bookings_start_time | Start time queries |
| bookings | idx_bookings_end_time | End time queries |
| bookings | idx_bookings_slot_time | Range queries |
| bookings | idx_bookings_slot_status_time | Active bookings |
| bookings | idx_bookings_created_at | Recent bookings |
| crowd_reports | idx_crowd_reports_user_id | User reports |
| crowd_reports | idx_crowd_reports_slot_id | Slot reports |
| crowd_reports | idx_crowd_reports_timestamp | Recent reports |
| crowd_reports | idx_crowd_reports_slot_timestamp | Slot history |

---

## Constraints

### Primary Keys
- All tables use `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`

### Unique Constraints
- `users.email` - Email addresses must be unique
- `parking_slots (row, column)` - Slot locations must be unique

### Foreign Keys

| Constraint | References | Delete Rule |
|-----------|-----------|------------|
| bookings.user_id → users.id | CASCADE | Delete booking if user deleted |
| bookings.slot_id → parking_slots.id | RESTRICT | Prevent slot deletion if booked |
| crowd_reports.user_id → users.id | CASCADE | Delete report if user deleted |
| crowd_reports.slot_id → parking_slots.id | CASCADE | Delete report if slot deleted |

### Check Constraints

| Table | Constraint | Rule |
|-------|-----------|------|
| parking_slots | positive_row | row > 0 |
| parking_slots | positive_column | column > 0 |
| bookings | end_time_after_start_time | end_time > start_time |
| bookings | minimum_booking_duration | duration ≥ 15 minutes |
| bookings | maximum_booking_duration | duration ≤ 24 hours |
| crowd_reports | report_not_future | timestamp ≤ NOW() |

---

## Setup Instructions

### 1. Create Database

```bash
# Using psql
psql -U postgres

# Create database
CREATE DATABASE parkease_dev ENCODING 'UTF8';
CREATE DATABASE parkease_test ENCODING 'UTF8';
CREATE DATABASE parkease_prod ENCODING 'UTF8';

# Connect to database
\c parkease_dev
```

### 2. Run Schema Setup

```bash
# Using Docker (recommended)
docker-compose exec db psql -U parkease -d parkease_dev < scripts/schema.sql

# Or locally
psql -h localhost -U parkease -d parkease_dev < scripts/schema.sql
```

### 3. Setup Prisma

```bash
# Install Prisma CLI
npm install -D prisma

# Generate Prisma client
npx prisma generate

# Create initial migration (if using migration-based setup)
npx prisma migrate dev --name init

# View database with Prisma Studio
npx prisma studio
```

### 4. Seed Sample Data

```bash
# Create seed file (optional)
npm install -D @faker-js/faker

# Run seed script
npm run prisma:seed
```

---

## Queries

### Common Queries

#### Find available slots
```sql
SELECT id, row, column, status
FROM parking_slots
WHERE status = 'AVAILABLE'
ORDER BY row, column;
```

#### Check slot availability for time range
```sql
SELECT id, row, column
FROM parking_slots ps
WHERE status = 'AVAILABLE'
  AND NOT EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.slot_id = ps.id
      AND b.status IN ('PENDING', 'CONFIRMED')
      AND b.start_time < $2::timestamptz
      AND b.end_time > $1::timestamptz
  )
ORDER BY row, column;
```

#### Get user's bookings
```sql
SELECT b.id, b.slot_id, ps.row, ps.column, b.start_time, b.end_time, b.status
FROM bookings b
JOIN parking_slots ps ON b.slot_id = ps.id
WHERE b.user_id = $1::uuid
ORDER BY b.start_time DESC;
```

#### Get active bookings for a slot
```sql
SELECT b.id, b.user_id, u.email, b.start_time, b.end_time, b.status
FROM bookings b
JOIN users u ON b.user_id = u.id
WHERE b.slot_id = $1::uuid
  AND b.status IN ('PENDING', 'CONFIRMED')
  AND NOW() BETWEEN b.start_time AND b.end_time
ORDER BY b.start_time;
```

#### Get recent crowd reports
```sql
SELECT cr.id, cr.user_id, u.email, cr.action, cr.timestamp
FROM crowd_reports cr
JOIN users u ON cr.user_id = u.id
WHERE cr.slot_id = $1::uuid
  AND cr.timestamp > NOW() - INTERVAL '1 hour'
ORDER BY cr.timestamp DESC;
```

#### Occupancy rate
```sql
SELECT
  COUNT(CASE WHEN status = 'OCCUPIED' THEN 1 END) AS occupied,
  COUNT(*) AS total,
  ROUND(100.0 * COUNT(CASE WHEN status = 'OCCUPIED' THEN 1 END) / COUNT(*), 2) AS occupancy_rate
FROM parking_slots;
```

---

## Performance Considerations

### Indexing Strategy
- **High-volume queries**: Always indexed
  - User login (email)
  - Availability checks (slot status, time range)
  - User bookings (user_id)
  
- **Composite indexes**: For multi-column filters
  - Slot + time range (bookings)
  - Slot + status + time (active bookings)

- **Partial indexes**: Consider for status filters
  ```sql
  CREATE INDEX idx_bookings_active 
  ON bookings(slot_id, start_time, end_time)
  WHERE status IN ('PENDING', 'CONFIRMED');
  ```

### Query Optimization
1. **Time-range queries**: Use indexed start_time + end_time
2. **Availability checks**: Use composite index on (slot_id, status, time)
3. **User queries**: Filter by user_id first (indexed)
4. **Crowd reports**: Partition by timestamp for large datasets

### Maintenance
```bash
# Analyze tables for query planning
ANALYZE users;
ANALYZE parking_slots;
ANALYZE bookings;
ANALYZE crowd_reports;

# Vacuum to clean up deleted rows
VACUUM ANALYZE;

# Check index health
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Scaling Considerations

**Partition bookings by date**:
```sql
CREATE TABLE bookings_2026_02 PARTITION OF bookings
FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

**Archive old crowd reports**:
```sql
CREATE TABLE crowd_reports_archive AS
SELECT * FROM crowd_reports
WHERE timestamp < NOW() - INTERVAL '90 days';
```

**Read replicas for analytics**:
- Separate read-only replicas for reporting queries
- Keep operational queries on primary

---

## Data Validation

### Application-Level
- Validate email format before insert
- Hash passwords with bcrypt (10+ rounds)
- Validate time ranges (no overlapping bookings)
- Validate parking slot coordinates are positive

### Database-Level
- Unique constraint on email
- Foreign key constraints
- Check constraints on time ranges
- Check constraints on coordinate values

---

## Backup & Recovery

```bash
# Backup database
pg_dump parkease_dev > parkease_backup.sql

# Restore database
psql parkease_dev < parkease_backup.sql

# Backup specific table
pg_dump -t bookings parkease_dev > bookings_backup.sql

# Check backup integrity
pg_restore --list parkease_backup.sql
```

---

## Future Enhancements

- [ ] Payment information table
- [ ] Parking lot zones/areas
- [ ] Vehicle information table
- [ ] Booking cancellation reasons
- [ ] Review/rating system
- [ ] Occupancy time-series data
- [ ] Reservation history (soft deletes)
- [ ] Notifications/alerts

---

**Last Updated**: February 19, 2026  
**PostgreSQL Version**: 15+  
**Prisma Version**: 5.x
