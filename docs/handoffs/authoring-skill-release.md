# Authoring Skill Release Handoff

Goal:
- Finish PR #7 as a small follow-up to merged PR #8.
- Make the HTML authoring skill useful after theme-token injection shipped.
- Be honest that Obsidian plugin installs do not activate agent skills.

Implemented shape:
- Root `SKILL.md` is the canonical source copy in this plugin repo.
- `.agents/SKILL.md` mirrors root `SKILL.md` for local agent discovery.
- `esbuild.config.mjs` copies root `SKILL.md` to `dist/html-docs/SKILL.md`.
- The release workflow uploads and attests `dist/html-docs/SKILL.md` alongside runtime files.
- README has a short optional agent-skill note with the `skills.sh` command and root `SKILL.md` reference.
- `smcllns/skills` mirrors the canonical skill at `skills/obsidian-html-docs/SKILL.md`.
- `smcllns/skills` PR #1 was merged first so README can point to the real `skills.sh` install command.

Important constraint:
- Plugin runtime must not write to agent install roots, dotfiles, or any other user-level configuration. Agent skill activation belongs to the user's agent tooling, not the Obsidian plugin.
- Merge order matters: public skills mirror first, then plugin docs/release work.

Verification target:
- `bun run build`
- `bun run lint`
- `bun run test`
- Confirm root `SKILL.md`, `.agents/SKILL.md`, and `dist/html-docs/SKILL.md` match.

Current verification:
- `bun run build` passed.
- `bun run lint` passed.
- `bun run test` passed against live Obsidian.
- Root `SKILL.md`, `.agents/SKILL.md`, generated `dist/html-docs/SKILL.md`, and the `smcllns/skills` mirror match.
- Haiku critical review found one stale `light-dark()` wording mismatch; fixed by keeping `light-dark()` in the supported CSS list.
