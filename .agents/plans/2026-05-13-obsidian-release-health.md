# Obsidian Release Health

Status: complete

- [x] Confirm official Obsidian review/release sources.
- [x] Add official Obsidian lint check locally.
- [x] Fix issues surfaced by official lint.
- [x] Add CI/release workflow guardrails.
- [x] Preserve duplicate-tab regression test.
- [x] Run `npm run release:check`.
- [x] Add `CONTRIBUTING.md` to clarify bug reports vs feature forks.
- [x] Tighten E2E cleanup so it preserves unrelated user tabs.
- [x] Verify E2E cleanup with a live sentinel `.html` tab.

Unresolved questions:

- Whether Obsidian's new community-site scorecard has a private runner beyond the public `eslint-plugin-obsidianmd` and release validation logic.
