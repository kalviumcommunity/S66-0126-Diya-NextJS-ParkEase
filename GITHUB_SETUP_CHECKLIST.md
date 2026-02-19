# GitHub Setup Checklist

Use this checklist to complete the GitHub repository setup after pushing the code.

## 1. Repository Settings

- [ ] Go to **Settings** tab
- [ ] Under **General**, set:
  - [ ] Default branch: `main`
  - [ ] Require status checks to pass before merging (recommended)
  - [ ] Include administrators (recommended)

## 2. Branch Protection Rules for `main`

### Access
1. Go to **Settings** → **Branches**
2. Click **Add rule**
3. Enter pattern: `main`

### Configure Protection

#### Required Pull Requests
- [x] Check: **Require a pull request before merging**
- [x] Check: **Require approvals**
- [x] Set: **Number of approvals required**: `1`
- [x] Check: **Require review from Code Owners**
- [x] Check: **Dismiss stale pull request approvals when new commits are pushed**
- [x] Check: **Require approval of the most recent reviewable push**

#### Required Status Checks
- [x] Check: **Require status checks to pass before merging**
- [x] Check: **Require branches to be up to date before merging**
- [x] Add status checks:
  - [ ] `build` (from `.github/workflows/ci.yml`)
  - [ ] `lint` (from `.github/workflows/ci.yml`)
  - [ ] `type-check` (from `.github/workflows/ci.yml`)
  - [ ] `format` (from `.github/workflows/ci.yml`)

#### Enforce Restrictions
- [x] Check: **Require linear history**
- [ ] Check: **Require code owner approvals** (optional)
- [ ] Check: **Restrict who can push to matching branches** (optional)
- [x] Check: **Allow force pushes** → Dismiss pull requests when push happens (recommended)
- [ ] Uncheck: **Allow deletions** (prevent accidental branch deletion)

**✅ Save Protection Rule**

## 3. Configure Code Owners

Code owners file is already created at `.github/CODEOWNERS`

- [x] File exists and is committed
- [x] Default owner is set to `@owner` (replace with your GitHub username)

To customize:
1. Edit `.github/CODEOWNERS`
2. Replace `@owner` with actual GitHub usernames
3. Add team names if using GitHub Teams: `@organization/team-name`

Example:
```
* @developer1 @developer2
/src/lib/auth.ts @security-team
/src/app/api/ @backend-team
```

## 4. GitHub Actions Setup

### Verify Workflows
- [x] `.github/workflows/ci.yml` is committed
- [x] Workflow contains 4 jobs: build, lint, type-check, format
- [x] Node version is `20.20.0`
- [x] Uses `npm ci` and `npm run` commands

### Manual Test (First Time)
1. Create a test PR from a feature branch
2. Verify GitHub Actions runs
3. Check all 4 status checks pass
4. Verify status checks appear in PR

### In GitHub
- [ ] Go to **Actions** tab
- [ ] Verify `CI` workflow is listed
- [ ] Check for any failed runs
- [ ] If failures, investigate and fix

## 5. Pull Request Template

- [x] `.github/PULL_REQUEST_TEMPLATE.md` is committed
- [ ] Verify template appears in new PRs

To test:
1. Create a new PR on GitHub
2. Template fields should auto-populate in PR description

## 6. Team Setup

### Add Team Members
1. Go to **Settings** → **Access** → **Collaborators and teams**
2. Add team members with appropriate roles:
   - `Maintainer` - Can merge PRs, manage settings
   - `Developer` - Can create PRs, push to branches
   - `Read-only` - Can view, cannot push

### Assign Code Owners
If using GitHub Teams:
1. Go to **Settings** → **Code owners and custom properties**
2. Update `.github/CODEOWNERS` with team references:
   ```
   * @organization/core-team
   /src/lib/auth.ts @organization/security-team
   ```

## 7. GitHub Actions Secrets (If Needed)

If your CI needs secrets (API keys, credentials):

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each secret needed by workflows

**Note**: Currently not needed as CI only runs: build, lint, type-check, format

## 8. Environment Configuration

For different deployment environments:

1. Go to **Settings** → **Environments**
2. Create environments: `development`, `staging`, `production`
3. Set environment-specific secrets
4. Configure protection rules (require reviewers, required branches)

**Note**: Set up later when deployment is configured

## 9. Verification Checklist

### Locally (Before First Push)
- [x] Run `npm run build` - succeeds
- [x] Run `npm run lint` - passes
- [x] Run `npm run type-check` - passes
- [x] Run `npm run format:check` - passes
- [x] Create test branch and push
- [ ] Create PR and verify template loads

### On GitHub
- [ ] Branch protection rule shows as active on `main`
- [ ] PR template appears in new PR creation
- [ ] GitHub Actions workflow runs on PR
- [ ] All 4 status checks appear and pass
- [ ] Cannot merge PR without approvals (if rule set)
- [ ] Code owners are notified for review

## 10. Common Issues & Solutions

### Status Checks Don't Appear
**Problem**: GitHub Actions runs but status checks don't show in PR settings

**Solution**:
1. Run first PR to trigger workflow
2. Workflow must complete successfully
3. Go to branch protection rule and add the status checks
4. Check names must match job names in `.github/workflows/ci.yml`

### Code Owners Not Being Notified
**Problem**: Code owners file exists but users not getting review requests

**Solution**:
1. Verify `.github/CODEOWNERS` has correct GitHub usernames/emails
2. Usernames must have `@` prefix: `@username`
3. If using teams: `@organization/team-name`
4. File must be committed to `main` branch

### Cannot Merge Even With Approval
**Problem**: PR approved but merge button disabled

**Solution**:
1. Check if waiting for status checks
2. Ensure branch is up-to-date with `main`
3. All required status checks must pass (not just show)
4. If admins, check if rule applies to you too

### GitHub Actions Fails to Run
**Problem**: Workflow file exists but not running

**Solution**:
1. Check branch is `main` or `develop` (as per `on:` trigger)
2. Verify file location: `.github/workflows/ci.yml`
3. Check GitHub Actions is enabled: **Settings** → **Actions** → **General**
4. Verify workflow syntax: use `.github/workflows/ci.yml` checker

## 11. Post-Setup Testing

### Create Test PR
1. Create test branch: `git checkout -b test/setup`
2. Make small change (e.g., update README)
3. Commit: `git commit -m "test: verify branch protection"`
4. Push: `git push origin test/setup`
5. Create PR on GitHub
6. Verify:
   - [ ] PR template loads
   - [ ] GitHub Actions starts
   - [ ] All 4 checks run (build, lint, type-check, format)
   - [ ] All checks pass ✓
   - [ ] "Ready to merge" shows (if approved)

### Delete Test Branch
```bash
git checkout main
git branch -d test/setup
git push origin --delete test/setup
```

## 12. Documentation

All documentation is committed:
- ✅ `.github/BRANCH_PROTECTION.md` - Detailed setup guide
- ✅ `.github/CODEOWNERS` - Code owner configuration
- ✅ `.github/PULL_REQUEST_TEMPLATE.md` - PR template
- ✅ `.github/workflows/ci.yml` - CI/CD workflow
- ✅ `CONTRIBUTING.md` - Contribution guidelines
- ✅ `README.md` - Updated with GitHub workflow section

## 13. Team Communication

Share with team:
1. Send link to [CONTRIBUTING.md](../CONTRIBUTING.md)
2. Share [BRANCH_PROTECTION.md](./.github/BRANCH_PROTECTION.md)
3. Explain branch naming: `feature/`, `fix/`, `chore/`, `hotfix/`, `docs/`
4. Point to PR template in `.github/`
5. Run team training on workflow (if large team)

---

## Next Steps

After completing this checklist:

1. ✅ Push code to GitHub
2. ⬜ Configure branch protection in GitHub UI
3. ⬜ Test with first PR
4. ⬜ Update `.github/CODEOWNERS` with real usernames
5. ⬜ Communicate workflow to team
6. ✅ Begin development with new workflow

**Documentation**: All files needed are already committed. Refer to [BRANCH_PROTECTION.md](./.github/BRANCH_PROTECTION.md) for detailed instructions.

---

**Status**: Setup files ✅ created and committed
**Next Action**: Log into GitHub and configure branch protection rules
**Time to Complete**: ~15 minutes
