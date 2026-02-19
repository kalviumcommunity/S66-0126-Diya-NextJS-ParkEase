# Code Quality & Type Safety Configuration

## Overview
Comprehensive setup for TypeScript strict mode, code linting with ESLint, code formatting with Prettier, and pre-commit hooks with Husky.

## TypeScript Configuration (`tsconfig.json`)

### Strict Mode Settings
```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

- **strict**: Enables all strict type-checking options
- **noUnusedLocals**: Error on unused local variables
- **noUnusedParameters**: Error on unused function parameters
- **noImplicitReturns**: Error when function doesn't return on all paths
- **noFallthroughCasesInSwitch**: Error on unintended fallthrough in switch cases

## ESLint Configuration (`.eslintrc.json`)

### Setup
- **Parser**: `@typescript-eslint/parser` for TypeScript support
- **Base Config**: `eslint:recommended`
- **Environment**: Browser, ES2021, Node.js

### Key Rules
- ✅ Disallow unused variables (with `^_` prefix exception for intentional unused params)
- ⚠️ Warn on `any` types
- ⚠️ Warn on console usage (allow for `warn` and `error`)
- ✅ No unused parameters

### Scripts
```bash
npm run lint              # Check for lint errors
npm run lint:fix         # Auto-fix lint errors
```

## Prettier Configuration (`.prettierrc`)

### Formatting Rules
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "bracketSpacing": true,
  "endOfLine": "lf"
}
```

- **Print Width**: 100 characters (balanced for readability and screen space)
- **Single Quotes**: For consistency with JavaScript/TypeScript conventions
- **Trailing Commas**: ES5 compatible format
- **Arrow Parens**: Always include parentheses in arrow functions

### Scripts
```bash
npm run format           # Format all files
npm run format:check    # Check formatting without changing files
```

## Husky & lint-staged Setup

### Pre-commit Hook (`.husky/pre-commit`)
Automatically runs on `git commit` to ensure code quality:
```bash
npx lint-staged
```

### lint-staged Configuration (`package.json`)
```json
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "src/**/*.{json,css,md}": [
      "prettier --write"
    ]
  }
}
```

**Workflow:**
1. Stage files with `git add`
2. Run `git commit`
3. Pre-commit hook automatically:
   - Runs ESLint and fixes errors
   - Runs Prettier to format code
   - Only commits if all checks pass
4. Prevents bad code from reaching the repository

## VS Code Integration (`.vscode/settings.json`)

Configured for seamless development:
- **Default Formatter**: Prettier
- **Format on Save**: Enabled
- **Format on Paste**: Enabled
- **Auto-fix on Save**: ESLint
- **TypeScript SDK**: Local workspace version

## File Exclusions (`.prettierignore`)

Excludes from formatting:
- Dependencies: `node_modules`, `.pnp`, `coverage`
- Build artifacts: `.next`, `dist`, `build`, `out`
- Environment files: `.env*`
- IDE/OS files: `.vscode`, `.idea`, `.DS_Store`

## Usage Workflow

### During Development
1. Write code in your editor
2. VS Code auto-formats on save via Prettier
3. ESLint errors highlighted in real-time

### Before Committing
```bash
# Manually check/fix if needed
npm run lint:fix
npm run format

# Then commit
git commit -m "Your message"
```

The pre-commit hook ensures quality even if manual checks are skipped.

### Continuous Integration (Future)
```bash
npm run lint         # Will fail if errors found
npm run format:check # Will fail if formatting issues found
npm run build        # TypeScript compilation with strict checks
```

## Best Practices

1. **Intentional Type Ignores**: Use `// eslint-disable-next-line @typescript-eslint/no-explicit-any` for rare cases
2. **Unused Parameters**: Prefix with `_` if intentionally unused: `function(_unusedParam) {}`
3. **Console Logs**: Use `console.warn()` or `console.error()` to avoid violations
4. **Breaking Changes**: Husky hook runs on commit—fix issues before attempting to commit
5. **Team Consistency**: All team members have identical formatting via shared config files

## Dependencies Installed

```json
{
  "devDependencies": {
    "eslint": "^8",
    "@typescript-eslint/eslint-plugin": "^latest",
    "@typescript-eslint/parser": "^latest",
    "prettier": "^3.8.1",
    "husky": "^9.1.7",
    "lint-staged": "^15.5.2"
  }
}
```

## Troubleshooting

### Husky hook not running on commit
```bash
# Re-install Husky
npm install husky --save-dev
npx husky install
```

### ESLint can't find files
- Ensure files are in `src/` directory with `.ts` or `.tsx` extension
- Check `.eslintrc.json` ignorePatterns if needed

### Prettier conflicts with ESLint
- ESLint is configured to focus on code quality, Prettier on formatting
- lint-staged runs ESLint first, then Prettier to avoid conflicts

## Related Files
- [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) - Full project specification
- [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) - Project directory organization
- `tsconfig.json` - TypeScript compiler options
- `package.json` - Dependencies and npm scripts
