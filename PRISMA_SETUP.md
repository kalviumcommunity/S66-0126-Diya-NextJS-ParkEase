# Prisma Setup Guide

This document explains how Prisma ORM is configured in ParkEase for type-safe database access.

## Installation

Prisma and the Prisma Client have been installed:

```bash
npm install @prisma/client
npm install -D prisma
```

**Version**: Prisma 5.x (compatible with Node.js 20 and Next.js 16)

## Configuration

### Database Connection

The database connection is configured via environment variables:

**`.env.local`**:
```env
# PostgreSQL connection string
# Format: postgresql://[user]:[password]@[host]:[port]/[database]
DATABASE_URL=postgresql://parkease:parkease_dev@localhost:5432/parkease_dev

# Optional: Direct URL for migrations (required only for some setups)
# DIRECT_DATABASE_URL=postgresql://parkease:parkease_dev@localhost:5432/parkease_dev
```

**For Docker**:
```env
DATABASE_URL=postgresql://parkease:parkease_dev@db:5432/parkease_dev
```

### Prisma Schema

The schema is defined in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

**Key Enums**:
- `UserRole` - USER, ADMIN
- `SlotStatus` - AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE
- `BookingStatus` - PENDING, CONFIRMED, CANCELLED, COMPLETED
- `CrowdAction` - LEFT, OCCUPIED

## Prisma Client Singleton

The Prisma Client is instantiated as a singleton in `src/lib/db.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});
```

**Why singleton?**
- Prevents connection exhaustion during hot reload in development
- Single connection pool shared across the entire application
- Better resource management
- Type-safe queries throughout the app

## Usage Examples

### Import the Prisma Client

```typescript
import { prisma } from '@/lib/db';
```

### Create a User

```typescript
const user = await prisma.user.create({
  data: {
    email: 'john@example.com',
    passwordHash: 'hashed_password',
    name: 'John Doe',
    role: 'USER',
  },
});
```

### Find a User by Email

```typescript
const user = await prisma.user.findUnique({
  where: { email: 'john@example.com' },
});
```

### Get User with Bookings

```typescript
const user = await prisma.user.findUnique({
  where: { email: 'john@example.com' },
  include: {
    bookings: {
      where: { status: 'CONFIRMED' },
      orderBy: { startTime: 'desc' },
    },
  },
});
```

### Check Slot Availability

```typescript
const availableSlots = await prisma.parkingSlot.findMany({
  where: { status: 'AVAILABLE' },
  orderBy: [{ row: 'asc' }, { column: 'asc' }],
});
```

### Find Available Slots for Time Range

```typescript
const availableSlots = await prisma.parkingSlot.findMany({
  where: {
    status: 'AVAILABLE',
    NOT: {
      bookings: {
        some: {
          status: { in: ['PENDING', 'CONFIRMED'] },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      },
    },
  },
  include: { bookings: true },
});
```

### Create a Booking

```typescript
const booking = await prisma.booking.create({
  data: {
    userId: 'user-uuid',
    slotId: 'slot-uuid',
    startTime: new Date(Date.now() + 3600000), // 1 hour from now
    endTime: new Date(Date.now() + 7200000),   // 2 hours from now
    status: 'PENDING',
  },
  include: {
    user: { select: { email: true, name: true } },
    slot: { select: { row: true, column: true } },
  },
});
```

### Update Booking Status

```typescript
const updated = await prisma.booking.update({
  where: { id: 'booking-uuid' },
  data: { status: 'CONFIRMED' },
});
```

### Get Recent Crowd Reports

```typescript
const reports = await prisma.crowdReport.findMany({
  where: {
    slotId: 'slot-uuid',
    timestamp: {
      gte: new Date(Date.now() - 3600000), // Last hour
    },
  },
  orderBy: { timestamp: 'desc' },
  include: { user: { select: { email: true } } },
});
```

### Transaction Example

```typescript
const result = await prisma.$transaction(async (tx) => {
  // Create booking
  const booking = await tx.booking.create({
    data: {
      userId: 'user-uuid',
      slotId: 'slot-uuid',
      startTime,
      endTime,
      status: 'CONFIRMED',
    },
  });

  // Update slot status
  await tx.parkingSlot.update({
    where: { id: 'slot-uuid' },
    data: { status: 'RESERVED' },
  });

  return booking;
});
```

## Migrations

### Create a Migration

After modifying `prisma/schema.prisma`:

```bash
# Create and run migration
npx prisma migrate dev --name add_feature

# Create migration without running
npx prisma migrate dev --create-only --name add_feature
```

### Apply Migrations to Database

```bash
# Apply pending migrations
npx prisma migrate deploy

# Preview migration SQL
npx prisma migrate diff
```

### Reset Database (⚠️ Dangerous)

```bash
# Drop all data and re-run all migrations
npx prisma migrate reset

# Confirmation will be required
```

## Prisma Studio

Interactive database browser and editor:

```bash
npx prisma studio

# Opens browser at http://localhost:5555
```

Use to:
- View all records in each table
- Create/edit/delete data
- Filter and sort records
- Export data

## Database Introspection

If you have an existing database:

```bash
# Pull existing schema into Prisma
npx prisma db pull

# Updates prisma/schema.prisma from actual database
```

## Troubleshooting

### "PrismaClientInitializationError: Can't reach database"

**Problem**: Prisma can't connect to the database

**Solution**:
```bash
# Check DATABASE_URL in .env.local
cat .env.local | grep DATABASE_URL

# Test connection manually
psql "postgresql://parkease:parkease_dev@localhost:5432/parkease_dev"

# Ensure database exists
psql -U parkease -d parkease_dev -c "SELECT 1"
```

### "Prisma schema validation error P1000"

**Problem**: Database authentication failed

**Solution**:
```bash
# Verify credentials
echo "User: parkease"
echo "Password: parkease_dev"
echo "Database: parkease_dev"

# Test with psql
psql -U parkease -d parkease_dev -c "SELECT version();"
```

### Type Errors in IDE

**Problem**: TypeScript can't find Prisma types

**Solution**:
```bash
# Regenerate Prisma client
npx prisma generate

# Restart TypeScript language server in VS Code
# Cmd+Shift+P → TypeScript: Restart TS Server
```

### Too many connections

**Problem**: "FATAL: too many connections"

**Solution**:
```typescript
// Update db.ts with connection pooling
const prisma = new PrismaClient({
  log: ['error'],
  // Limit connection pool
  errorFormat: 'pretty',
});
```

Or in `.env.local`:
```env
# Add connection pool config to URL
DATABASE_URL="postgresql://user:password@localhost:5432/db?schema=public&pool_size=5"
```

### Prisma Generate Failures

**Problem**: `npx prisma generate` fails

**Solution**:
```bash
# Clear Prisma cache
rm -rf node_modules/.prisma

# Reinstall dependencies
npm install

# Regenerate
npx prisma generate
```

## Best Practices

✅ **DO**
- Use Prisma's type system (TypeScript)
- Leverage `include` and `select` for eager loading
- Use transactions for multi-step operations
- Index frequently queried columns
- Use parameterized queries (Prisma prevents SQL injection)

❌ **DON'T**
- Use raw SQL for complex queries (use Prisma methods when possible)
- Create multiple Prisma Client instances
- Expose `prisma.$queryRaw` in API routes without validation
- Use `$queryRaw` for user input (use `$queryRawUnsafe` with extreme caution)
- Forget to handle promise rejections

## Advanced Features

### Raw Queries

```typescript
// Safe (parameterized)
const users = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${email}
`;

// Unsafe - avoid unless necessary
const users = await prisma.$queryRawUnsafe(
  'SELECT * FROM users WHERE email = $1',
  email
);
```

### Aggregations

```typescript
const count = await prisma.booking.count({
  where: { status: 'CONFIRMED' },
});

const stats = await prisma.booking.groupBy({
  by: ['status'],
  _count: true,
});
```

### Batch Operations

```typescript
const results = await prisma.user.createMany({
  data: [
    { email: 'user1@example.com', passwordHash: '...', name: 'User 1', role: 'USER' },
    { email: 'user2@example.com', passwordHash: '...', name: 'User 2', role: 'USER' },
  ],
  skipDuplicates: true,
});
```

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Database Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

**Last Updated**: February 19, 2026  
**Prisma Version**: 5.x  
**Node.js**: 20.20.0
