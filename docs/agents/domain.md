# Domain docs

This repository uses a single-context domain documentation layout.

## Layout

- Root context file: `CONTEXT.md`
- Root ADR directory: `docs/adr/`

## Consumer rules for skills

Skills that need domain context should:

1. Read `CONTEXT.md` first for terminology, bounded contexts, and invariants.
2. Read ADRs in `docs/adr/` for architectural decisions and rationale.
3. Prefer existing domain language from these docs over introducing new terms.
4. Flag missing domain guidance and suggest updates when decisions are unclear.

## Future migration

If the repository later adopts multiple contexts, introduce `CONTEXT-MAP.md` at the root and point to per-context `CONTEXT.md` files.
