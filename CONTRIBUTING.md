# Contributing to ParkEase

Thank you for contributing to ParkEase! This document provides guidelines for contributing to the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Branch Naming Conventions](#branch-naming-conventions)
- [Development Workflow](#development-workflow)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Quality Standards](#code-quality-standards)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help each other grow
- Report issues appropriately

## Getting Started

### Prerequisites
- Node.js >= 20.9.0
- npm >= 10.9.0
- Git
- PostgreSQL (for local database)
- Redis (for caching)

### Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd parkease

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your local configuration

# 4. Start development server
npm run dev
```

## Branch Naming Conventions

All branches must follow these naming patterns:

### Feature Branches
For new features and functionality:
```
feature/<feature-name>
feature/parking-slot-grid
feature/jwt-authentication
feature/user-profile-page
```

### Fix Branches
For bug fixes:
```
fix/<bug-name>
fix/booking-overlap-validation
fix/redis-connection-timeout
fix/email-notification-failure
```

### Chore Branches
For maintenance, dependencies, and refactoring:
```
chore/<task-name>
chore/update-dependencies
chore/improve-error-handling
chore/refactor-api-routes
```

### Hotfix Branches
For critical production fixes:
```
hotfix/<issue-name>
hotfix/critical-security-vulnerability
hotfix/database-connection-leak
```

### Documentation Branches
For documentation updates:
```
docs/<doc-name>
docs/api-reference
docs/deployment-guide
docs/architecture-decisions
```

### Naming Rules
- Use lowercase letters
- Use hyphens to separate words (not underscores)
- Keep names concise but descriptive (max 50 characters)
- Include issue number if applicable: `feature/add-payment-123`

### Invalid Names ❌
```
Feature/ParkingGrid        # Wrong: camelCase
feature_parking_grid       # Wrong: underscores
feature/PARKING-GRID       # Wrong: UPPERCASE
parking-grid              # Wrong: missing prefix
```

## Development Workflow

### 1. Create Feature Branch

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch from main
git checkout -b feature/my-feature
```

### 2. Make Changes

```bash
# Write code following project standards
# Changes are automatically formatted via pre-commit hooks

# Stage changes
git add src/

# Commit with meaningful message
git commit -m "feat: add parking slot filtering by availability"
```

### 3. Push and Create PR

```bash
# Push to remote
git push origin feature/my-feature

# Create pull request on GitHub
# Fill out the PR template completely
```

### 4. Code Review & Merge

- Address reviewer feedback
- Ensure all checks pass
- Merge when approved

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (Prettier, ESLint)
- **refactor**: Code refactoring without feature/fix
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build, deps, config changes

### Examples

```bash
# Feature
git commit -m "feat(auth): implement JWT token refresh mechanism"

# Fix
git commit -m "fix(booking): prevent double-booking of same slot"

# Documentation
git commit -m "docs(api): update parking slots endpoint documentation"

# Refactoring
git commit -m "refactor(api): extract validation logic to separate utility"

# With breaking change
git commit -m "feat(api)!: change booking response format"
```

### Rules
- Use present tense ("add feature" not "added feature")
- Keep subject line under 50 characters
- Capitalize the subject line
- Use imperative mood (as if giving a command)
- Include issue reference: `fix: resolve bug (closes #123)`

## Pull Request Process

### Before Creating PR
1. ✅ Code is written and tested locally
2. ✅ All linting checks pass: `npm run lint`
3. ✅ Code is formatted: `npm run format`
4. ✅ Tests pass: `npm run test`
5. ✅ No console errors or warnings
6. ✅ Branch is up-to-date with `main`

### PR Requirements
1. **Title**: Use format `[FEATURE|FIX|CHORE] Brief description`
   ```
   [FEATURE] Add real-time parking availability updates
   [FIX] Fix booking validation edge case
   [CHORE] Update dependencies
   ```

2. **Description**: Complete the PR template
   - Clear description of changes
   - Link related issues
   - Explain testing approach
   - Add screenshots for UI changes

3. **Code Quality**
   - All status checks must pass
   - No merge conflicts
   - Code coverage maintained or improved

4. **Reviews**
   - At least 1 approval required
   - Address all feedback
   - Respond to comments

### After Approval
- Ensure branch is up-to-date with main
- Squash commits if multiple small changes: `git rebase -i main`
- Merge with "Create a merge commit" option
- Delete branch after merge

## Code Quality Standards

### TypeScript
- Strict mode enabled: `strict: true`
- No unused variables: `noUnusedLocals: true`
- All functions typed
- Avoid `any` type (use `unknown` instead)

### Naming Conventions

**Files and Folders**
```
src/components/ParkingGrid.tsx        # Components: PascalCase
src/lib/validators.ts                 # Utils: camelCase
src/hooks/useBooking.ts               # Hooks: useXxxx
src/types/booking.ts                  # Types: camelCase
```

**Variables and Functions**
```typescript
// Constants: UPPER_SNAKE_CASE
const MAX_BOOKING_HOURS = 24;
const DEFAULT_PAGE_SIZE = 10;

// Variables & Functions: camelCase
let isLoading = false;
function validateEmail(email: string) {}

// Types & Interfaces: PascalCase
type BookingStatus = 'PENDING' | 'CONFIRMED';
interface User {
  id: string;
  email: string;
}

// Classes: PascalCase
class BookingService {}
```

### Code Style

**Imports**
```typescript
// Group imports: React first, then packages, then local
import React from 'react';
import { useEffect } from 'react';

import axios from 'axios';
import { format } from 'date-fns';

import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
```

**Formatting**
- Line length: 100 characters max
- Indentation: 2 spaces
- Semicolons: Required
- Trailing commas: ES5 format
- Quotes: Single quotes preferred

### Testing

```typescript
// Test file naming: ComponentName.test.ts
// Describe-it structure:

describe('ParkingGrid', () => {
  it('should render slots', () => {
    // Test implementation
  });

  it('should handle slot click', () => {
    // Test implementation
  });
});
```

### Comments

```typescript
// Good: Explains why, not what
// Retry with exponential backoff for transient failures
let retries = 0;

// Avoid: States the obvious
// Set retries to 0
let retries = 0;

// Use JSDoc for public APIs
/**
 * Calculates available slots for a given time window
 * @param startTime - Start of time window
 * @param endTime - End of time window
 * @returns Array of available slot IDs
 */
function getAvailableSlots(startTime: Date, endTime: Date): string[] {
  // Implementation
}
```

## Running Tests & Checks

```bash
# Linting
npm run lint          # Check for errors
npm run lint:fix      # Auto-fix errors

# Formatting
npm run format        # Format all files
npm run format:check  # Check without changes

# Type checking
npm run type-check    # Run TypeScript compiler

# All checks at once
npm run lint && npm run format:check
```

## Common Issues & Solutions

### Pre-commit Hook Failing
```bash
# Husky prevents commits with linting/formatting issues
# Fix and retry:
npm run lint:fix
npm run format
git add .
git commit -m "your message"
```

### Branch Out of Sync
```bash
# Update from main and rebase
git fetch origin
git rebase origin/main

# If conflicts, resolve them and continue
git rebase --continue
```

### Need to Update PR After Review
```bash
# Make changes
git add .
git commit -m "Address feedback: improve error handling"
git push origin feature/my-feature

# PR automatically updates
```

## Getting Help

- **Questions?** Open a discussion
- **Found a bug?** Report an issue with reproduction steps
- **Need review?** Tag reviewers in your PR
- **Stuck?** Ask on team Slack or create a discussion

---

**Thank you for contributing to ParkEase! 🚀**
