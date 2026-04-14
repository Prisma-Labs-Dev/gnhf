# Implementation Notes

## Iteration 1: Behavior-Preserving Workspace Seam

Date: 2026-04-14

### Goal

Create the smallest real extension seam for workspace behavior without changing default upstream behavior.

### What Changed

Added:
- `src/core/workspace.ts`

Introduced:
- `WorkspaceStrategy`
- `GitWorkspaceStrategy`
- `createDefaultWorkspaceStrategy()`

Refactored:
- `src/core/orchestrator.ts`

### Current Boundary

The new workspace seam currently owns:
- branch/worktree commit count calculation
- rollback on failure
- rollback on stop
- success commit + updated commit count

This keeps the first extraction small.

### Intentionally Deferred

The following still remain outside the seam for now:
- branch creation in `cli.ts`
- worktree creation/removal in `cli.ts`
- run-store location and resume behavior in `run.ts`
- prompt/task selection
- tracker persistence

### Why This Cut

This cut was chosen because:
- it removes the main git mutation logic from `Orchestrator`
- it keeps CLI behavior unchanged
- it creates a clear next step for `ExternalStateWorkspaceStrategy`
- it minimizes rebase pain against upstream

### Validation

Validated locally with:

```bash
npm run typecheck
npm test -- --run src/core/orchestrator.test.ts src/core/git.test.ts
```

Result:
- typecheck passed
- targeted orchestrator/git tests passed (`34` tests)

### Next Step

Next architectural extraction should cover run preparation in `cli.ts`:
- current branch mode
- worktree mode
- cleanup/preservation hooks

That can either:
- remain a second seam later
- or be unified under a broader workspace factory once external-state mode is added

## Iteration 2: Git Workspace Launch Seam

Date: 2026-04-14

### Goal

Move git-backed run preparation out of `cli.ts` into a dedicated launch module without changing behavior.

### What Changed

Added:
- `src/core/workspace-launch.ts`

Introduced:
- `PreparedWorkspaceLaunch`
- `initializeGitBranchWorkspace()`
- `initializeGitWorktreeWorkspace()`
- `finalizePreparedWorkspace()`

Refactored:
- `src/cli.ts`

### Current Boundary

The launch seam now owns:
- new branch run setup
- worktree run setup
- worktree cleanup/preserve decision
- injection of the default workspace strategy for git-backed runs

### Intentionally Deferred

The following are still not generalized:
- gnhf-branch resume/overwrite decision flow
- alternate run-store roots
- external-state mode
- tracker selection and result recording

### Validation

Validated locally with:

```bash
npm run typecheck
npm test -- --run src/cli.test.ts src/core/orchestrator.test.ts src/core/git.test.ts
```

Result:
- typecheck passed
- focused CLI/orchestrator/git tests passed (`59` tests)

### Why This Matters

This gives the fork a clear separation between:
- runtime workspace behavior in `src/core/workspace.ts`
- git-backed workspace launch behavior in `src/core/workspace-launch.ts`

That makes the next step more straightforward:
- add a non-git launch path
- keep upstream git mode intact

## Iteration 3: External-State MVP

Date: 2026-04-14

### Goal

Ship the first usable non-git workspace mode while keeping the upstream branch/worktree modes unchanged.

### What Changed

Added:
- `ExternalStateWorkspaceStrategy` in `src/core/workspace.ts`
- `initializeExternalStateWorkspace()` in `src/core/workspace-launch.ts`

Extended:
- `src/core/run.ts` with `RunStoreOptions`
- `setupRun(..., options)` and `resumeRunWithOptions(...)`

CLI:
- added `--workspace-mode <mode>`
- added `--state-dir <dir>`

### Current External-State Behavior

When launched with:

```bash
gnhf "..." --workspace-mode external-state --state-dir /abs/path
```

the run:
- still executes against the current working directory
- stores run state under `/abs/path/.gnhf/runs/<runId>/`
- does not create git branches or worktrees
- does not commit on success
- does not reset or clean the repo on failure

### Why This Is Enough For MVP

This is already enough to support:
- validation-oriented iteration
- evidence gathering loops
- durable notes/logs outside the repo
- safe execution where destructive git cleanup would be wrong

### Still Missing

This is not yet tracker-driven orchestration.

Still missing:
- task selection from a tracker
- result writeback into a tracker
- resume semantics for external-state runs beyond direct run-store reuse
- machine-readable task backend

### Validation

Validated locally with:

```bash
npm run typecheck
npm test -- --run src/cli.test.ts src/core/run.test.ts src/core/orchestrator.test.ts src/core/git.test.ts
```

Result:
- typecheck passed
- focused test suite passed (`85` tests)
