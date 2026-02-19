# ParkEase - Smart Parking Management System

A modern, full-stack parking management platform built with Next.js, TypeScript, Tailwind CSS, PostgreSQL, and Redis. ParkEase solves parking discovery chaos in crowded cities through real-time crowd-sourced data and intelligent slot booking.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Project Structure](#project-structure)
- [Code Quality](#code-quality)
- [Testing](#testing)
- [Deployment](#deployment)
- [Documentation](#documentation)

## Prerequisites

- **Node.js**: >= 20.9.0 (currently using 18.18.0 - upgrade recommended)
- **npm**: >= 10.9.0
- **PostgreSQL**: 14+ (for local development or Docker)
- **Redis**: 6+ (for caching and sessions)
- **Git**: For version control

### Optional
- **Docker & Docker Compose**: For containerized local development
- **AWS Account**: For S3, SES, and deployment to ECS
- **SendGrid Account**: For transactional emails

## Project Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd parkease
npm install
```

### 2. Environment Variables Setup

#### Step 1: Create Local Environment File

```bash
cp .env.example .env.local
```

#### Step 2: Configure .env.local

Edit `.env.local` and fill in the required values:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/parkease_dev

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your_32_char_minimum_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_chars

# AWS S3 (for file uploads)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_key_id
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=parkease-dev-bucket

# Email Service
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Environment Variable Guidelines

#### Client-Side Variables (Exposed to Browser)
Only variables prefixed with `NEXT_PUBLIC_` are exposed to the client:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_TIMEOUT=5000
```

**✓ Safe to expose** (non-sensitive, client-facing URLs/configs)
**✗ Never expose** (secrets, API keys, database credentials)

#### Server-Side Variables (Node.js Runtime Only)
All variables are available on the server without the `NEXT_PUBLIC_` prefix:

```env
DATABASE_URL          # ✓ Server-side only
JWT_SECRET           # ✓ Server-side only
AWS_SECRET_ACCESS_KEY # ✓ Server-side only
```

#### Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore`
2. **Use `.env.example`** - Template for team reference
3. **Rotate secrets regularly** - Especially `JWT_SECRET`
4. **Use strong secrets** - Minimum 32 characters for cryptographic keys:
   ```bash
   # Generate secure secrets
   openssl rand -base64 32
   ```
5. **Store secrets in CI/CD** - Use GitHub Actions Secrets, AWS Secrets Manager
6. **Validate environment variables** - Server startup should fail if required vars missing

#### Accessing Environment Variables in Code

**Server-side (Next.js API routes, getServerSideProps):**
```typescript
const dbUrl = process.env.DATABASE_URL; // ✓ Available

function handler(req: NextApiRequest, res: NextApiResponse) {
  const jwtSecret = process.env.JWT_SECRET; // ✓ Available
  // ...
}
```

**Client-side (React components):**
```typescript
// src/components/Layout.tsx
export function Layout() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL; // ✓ Available
  const secret = process.env.JWT_SECRET; // ✗ Undefined
}
```

**Accessing in Next.js config:**
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  env: {
    DATABASE_URL: process.env.DATABASE_URL, // ✓ Build-time
  },
};
```

## Development

### Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload

# Building
npm run build            # Build for production
npm start               # Start production server

# Code Quality
npm run lint            # Check for linting errors
npm run lint:fix        # Auto-fix linting errors
npm run format          # Format code with Prettier
npm run format:check    # Check formatting without changes

# Type Checking
npm run type-check      # Run TypeScript compiler check
```

### Development Workflow

1. **Create feature branch**: `git checkout -b feature/feature-name`
2. **Write code** with TypeScript strict mode enabled
3. **Format on save**: VS Code auto-formats via Prettier
4. **Pre-commit checks**: Husky runs ESLint and Prettier on staged files
5. **Commit**: `git commit -m "feat: describe changes"`

### Pre-commit Hooks

Husky automatically runs on `git commit`:
- **ESLint** checks TypeScript syntax and rules
- **Prettier** formats code consistently
- Prevents commits with formatting or linting issues

To skip (not recommended): `git commit --no-verify`

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Auth pages
│   ├── map/               # Parking map pages
│   ├── bookings/          # Booking pages
│   ├── admin/             # Admin dashboard
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
│
├── components/             # Reusable UI components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ParkingGrid.tsx
│   └── ui/                # UI primitives
│
├── lib/                    # Utilities & helpers
│   ├── db.ts             # Prisma client
│   ├── auth.ts           # Auth utilities
│   ├── validators.ts     # Zod schemas
│   └── utils.ts          # Helper functions
│
├── hooks/                  # Custom React hooks
├── context/                # React context providers
└── types/                  # TypeScript definitions

public/                     # Static assets
```

See [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) for detailed organization.

## Code Quality

### TypeScript Strict Mode
All TypeScript files enforce:
- ✓ `strict: true` - All strict type checks
- ✓ `noUnusedLocals: true` - No unused variables
- ✓ `noImplicitReturns: true` - All code paths return

### Linting with ESLint
- Enforces code style consistency
- Detects potential bugs
- Integrates with VS Code

```bash
npm run lint      # Check errors
npm run lint:fix  # Auto-fix errors
```

### Code Formatting with Prettier
- Consistent code style across team
- 100-character line width
- Single quotes, semicolons, 2-space indentation

```bash
npm run format     # Format all files
npm run format:check  # Check without changes
```

### IDE Setup (VS Code)

1. Install extensions:
   - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
   - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

2. Settings auto-configured via `.vscode/settings.json`:
   - Format on save: Enabled
   - Auto-fix on save: Enabled

See [CODE_QUALITY.md](./CODE_QUALITY.md) for detailed configuration.

## Testing

```bash
# Unit tests (when configured)
npm run test

# Test coverage
npm run test:coverage

# E2E tests (when configured)
npm run test:e2e
```

## Deployment

### Docker Build

```bash
docker build -t parkease:latest .
docker run -p 3000:3000 --env-file .env.production parkease:latest
```

### Environment for Production

1. Create `.env.production` with production values
2. Use AWS Secrets Manager or similar for sensitive data
3. Set environment variables in deployment platform (ECS, Azure App Service, etc.)

### Cloud Deployment

See [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) for detailed deployment architecture.

## Documentation

- [**PROJECT_CONTEXT.md**](../PROJECT_CONTEXT.md) - Full project specification, architecture, API design
- [**CODE_QUALITY.md**](./CODE_QUALITY.md) - TypeScript, ESLint, Prettier, Husky configuration
- [**FOLDER_STRUCTURE.md**](./FOLDER_STRUCTURE.md) - Project directory organization

## Common Issues

### Port 3000 Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
npm run dev
```

### Node Version Mismatch
```bash
# Upgrade Node.js
nvm install 20.9.0
nvm use 20.9.0
```

### Missing Environment Variables
```bash
# Check which vars are missing
cat .env.local | grep "="
# Compare with .env.example
```

### ESLint/Prettier Conflicts
```bash
npm run lint:fix
npm run format
```

## Getting Help

- Check [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) for architecture questions
- Review [CODE_QUALITY.md](./CODE_QUALITY.md) for linting/formatting issues
- Check Next.js docs: https://nextjs.org/docs
- TypeScript docs: https://www.typescriptlang.org/docs

## License

Proprietary - ParkEase Team

## Contributing

1. Create feature branch from `main`
2. Follow code quality guidelines
3. Ensure all tests pass
4. Submit pull request

---

**Last Updated**: February 19, 2026
**Node Version**: >= 20.9.0 (recommended)
**Package Manager**: npm >= 10.9.0
