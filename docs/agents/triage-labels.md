# Triage labels

This repository uses the default label vocabulary for triage state transitions.

## Canonical role to label mapping

- needs-triage -> needs-triage
- needs-info -> needs-info
- ready-for-agent -> ready-for-agent
- ready-for-human -> ready-for-human
- wontfix -> wontfix

## Guidance

- Apply exactly one state label at a time during triage.
- Move issues forward by replacing the previous state label with the new one.
- If labels do not yet exist in the tracker, create them with these exact names.
