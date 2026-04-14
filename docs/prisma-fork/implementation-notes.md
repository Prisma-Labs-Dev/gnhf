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
