# FolioVeda Versioning System

## Overview

FolioVeda uses **Semantic Versioning (SemVer)** with automatic version bumping based on conventional commits. The version starts at `1.0.0` and increments on every commit.

## Version Format

Format: `MAJOR.MINOR.PATCH` (e.g., `1.0.0`)

## Auto-Increment Rules

The version bumps automatically based on conventional commit prefixes:

| Commit Type | Version Bump | Example |
|---|---|---|
| `BREAKING CHANGE:` or `feat!:` | MAJOR | `1.0.0` → `2.0.0` |
| `feat:` | MINOR | `1.0.0` → `1.1.0` |
| `fix:`, `chore:`, `docs:`, etc. | PATCH | `1.0.0` → `1.0.1` |

## How It Works

1. **Git Hook**: A `prepare-commit-msg` hook runs before each commit
2. **Message Parsing**: The hook reads your commit message
3. **Version Detection**: Based on the conventional commit prefix, the appropriate version increment is applied
4. **Auto-Update**: `package.json` is automatically updated with the new version
5. **Auto-Staging**: The updated `package.json` is automatically staged

## Examples

### Patch Release (Bug Fix)
```bash
git commit -m "fix: resolve portfolio calculation issue"
# Version: 1.0.0 → 1.0.1
```

### Minor Release (New Feature)
```bash
git commit -m "feat: add transaction export feature"
# Version: 1.0.0 → 1.1.0
```

### Major Release (Breaking Change)
```bash
git commit -m "feat!: redesign portfolio API"
# OR
git commit -m "BREAKING CHANGE: remove legacy fund search endpoint"
# Version: 1.0.0 → 2.0.0
```

## Viewing the Version

### In the UI
- Visit `/about` page to see the current version
- The version is displayed in the About page card

### In Code
```typescript
import packageJson from '../../../package.json';
const version = packageJson.version;

// Or use the utility
import { getVersion } from '@/lib/version';
const version = getVersion();
```

### In Console
```bash
# Check package.json
grep '"version"' package.json

# Or with Node
node -e "console.log(require('./package.json').version)"
```

## Merge Commits

Merge commits are skipped and do not trigger version bumps. The version is bumped only based on the actual commit messages.

## Important Notes

- The hook runs **before** each commit, so the version increment happens automatically
- If the git hook fails to run (rare), you can manually update `package.json` and commit
- The version is stored in `package.json` following npm conventions
- CI/CD pipelines can use this version for builds and releases

## Troubleshooting

### Hook not running
If the `prepare-commit-msg` hook is not executing:
1. Verify the hook file exists: `.git/hooks/prepare-commit-msg`
2. Ensure it's executable: `chmod +x .git/hooks/prepare-commit-msg` (Unix/Mac)
3. Check git config: `git config core.hooksPath`
4. Restart your terminal and try again

### Version not updating
- Ensure your commit message follows conventional commit format
- Check the first line of your commit message (that's what gets parsed)
- Look at the git hook output for any error messages

### Manual Version Update
If needed, you can manually update the version in `package.json`:
```json
{
  "version": "1.2.3"
}
```
Then commit with an appropriate conventional commit message.
