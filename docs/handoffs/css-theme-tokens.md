# CSS Theme Tokens Handoff

Issue: https://github.com/smcllns/obsidian-plugin-html-docs/issues/5

Implemented shape:
- HTML Docs injects a one-way `<style data-html-docs-theme>` block into each rendered HTML blob.
- The iframe sandbox stays unchanged: `allow-scripts allow-popups allow-forms`, no `allow-same-origin`.
- The stable public CSS contract is:
  `--obsidian-bg`, `--obsidian-bg-2`, `--obsidian-text`, `--obsidian-text-muted`,
  `--obsidian-accent`, `--obsidian-border`, `--obsidian-font`, `--obsidian-font-mono`.
- Source values are read from Obsidian's computed styles and resolved through a temporary parent-side probe so iframe values do not depend on parent-only `var(...)` references.
- Open HTML tabs and embeds re-render when the parent `body` theme class changes.

Validation notes:
- `npm test` covers token injection in tab, markdown embed, and Canvas embed modes while preserving cross-origin iframe isolation.
- A live `obsidian-cli` probe verified theme-toggle re-render: injected `color-scheme` changed from `light` to `dark`, then the original light theme was restored.
