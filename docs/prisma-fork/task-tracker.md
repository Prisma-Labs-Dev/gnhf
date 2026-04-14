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
| F-003 | Confirm smallest viable architecture change for extensibility | `done` | Exact first seam chosen: orchestrator-owned workspace behavior only, leaving CLI branch/worktree setup unchanged for now. |
| F-004 | Extract `WorkspaceStrategy` while preserving current behavior | `done` | Added `src/core/workspace.ts` and refactored `Orchestrator` to use it. Typecheck + targeted tests passed. |
| F-005 | Add `ExternalStateWorkspaceStrategy` | `done` | External-state mode shipped with explicit CLI flags. It stores run state outside the repo and avoids commits/resets. |
| F-006 | Define tracker file contract | `done` | Phase 1 contract is JSON-only and documented in `docs/prisma-fork/tracker-contract.md`. |
| F-007 | Add `TrackerTaskProvider` | `done` | Run-start task selection shipped via `--tracker-file`, `--task-id`, and `--task-status`. |
| F-008 | Add `ResultRecorder` for tracker updates | `done` | Tracker writeback shipped with iteration outcome metadata plus optional success/failure status transitions. |
| F-009 | Add CLI surface for validation mode | `done` | Dedicated `gnhf validate` subcommand now wraps tracker-backed external-state runs while leaving the default git workflow untouched. |
| F-010 | Write regression tests for git-backed mode parity | `done` | Added direct launch-path coverage for branch/worktree setup and cleanup so the upstream git-first workflow is pinned independently of broader CLI tests. |
| F-011 | Write tests for external-state non-git mode | `done` | Added direct coverage for `ExternalStateWorkspaceStrategy` and external-state launch/finalization so non-git mode is pinned against destructive rollback regressions. |

## Current Decision Points

### D-001: Tracker format

Open question:
- should the first tracker backend parse markdown tables, or should it require JSON/YAML for phase 1?

Current lean:
- use a machine-readable format first
- allow markdown projection later

Current decision:
- JSON first

Reason:
- easiest to validate
- lowest parser complexity
- easiest to extend with writeback fields later

### D-002: CLI surface

Open question:
- should non-git mode be a new subcommand like `gnhf validate`
- or new flags on the existing command

Current lean:
- start with flags, keep a subcommand open for tracker-specific flows later

Reason:
- flags were the smallest safe way to ship the external-state backend without disturbing upstream command behavior
- a subcommand may still make sense later once task-provider/tracker semantics are added

### D-003: State root

Open question:
- should external-state mode default under repo `.gnhf/`
- or under a user-provided absolute `--state-dir`

Current lean:
- support both
- require explicit `--state-dir` for non-repo/external workflows
