# Database Seeding Guide

This guide explains how to seed the ParkEase database with initial data.

## What Gets Seeded

The seed script (`prisma/seed.js`) populates the database with:

### 1. **Admin User**
- Email: `admin@parkease.com`
- Password: `admin123` (bcrypt hashed)
- Role: `ADMIN`

### 2. **Parking Slots Grid**
- **Layout**: 5 rows × 10 columns = 50 parking slots
- **Status**: All `AVAILABLE` by default
- **Rows**: 1-5
- **Columns**: 1-10
- **Unique Constraint**: Each slot is identified by (row, column) pair

### 3. **Test Users**
- `user1@parkease.com` - `user3@parkease.com`
- Password: `password1` - `password3` (bcrypt hashed)
- Role: `USER`

### 4. **Sample Bookings**
- 3 bookings for the first 3 parking slots
- **Status**: `CONFIRMED`
- **Time**: Future dates (1, 2, 3 days from seed run)
- **Duration**: 2 hours each
- **Slot Status**: Updates from `AVAILABLE` to `OCCUPIED`

### 5. **Crowd Reports**
- 3 reports for the first 3 slots
- **Actions**: Mix of `OCCUPIED` and `LEFT`
- **Prevention**: Won't create duplicate reports within the last hour

## Running the Seed Script

### First Time Setup
```bash
# Set the database URL
export DATABASE_URL="postgresql://parkease:parkease_dev@localhost:5432/parkease_dev"

# Run the seed script
npm run db:seed
```

### Subsequent Runs
The script is **idempotent** - it can be run multiple times safely:
- Existing users are updated (not recreated)
- Existing slots are skipped
- New bookings and reports are added (with duplicate prevention)

```bash
npm run db:seed
```

## Script Behavior

### Idempotency
- **Users**: Uses `upsert()` - updates if exists, creates if new
- **Parking Slots**: Uses `upsert()` with unique constraint on (row, column)
- **Bookings**: Creates new bookings without checking duplicates
- **Crowd Reports**: Checks for recent reports before creating new ones

### Error Handling
- Handles constraint violations gracefully
- Continues seeding even if individual records fail
- Provides summary of what was created

## Verifying the Seed

### Login with Admin Account
```
Email: admin@parkease.com
Password: admin123
```

### Check Database Content
```bash
# View users
npx prisma studio

# Or query directly
export DATABASE_URL="postgresql://..."
npx prisma db execute --stdin <<EOF
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_slots FROM parking_slots;
SELECT COUNT(*) as total_bookings FROM bookings;
SELECT COUNT(*) as total_reports FROM crowd_reports;
EOF
```

## Customizing the Seed

Edit `prisma/seed.js` to customize:
- Number of rows/columns: Change `rows` and `cols` variables
- Number of test users: Modify the loop count in section 3
- Number of test bookings: Modify the loop count in section 4
- Password values: Update hash values in section 1 & 3

## Resetting the Database

To completely reset and reseed:
```bash
# Drop all data
npx prisma migrate reset

# Then seed
npm run db:seed
```

⚠️ **Warning**: This will delete all data including production data if running against production database!

## Environment Variables

The seed script requires:
- `DATABASE_URL`: PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database`
  - Example: `postgresql://parkease:parkease_dev@localhost:5432/parkease_dev`

Set in `.env.local` or export before running:
```bash
export DATABASE_URL="postgresql://..."
npm run db:seed
```

## Troubleshooting

### Database Connection Error
```
P1001: Can't reach database server
```
**Solution**: Ensure PostgreSQL is running
```bash
docker ps | grep postgres
# or start it with docker run or docker-compose
```

### Environment Variable Not Found
```
Environment variable not found: DATABASE_URL
```
**Solution**: Set DATABASE_URL before running
```bash
export DATABASE_URL="postgresql://parkease:parkease_dev@localhost:5432/parkease_dev"
npm run db:seed
```

### Module Not Found
```
Error: Cannot find module '@prisma/client'
```
**Solution**: Ensure dependencies are installed
```bash
npm install
npx prisma generate
```

## Production Seeding

For production deployments:
1. Do NOT use this seed script with production credentials
2. Create a separate production seed script or database migration
3. Document required initial data (admin account, system slots, etc.)
4. Use `npx prisma migrate deploy` for schema changes only
5. Manually create admin accounts with strong passwords

## Related Commands

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open Prisma Studio (GUI)
npx prisma studio

# Validate schema
npx prisma validate

# View schema
npx prisma format
```
