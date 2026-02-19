# GitHub Branch Protection Rules

This document describes the branch protection rules for the ParkEase repository on GitHub.

## How to Set Up Branch Protection Rules

Follow these steps to configure branch protection rules in GitHub:

### 1. Navigate to Repository Settings
1. Go to your GitHub repository
2. Click **Settings** (gear icon)
3. In the sidebar, click **Branches**
4. Click **Add rule** under "Branch protection rules"

### 2. Configure Rule for Main Branch

#### Pattern
```
main
```
(Or select the `main` branch if available)

#### Protection Settings

### ✅ Require Pull Request Reviews
1. Check: **Require a pull request before merging**
2. Check: **Require approvals**
3. Set **Number of approvals required**: 1
4. Check: **Require review from Code Owners** (optional)
5. Check: **Dismiss stale pull request approvals when new commits are pushed**
6. Check: **Require approval of the most recent reviewable push**

**Purpose**: Ensures code is reviewed before merging

### ✅ Require Status Checks to Pass
1. Check: **Require status checks to pass before merging**
2. Check: **Require branches to be up to date before merging**
3. Add the following required status checks:
   - `build`
   - `lint`
   - `type-check`
   - `test`
   - `coverage` (if configured)

**Purpose**: Ensures code quality gates are met

### ✅ Require Linear History
1. Check: **Require linear history**

**Purpose**: Maintains clean commit history without merge commits

### Additional Recommended Settings

1. Check: **Require code reviews from code owners**
   - Requires approvals from designated code owners (`.github/CODEOWNERS`)

2. Check: **Restrict who can push to matching branches**
   - Allows admins to push without PR (for emergencies)

3. Check: **Allow force pushes → Dismiss pull requests when push happens**
   - Prevents force pushes to main

4. Check: **Allow deletions**
   - Prevent accidental branch deletion (leave unchecked)

### Example Configuration

```
Main Branch Protection Rule:
├── Require pull request reviews
│   ├── ✓ Require approvals (1 reviewer minimum)
│   ├── ✓ Dismiss stale PR reviews
│   └── ✓ Require latest push approval
├── Require status checks to pass
│   ├── ✓ Require up-to-date branches
│   ├── ✓ build
│   ├── ✓ lint
│   ├── ✓ type-check
│   └── ✓ test
├── ✓ Require linear history
├── ✓ Require code owner reviews
└── ✓ Prevent force pushes
```

## GitHub Actions for Status Checks

The following CI/CD checks should be configured via GitHub Actions (`.github/workflows/`):

### Example: `ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20.20.0'
      - run: npm ci
      - run: npm run build
        name: build

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20.20.0'
      - run: npm ci
      - run: npm run lint
        name: lint

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20.20.0'
      - run: npm ci
      - run: npm run type-check
        name: type-check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20.20.0'
      - run: npm ci
      - run: npm run test
        name: test
```

## Code Owners File

Create `.github/CODEOWNERS` to require reviews from specific people:

```
# Default owners for all files
* @maintainer1 @maintainer2

# Specific teams/people for areas
/src/lib/auth.ts @auth-team
/src/lib/db.ts @database-team
/src/app/api/ @backend-team
```

## Protected Branch Workflow

### For Regular Contributors

```
1. Create feature branch
   └─> git checkout -b feature/my-feature

2. Make changes and commit
   └─> Husky runs pre-commit checks automatically

3. Push and create PR
   └─> github.com/[repo]/pull/new

4. Automated checks run
   ├─> build ✓
   ├─> lint ✓
   ├─> type-check ✓
   └─> test ✓

5. Code review required
   └─> At least 1 approval needed

6. Branch must be up-to-date
   └─> Rebase if main has new commits

7. Merge to main
   └─> All checks pass, approved, linear history maintained
```

### For Admins (Emergency Hotfix)

If critical production issue, admins can:
1. Create hotfix branch: `hotfix/critical-issue`
2. Request emergency review (async)
3. Use "Bypass rule" to merge without waiting for all reviews
4. Document the bypass in PR

## Merging Strategies

### Recommended: Squash and Merge
```
# Before merge
feature/my-feature (5 commits)
  commit 1: feat: add feature
  commit 2: fix: address feedback
  commit 3: docs: update docs
  commit 4: style: format code
  commit 5: refactor: improve logic

# After merge
main (1 new commit)
  commit: feat: add feature (squashes all 5 commits)
```

Benefits:
- Clean main branch history
- Easy to revert entire features
- Clear commit messages in main

### Alternative: Rebase and Merge
```
# Before merge
feature/my-feature (3 commits)
  commit 1: feat: add feature
  commit 2: fix: address feedback
  commit 3: refactor: improve logic

# After merge
main (3 new commits)
  commit 1: feat: add feature
  commit 2: fix: address feedback
  commit 3: refactor: improve logic
```

Benefits:
- Maintains detailed commit history
- Better blame tracking
- Requires good commit messages

### Not Recommended: Create a Merge Commit
- Creates extra merge commits
- Clutters history
- Harder to revert

## Bypassing Protection Rules

### When to Bypass
- ❌ Convenience/laziness
- ❌ Minor documentation changes
- ❌ Avoiding code review
- ✅ Critical security fixes (documented)
- ✅ Production hotfixes (with async review)

### How to Bypass (Admins Only)
1. In PR, click "Merge without waiting for reviews" (if enabled)
2. Document the bypass reason
3. Notify team in Slack
4. Schedule post-merge review

### After Bypass
- [ ] Document decision
- [ ] Notify team immediately
- [ ] Schedule follow-up review
- [ ] Add tests if missing

## Monitoring & Maintenance

### Review Branch Protection Quarterly
1. Check if rules still align with team size/velocity
2. Review failed check patterns
3. Adjust required approvers if needed
4. Update status checks if new tools added

### Failed Check Troubleshooting

**Build fails**
→ Fix dependencies or build config

**Lint fails**
→ Run `npm run lint:fix` locally

**Type-check fails**
→ Fix TypeScript errors, run `npm run type-check`

**Test fails**
→ Debug and fix test, run `npm run test`

## Best Practices

✅ **DO**
- Keep branch protection rules simple and clear
- Require status checks that matter
- Review PRs promptly (aim for 24 hours)
- Squash commits for cleaner history
- Use PR template for consistency
- Document bypass decisions

❌ **DON'T**
- Require too many approvers (slows velocity)
- Enable rules you don't enforce
- Bypass rules for convenience
- Force push to main
- Merge without passing checks
- Leave stale branches

---

**For questions or updates, refer to [CONTRIBUTING.md](./CONTRIBUTING.md)**
