# Tracker Contract

## Status

Phase 1 contract.

Current scope:
- machine-readable JSON only
- task selection at run start
- single-task iteration writeback

## File Shape

```json
{
  "version": 1,
  "tasks": [
    {
      "id": "BV-010",
      "title": "Investigate skills-remote flapping",
      "status": "open",
      "objective": "Determine whether the probe failures are user-visible.",
      "details": "Inspect logs and direct node invocation behavior.",
      "acceptanceCriteria": [
        "State whether the issue is user-visible",
        "Document current evidence"
      ],
      "contextFiles": [
        "/abs/path/MEMORY.md",
        "/abs/path/bug-validation-matrix.md"
      ]
    }
  ]
}
```

## Required Fields

Per file:
- `version`
- `tasks`

Per task:
- `id`
- `title`
- `status`

## Optional Fields

Per task:
- `objective`
- `details`
- `acceptanceCriteria`
- `contextFiles`
- `execution`

## Selection Rules

### Explicit selection

Use:

```bash
gnhf --tracker-file /abs/path/tracker.json --task-id BV-010
```

Or with the dedicated validation surface:

```bash
gnhf validate --tracker-file /abs/path/tracker.json --state-dir /abs/path/state --task-id BV-010
```

Behavior:
- select the exact task by `id`
- use its metadata to build the prompt

### Automatic selection

Use:

```bash
gnhf --tracker-file /abs/path/tracker.json
```

Or:

```bash
gnhf validate --tracker-file /abs/path/tracker.json --state-dir /abs/path/state
```

Default eligible statuses:
- `todo`
- `open`
- `unverified`
- `external`

Selection behavior:
- first matching task in file order wins

Override statuses with:

```bash
gnhf --tracker-file /abs/path/tracker.json --task-status open,external
```

Or:

```bash
gnhf validate --tracker-file /abs/path/tracker.json --state-dir /abs/path/state --task-status open,external
```

## Prompt Mapping

The selected task is converted into a prompt with:
- task id
- title
- status
- objective or title fallback
- details, if present
- acceptance criteria, if present
- context files, if present

## Writeback Contract

When a run starts from `--tracker-file`, the selected task can be updated after each iteration.

Default behavior:
- write iteration execution metadata into `task.execution`
- keep the task `status` unchanged unless a status override flag is provided

Optional CLI flags:

```bash
gnhf --tracker-file /abs/path/tracker.json \
  --tracker-success-status validated \
  --tracker-failure-status blocked
```

Writeback payload:

```json
{
  "execution": {
    "tool": "gnhf",
    "runId": "run-abc",
    "iteration": 2,
    "updatedAt": "2026-04-14T10:00:00.000Z",
    "outcome": "success",
    "summary": "Validated current behavior",
    "keyChanges": [],
    "keyLearnings": [
      "No user-facing failure observed"
    ]
  }
}
```

Status transition behavior:
- `--tracker-success-status <status>` sets the selected task status after a successful iteration
- `--tracker-failure-status <status>` sets the selected task status after a failed iteration
- if these flags are omitted, writeback records evidence only

## Current Limitations

- no markdown tracker parser yet
- no multi-task queue progression inside a single run yet
- no external context file loading beyond listing paths in the prompt
- writeback is last-iteration only, not a durable history log
- writeback currently rewrites the full JSON tracker file in place

## Planned Next Evolution

Likely next additions:
- multi-entry execution history
- richer per-task outcome/evidence fields
- optional markdown projection layer for human-maintained trackers
