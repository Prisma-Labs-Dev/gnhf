# Prisma Fork

This directory is the planning and execution surface for the Prisma Labs fork of `gnhf`.

Goal:
- keep the upstream `gnhf` iteration engine intact where possible
- add a modular non-git workflow mode for tracker-driven validation and predefined task execution
- keep the fork thin enough that upstream updates remain easy to pull and rebase

Documents:
- `vision.md` — product intent and target user workflows
- `architecture.md` — fork strategy, extension seams, and maintainability rules
- `implementation-notes.md` — concrete fork iteration notes and validated seam changes
- `tracker-contract.md` — machine-readable tracker schema and selection rules
- `task-tracker.md` — implementation tracker for the fork itself

Guiding rule:
- git-backed code iteration remains a first-class mode
- non-git orchestration is added as a backend, not as a replacement
