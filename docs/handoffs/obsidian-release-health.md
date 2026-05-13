# Obsidian Release Health Handoff

This branch adds local and CI checks to catch Obsidian community-directory review issues before publishing.

Official sources used:

- `docs.obsidian.md` release docs: directory reads root `manifest.json`, then installs assets from the GitHub release matching `manifest.version`; plugin is not installable until automated review passes.
- `obsidianmd/eslint-plugin`: official ESLint rules for Obsidian developer guidelines.
- `obsidianmd/obsidian-sample-plugin`: current sample plugin build/lint workflow pattern.
- `obsidianmd/obsidian-releases`: legacy/public validation workflow for plugin entries and manifest/release checks.

Important changes:

- `npm run lint` now runs `eslint-plugin-obsidianmd`.
- `npm run release:check` runs build, official lint, and the live Obsidian E2E test.
- GitHub CI runs build + lint on Node 20 and 22.
- Release workflow now runs lint before attestation/release creation.
- `CONTRIBUTING.md` was added to satisfy the missing contributing guide health signal while preserving the project policy: bug reports are welcome, feature expansion should happen in forks.
- Lint surfaced and fixed:
  - `Vault.getFileByPath` was newer than `minAppVersion: 1.4.0`; replaced with `getAbstractFileByPath` plus `instanceof TFile`.
  - Direct `contentEl.style.*` assignment violated Obsidian's no hardcoded styling rule; moved dimensions to CSS variables via `setCssProps`.
  - The `openLinkText` wrapper needed a typed bound original function.

Verification:

- `npm run release:check` passed against the live Obsidian vault.
- `git diff --check` passed.

Remaining caveat:

- `npm audit` still reports the existing moderate esbuild advisory for the dev server path. This repo uses esbuild build/watch, not `serve`, so it was left out of this change.
