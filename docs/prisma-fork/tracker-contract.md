# Tracker Contract

## Status

Phase 1 contract.

Current scope:
- machine-readable JSON only
- task selection at run start
- no tracker writeback yet

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

## Selection Rules

### Explicit selection

Use:

```bash
gnhf --tracker-file /abs/path/tracker.json --task-id BV-010
```

Behavior:
- select the exact task by `id`
- use its metadata to build the prompt

### Automatic selection

Use:

```bash
gnhf --tracker-file /abs/path/tracker.json
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

## Prompt Mapping

The selected task is converted into a prompt with:
- task id
- title
- status
- objective or title fallback
- details, if present
- acceptance criteria, if present
- context files, if present

## Current Limitations

- no markdown tracker parser yet
- no writeback into the tracker yet
- no multi-task queue progression inside a single run yet
- no external context file loading beyond listing paths in the prompt

## Planned Next Evolution

Likely next additions:
- tracker writeback contract
- per-task outcome recording
- machine-readable evidence/result fields
- optional markdown projection layer for human-maintained trackers
