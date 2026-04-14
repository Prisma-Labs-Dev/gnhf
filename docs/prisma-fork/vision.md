# Vision

## Working Name

Prisma fork of `gnhf` for modular task orchestration.

## Problem

Upstream `gnhf` is strong at one narrow workflow:
- clean git repo
- iterative agent loop
- commit on success
- hard reset on failure
- carry forward run memory via `.gnhf/runs/<id>/notes.md`

That is valuable, but it does not fit every useful agent workflow.

In particular, it does not fit:
- validation work driven by an external tracker
- work against untracked or externally managed files
- iterative triage where the output is tracker state, evidence, or decisions rather than code commits
- mixed environments where some tasks should use git worktrees and some should not

## Product Goal

Evolve `gnhf` into a small orchestration core that can run multiple workspace modes:
- `git-branch` for the current upstream default
- `git-worktree` for isolated parallel code work
- `external-state` for tracker-driven validation without git resets

The orchestrator should be able to:
- pick a predefined task
- inject task context into the iteration prompt
- let the agent make bounded progress
- record the result back into notes and/or a tracker
- continue until the queue is exhausted or a stop condition is hit

## Primary Use Cases

### 1. Git-backed implementation

Example:
- fork or repo work
- agent makes code change
- success becomes a commit
- failure rolls back safely

This is existing `gnhf` strength and should remain the default.

### 2. Tracker-driven validation

Example:
- validate bug notes one by one from a matrix
- inspect logs, config, installed packages, and external surfaces
- write evidence back into a tracker
- no git commits required
- no destructive cleanup against unrelated local state

### 3. Mixed mode execution

Example:
- select next tracker item
- if item requires code, run in git-backed workspace mode
- if item is validation-only, run in external-state mode

## Non-Goals

- Do not turn this into a full workflow platform like OMX.
- Do not add tmux/team/runtime complexity unless a later phase proves it is necessary.
- Do not make the core loop depend on markdown-specific parsing.
- Do not couple the fork to `MEMORY.md` specifically.

## Product Principles

### Thin fork

Changes should cluster around extension seams, not across the whole codebase.

### Backend, not special case

Non-git validation must be implemented as a workspace/task backend, not as a one-off `MEMORY.md` mode.

### Upstream-first mindset

Prefer:
- adapting around upstream behavior
- isolating fork logic in new modules
- avoiding unnecessary rewrites of upstream files

### Durable state

Every long-running mode should keep enough state on disk to resume safely.

### Smallest useful increment

First ship the minimum version that can:
- select a task from a tracker
- run one iteration
- write result metadata back
- avoid destructive git cleanup

## Success Criteria

The fork is successful if it can support both of these cleanly:

1. `gnhf "refactor module X" --worktree`
   Expected behavior:
   - remains close to upstream
   - still commit-driven

2. Tracker-driven validation run against an external file
   Expected behavior:
   - no clean-tree requirement
   - no hard reset against unrelated state
   - writes iteration notes and tracker updates durably

## Initial Example Workflow

Example target command shape:

```bash
gnhf validate \
  --tracker /abs/path/task-tracker.md \
  --task-selector "status in [open,unverified,external]" \
  --context /abs/path/MEMORY.md \
  --workspace-mode external-state \
  --state-dir /abs/path/.gnhf-state
```

This command shape is illustrative, not yet final.
