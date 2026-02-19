# Environment Variables - Quick Reference

## Initial Setup (One-time)

```bash
# 1. Copy template
cp .env.example .env.local

# 2. Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# 3. Add to .env.local and update other required vars
nano .env.local

# 4. Verify
test -f .env.local && echo "✓ Ready"
```

## Required Variables to Update

```env
DATABASE_URL=postgresql://user:password@localhost:5432/parkease_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=<generated-by-openssl>
JWT_REFRESH_SECRET=<generated-by-openssl>
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_S3_BUCKET=parkease-dev-bucket
SENDGRID_API_KEY=<your-sendgrid-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Client-Side Variables (Browser Accessible)

Only variables prefixed with `NEXT_PUBLIC_` are available in the browser:

```typescript
// ✓ Available in browser
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

// ✗ Not available in browser
const dbUrl = process.env.DATABASE_URL;
```

## Server-Side Access

```typescript
import { config } from '@/lib/env';

// ✓ All vars available on server
const dbUrl = config.DATABASE_URL;
const jwtSecret = config.JWT_SECRET;
```

## Security Rules

| ✅ DO | ❌ DON'T |
|-------|---------|
| Use strong secrets (32+ chars) | Hardcode secrets in code |
| Rotate secrets quarterly | Commit .env.local to git |
| Store in Secrets Manager (prod) | Log environment variables |
| Validate on startup | Expose secrets to client |
| Different secrets per environment | Share .env.local files |

## Verify Setup

```bash
# Check if .env.local exists
test -f .env.local && echo "✓ .env.local exists"

# Check required variables are set
grep -E "DATABASE_URL|JWT_SECRET|AWS_" .env.local | wc -l

# Start development server
npm run dev
```

## Common Issues

| Issue | Solution |
|-------|----------|
| "Missing required environment variables" | Run: `cp .env.example .env.local` and fill values |
| "Cannot connect to database" | Verify PostgreSQL running and `DATABASE_URL` correct |
| Variables undefined in browser | Add `NEXT_PUBLIC_` prefix to variable name |
| "Invalid JWT Secret" | Generate new: `openssl rand -base64 32` |

## Documentation

- **Full Guide**: [ENV_SETUP.md](./ENV_SETUP.md)
- **README**: [README.md](./README.md#environment-variables)
- **Type-safe Access**: [src/lib/env.ts](./src/lib/env.ts)

---

**⚠️ Never commit `.env.local` - It's in `.gitignore` for security**
