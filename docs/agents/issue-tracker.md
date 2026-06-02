# Issue tracker

This repository uses GitHub Issues as the source of truth for work tracking.

## Location

- Repository: pluginArch/core
- Tracker: GitHub Issues

## How skills should operate

Skills that create, read, or update issues should use GitHub workflows and the `gh` CLI.

Examples:

- Create issue: `gh issue create`
- View issue: `gh issue view <number>`
- List issues: `gh issue list`

## Notes

- Use repository labels and milestones when available.
- Keep issue titles action-oriented and concise.
- Prefer linking PRs back to issues for traceability.
