# Agent / contributor gates

## Mandatory before done, commit, or push

Run from the repo root:

```bash
npm run verify
```

This runs **`npm run build`** then **`npm test`**. Both must pass.

- Do not claim work is complete while `verify` fails.
- Do not push a red build or failing unit tests to `main`.
- Pure markdown-only edits may skip this; when unsure, run it.

CI (`.github/workflows/ci.yml`) also runs lint, build, and unit tests on pushes/PRs to `main`.
