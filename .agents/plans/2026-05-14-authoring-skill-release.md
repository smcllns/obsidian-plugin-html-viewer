# HTML Docs authoring skill release

Scope:
- [x] Sync `main` to merged PR #8.
- [x] Rebase PR #7 branch onto theme-token work.
- [x] Update canonical root `SKILL.md` for real theme-token injection.
- [x] Keep `.agents/SKILL.md` as the local-agent mirror.
- [x] Bundle `SKILL.md` into `dist/html-docs/` during build.
- [x] Include bundled `SKILL.md` in release upload/provenance.
- [x] Clarify README optional agent-skill install/discovery.
- [x] Mirror skill to `smcllns/skills`.
- [x] Run build/lint/test checks.
- [x] Push PR branches.
- [x] Merge `smcllns/skills` mirror first so PR #7 docs can point at a real install URL.
- [x] Add `skills.sh` install command to README.

Decisions:
- Plugin repo root `SKILL.md` is the canonical source.
- `.agents/SKILL.md` mirrors the canonical source for local agent discovery.
- `smcllns/skills` is the installable mirror.
- Obsidian plugin install does not install agent skills.
- Plugin runtime must not write to agent install roots or dotfiles.
- Merge/install order matters: public skills mirror first, plugin docs/release second.

Unresolved questions:
- None.
