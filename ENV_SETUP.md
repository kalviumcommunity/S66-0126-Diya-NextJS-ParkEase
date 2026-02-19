# Environment Variables Setup Guide

## Overview

ParkEase uses environment variables to configure the application for different environments (development, staging, production). This guide explains how to set up and manage them.

## Files

- **`.env.local`** - Local development variables (git-ignored, not committed)
- **`.env.example`** - Template showing all available variables (committed to repo)
- **`.env.production`** - Production variables (never commit, use deployment platform secrets)

## Quick Start

### 1. Create Local Environment File

```bash
cp .env.example .env.local
```

### 2. Fill in Required Values

Edit `.env.local` and update these required variables:

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/parkease_dev

# Cache (Redis)
REDIS_URL=redis://localhost:6379

# Authentication Secrets (generate secure values)
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-base64-32>

# Cloud Storage (AWS S3)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_S3_BUCKET=parkease-dev-bucket

# Email Service
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=<your-sendgrid-key>

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Verify Setup

```bash
# Check if .env.local exists and has required vars
test -f .env.local && echo "✓ .env.local created" || echo "✗ .env.local missing"
```

## Variable Categories

### 🔐 Required (Production Critical)

Must be set before running the application:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for signing access tokens | `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | `openssl rand -base64 32` |
| `AWS_REGION` | AWS region | `ap-south-1` |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key | Provided by AWS |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | Provided by AWS |
| `AWS_S3_BUCKET` | S3 bucket name | `parkease-dev-bucket` |
| `EMAIL_PROVIDER` | Email service (`sendgrid` or `ses`) | `sendgrid` |
| `NEXT_PUBLIC_APP_URL` | Application URL (exposed to client) | `http://localhost:3000` |

### 📧 Email Configuration (One Required)

Choose either SendGrid or AWS SES:

**SendGrid Option:**
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=sg_live_xxxxxxxxxxxxx
```

**AWS SES Option:**
```env
EMAIL_PROVIDER=ses
AWS_SES_REGION=ap-south-1
AWS_SES_FROM_EMAIL=noreply@parkease.local
```

### ⚙️ Optional (Defaults Provided)

Can be left blank to use defaults:

| Variable | Default | Usage |
|----------|---------|-------|
| `JWT_EXPIRY` | `15m` | Access token expiration |
| `JWT_REFRESH_EXPIRY` | `7d` | Refresh token expiration |
| `LOG_LEVEL` | `info` | Logging verbosity |
| `API_TIMEOUT` | `30000` | API request timeout (ms) |
| `MAX_REQUEST_SIZE` | `10mb` | Max request body size |
| `DATABASE_POOL_MAX` | `20` | Max DB connections |
| `DATABASE_POOL_MIN` | `2` | Min DB connections |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |

### 🚀 Feature Flags

Enable/disable optional features:

```env
FEATURE_WEBSOCKET=false          # Real-time updates (Phase 2)
FEATURE_PAYMENT=false            # Payment integration (Phase 2)
FEATURE_REPUTATION_SYSTEM=false  # User reputation (Phase 2)
```

### 🔍 Monitoring & Analytics

Optional third-party services:

```env
SENTRY_DSN=                      # Error tracking
GOOGLE_ANALYTICS_ID=             # Analytics
```

## Environment Variable Access

### Client-Side (Browser)

Only variables with `NEXT_PUBLIC_` prefix are exposed:

```typescript
// src/components/App.tsx
export function App() {
  // ✓ Available in browser
  const url = process.env.NEXT_PUBLIC_APP_URL;

  // ✗ Will be undefined in browser
  const secret = process.env.JWT_SECRET;

  // ✗ Will be undefined in browser
  const db = process.env.DATABASE_URL;
}
```

**Safe to expose:**
- Application URLs
- Public API endpoints
- Feature flags
- Public configuration

**Never expose:**
- Database credentials
- API keys/secrets
- Private keys
- Third-party secrets

### Server-Side (Node.js)

All variables are available on the server:

```typescript
// src/lib/db.ts (server-side)
import { config } from '@/lib/env';

// ✓ All available
const dbUrl = config.DATABASE_URL;
const jwtSecret = config.JWT_SECRET;
const awsKey = config.AWS_SECRET_ACCESS_KEY;
```

**Server-side safe zones:**
- Next.js API routes (`app/api/`)
- `getServerSideProps`
- Middleware
- Server components
- Server utilities

### Using the Env Utility

TypeScript-safe environment variable access:

```typescript
// src/lib/env.ts - Provides validated config
import { config, isProduction, isDevelopment } from '@/lib/env';

// Type-checked access
const dbUrl = config.DATABASE_URL;
const jwtSecret = config.JWT_SECRET;

// Environment checks
if (isProduction) {
  // Production-specific logic
}

if (isDevelopment) {
  // Development-specific logic
}
```

## Security Best Practices

### ✅ DO

1. **Keep `.env.local` in `.gitignore`**
   - File is already ignored, never commit secrets

2. **Generate Strong Secrets**
   ```bash
   # Generate 32-character base64 secret
   openssl rand -base64 32
   ```

3. **Use Different Secrets Per Environment**
   - Development: One set of secrets
   - Staging: Different set
   - Production: Different set

4. **Rotate Secrets Periodically**
   - Update `JWT_SECRET` quarterly
   - Update `AWS_SECRET_ACCESS_KEY` after developer leaves

5. **Store in Secrets Manager**
   - AWS Secrets Manager (production)
   - GitHub Actions Secrets (CI/CD)
   - Azure Key Vault (Azure deployments)

6. **Validate at Startup**
   - Call `validateEnv()` on server startup
   - Fail fast if required vars missing

7. **Mask Secrets in Logs**
   - Never log environment variables
   - Use masking in error messages

### ❌ DON'T

1. **Don't commit `.env.local`** - Even accidentally
2. **Don't use short secrets** - Minimum 32 characters
3. **Don't hardcode secrets** - Always use env vars
4. **Don't expose secrets in client code** - Never use in browser
5. **Don't share `.env.local` files** - Each developer sets their own
6. **Don't log environment variables** - Could leak secrets
7. **Don't use same secrets everywhere** - Vary by environment

## Development Setup

### Local PostgreSQL

```bash
# Using Docker
docker run -d \
  --name postgres \
  -e POSTGRES_DB=parkease_dev \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:14-alpine

# Update .env.local
DATABASE_URL=postgresql://postgres:password@localhost:5432/parkease_dev
```

### Local Redis

```bash
# Using Docker
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine

# Update .env.local
REDIS_URL=redis://localhost:6379
```

### AWS Credentials (Development)

```bash
# Using AWS CLI configuration
aws configure

# Update .env.local with IAM user credentials
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### SendGrid API Key

1. Create SendGrid account: https://sendgrid.com
2. Generate API key: Settings → API Keys
3. Update `.env.local`:
   ```env
   SENDGRID_API_KEY=SG_xxxxxxxxxxxxxx
   ```

## Production Deployment

### AWS Elastic Container Service (ECS)

1. **Create Secrets in AWS Secrets Manager**
   ```bash
   aws secretsmanager create-secret \
     --name parkease/prod/env \
     --secret-string '{
       "DATABASE_URL": "...",
       "REDIS_URL": "...",
       "JWT_SECRET": "...",
       ...
     }'
   ```

2. **Reference in ECS Task Definition**
   ```json
   {
     "environment": [
       {
         "name": "NODE_ENV",
         "value": "production"
       }
     ],
     "secrets": [
       {
         "name": "DATABASE_URL",
         "valueFrom": "arn:aws:secretsmanager:region:account:secret:parkease/prod/env:DATABASE_URL::"
       }
     ]
   }
   ```

3. **Deploy Task**
   ```bash
   aws ecs update-service \
     --cluster production \
     --service parkease \
     --force-new-deployment
   ```

### GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and push Docker image
        env:
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
          JWT_SECRET: ${{ secrets.PROD_JWT_SECRET }}
          AWS_ACCESS_KEY_ID: ${{ secrets.PROD_AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.PROD_AWS_SECRET_ACCESS_KEY }}
        run: docker build -t parkease:latest .
```

## Troubleshooting

### "Missing required environment variables"

**Cause**: Required env var not set in `.env.local`

**Fix**:
```bash
# Check which variables are set
env | grep -E "DATABASE_URL|JWT_SECRET|AWS_"

# Compare with .env.example
diff -u .env.example .env.local

# Add missing variables
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env.local
```

### "Cannot connect to database"

**Cause**: Invalid `DATABASE_URL` format or database not running

**Fix**:
```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Test connection
psql "$DATABASE_URL"

# Update .env.local with correct URL
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### "Invalid JWT Secret"

**Cause**: Secret too short (< 32 characters)

**Fix**:
```bash
# Generate new secure secret
openssl rand -base64 32

# Update .env.local
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
```

### Variables not available in client code

**Cause**: Variable not prefixed with `NEXT_PUBLIC_`

**Fix**:
```env
# ✗ Won't work in browser
APP_NAME=ParkEase

# ✓ Will work in browser
NEXT_PUBLIC_APP_NAME=ParkEase
```

## Next Steps

1. ✅ Copy `.env.example` to `.env.local`
2. ✅ Fill in required variables
3. ✅ Set up PostgreSQL and Redis
4. ✅ Test with `npm run dev`
5. ✅ Read [README.md](./README.md) for development workflow

---

**Last Updated**: February 19, 2026
**Version**: 1.0
