# Architecture And Fork Strategy

## Design Constraint

This fork should stay easy to rebase on upstream `kunchenguid/gnhf`.

That means:
- minimize edits to core upstream files
- isolate new behavior behind interfaces
- preserve current upstream defaults unless a new mode is explicitly selected

## Proposed Seams

### 1. Workspace Strategy

Responsibility:
- prepare the working environment
- define rollback behavior
- define success recording behavior
- define cleanup behavior

Interface sketch:

```ts
interface WorkspaceStrategy {
  prepareRun(input: PrepareRunInput): Promise<PreparedRun>;
  snapshot(input: SnapshotInput): Promise<WorkspaceSnapshot>;
  recordSuccess(input: RecordSuccessInput): Promise<void>;
  rollbackFailure(input: RollbackFailureInput): Promise<void>;
  cleanup(input: CleanupInput): Promise<void>;
}
```

Initial implementations:
- `GitBranchWorkspaceStrategy`
- `GitWorktreeWorkspaceStrategy`
- `ExternalStateWorkspaceStrategy`

Rule:
- upstream current behavior should become the `GitBranchWorkspaceStrategy`

### 2. Run Store

Responsibility:
- persist run metadata
- persist notes
- persist base state needed for resume

Current upstream logic:
- `.gnhf/runs/<runId>/...`

Extension:
- allow alternate state roots
- allow run state outside repo root when needed

Interface sketch:

```ts
interface RunStore {
  setupRun(input: SetupRunInput): Promise<RunInfo>;
  resumeRun(input: ResumeRunInput): Promise<RunInfo>;
  appendNotes(input: AppendNotesInput): Promise<void>;
}
```

### 3. Task Provider

Responsibility:
- provide the current objective for this iteration
- optionally select the next item from a queue/tracker

Implementations:
- `StaticObjectiveTaskProvider`
- `TrackerTaskProvider`

Rule:
- the orchestrator loop should request the current task from the provider rather than assuming one static prompt for the whole run

### 4. Context Provider

Responsibility:
- inject durable context into the iteration prompt

Implementations:
- run notes
- external files
- tracker item snapshot

Rule:
- keep prompt assembly modular
- do not bake `MEMORY.md` assumptions into the prompt builder

### 5. Result Recorder

Responsibility:
- record success/failure output beyond run notes
- optionally write back to a tracker

Implementations:
- notes-only
- tracker-writer
- combined notes + tracker

## Minimum Viable Fork

### Phase 1

Extract seam only:
- `WorkspaceStrategy`
- keep behavior identical to upstream

Deliverable:
- no product behavior change
- architecture now allows alternate modes

### Phase 2

Add `ExternalStateWorkspaceStrategy`

Behavior:
- no clean-tree check
- no git branch creation
- no `git reset --hard`
- state stored in configurable directory

Deliverable:
- safe non-git iteration mode

### Phase 3

Add `TrackerTaskProvider`

Behavior:
- choose next task from tracker
- inject selected task into prompt
- persist task result metadata

Deliverable:
- tracker-driven validation loop

## Maintainability Rules

### Keep upstream files shallowly edited

Prefer:
- one-time adapter hooks in `cli.ts`
- one-time strategy plumbing in `orchestrator.ts`
- new modules for fork-specific behavior

Avoid:
- scattering `if (mode === "...")` across many files

### Prefer additive files

Use new directories such as:
- `src/fork/workspaces/`
- `src/fork/tasks/`
- `src/fork/context/`
- `src/fork/recorders/`

### Preserve upstream CLI behavior

Default command without new flags should behave like upstream.

### Separate internal architecture from user-facing command surface

Even if the final UX is:
- `gnhf validate ...`

the internal model should still be strategy/provider based.

## Why Not Fork OMX Instead

`oh-my-codex` is valuable, but it is a much larger runtime platform.

It includes:
- tmux/team runtime
- hooks
- HUD/state systems
- broader Codex workflow layering

That is useful inspiration, but a poor base for a thin maintainable fork of `gnhf`.

## Initial Repository Conventions

Fork-only planning/docs should live under:
- `docs/prisma-fork/`

Fork-only code should eventually live under:
- `src/fork/`

This keeps divergence legible during rebases.
