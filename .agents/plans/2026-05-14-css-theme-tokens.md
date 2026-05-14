# CSS Theme Tokens

Status: in progress

Scope:
- [x] Merge docs PR #6 and sync `main`
- [ ] Add failing E2E coverage for injected Obsidian theme tokens
- [ ] Inject a one-way `:root` theme-token snapshot into HTML iframes
- [ ] Apply to tab, markdown embed, and Canvas embed renders
- [ ] Re-render open HTML views/embeds when Obsidian theme classes change
- [ ] Document the supported `--obsidian-*` CSS contract
- [ ] Run release checks and prepare PR

Unresolved questions:
- Exact token list: start with issue #5's minimal eight-token contract unless implementation evidence says otherwise.
- Theme-toggle update path: start with re-render on parent body class changes.
