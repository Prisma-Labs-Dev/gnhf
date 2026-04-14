# Fork Task Tracker

Last updated: 2026-04-14

## Status Legend

| Status | Meaning |
|---|---|
| `todo` | Not started |
| `doing` | In progress |
| `blocked` | Waiting on a decision or dependency |
| `done` | Completed |

## Track

| ID | Task | Status | Notes |
|---|---|---|---|
| F-001 | Fork upstream `kunchenguid/gnhf` into `Prisma-Labs-Dev/gnhf` | `done` | Fork created and local remotes configured (`origin` = Prisma fork, `upstream` = upstream). |
| F-002 | Create repo-local planning surface for the fork | `done` | `docs/prisma-fork/` created with vision, architecture, and tracker docs. |
| F-003 | Confirm smallest viable architecture change for extensibility | `todo` | Decide exact seam insertion points in upstream files. |
| F-004 | Extract `WorkspaceStrategy` while preserving current behavior | `todo` | First code change should be behavior-preserving. |
| F-005 | Add `ExternalStateWorkspaceStrategy` | `todo` | Non-git mode with durable state and no destructive cleanup. |
| F-006 | Define tracker file contract | `todo` | Decide markdown vs JSON vs YAML task format. |
| F-007 | Add `TrackerTaskProvider` | `todo` | Select next task from tracker and inject per-iteration task context. |
| F-008 | Add `ResultRecorder` for tracker updates | `todo` | Persist evidence/status back into tracker. |
| F-009 | Add CLI surface for validation mode | `todo` | Likely a new subcommand or new flags; should not break upstream default UX. |
| F-010 | Write regression tests for git-backed mode parity | `todo` | Ensure upstream default workflow still behaves the same. |
| F-011 | Write tests for external-state non-git mode | `todo` | Validate no git assumptions and no destructive rollback. |

## Current Decision Points

### D-001: Tracker format

Open question:
- should the first tracker backend parse markdown tables, or should it require JSON/YAML for phase 1?

Current lean:
- use a machine-readable format first
- allow markdown projection later

### D-002: CLI surface

Open question:
- should non-git mode be a new subcommand like `gnhf validate`
- or new flags on the existing command

Current lean:
- new subcommand

Reason:
- clearer separation
- lower risk of breaking upstream prompt-driven command shape

### D-003: State root

Open question:
- should external-state mode default under repo `.gnhf/`
- or under a user-provided absolute `--state-dir`

Current lean:
- support both
- require explicit `--state-dir` for non-repo/external workflows
