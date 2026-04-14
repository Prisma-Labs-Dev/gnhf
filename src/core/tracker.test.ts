import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs", () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

import { readFileSync, writeFileSync } from "node:fs";
import {
  applyTrackerWriteback,
  buildPromptFromTrackerTask,
  DEFAULT_TRACKER_STATUSES,
  loadTrackerFile,
  selectTrackerTask,
} from "./tracker.js";

const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);

describe("tracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads a valid tracker file", () => {
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        version: 1,
        tasks: [{ id: "BV-001", title: "Check issue", status: "unverified" }],
      }),
    );

    const tracker = loadTrackerFile("/tracker.json");

    expect(tracker.tasks).toEqual([
      { id: "BV-001", title: "Check issue", status: "unverified" },
    ]);
  });

  it("selects the first task matching default statuses", () => {
    const selected = selectTrackerTask({
      version: 1,
      tasks: [
        { id: "A", title: "Done item", status: "fixed" },
        { id: "B", title: "Open item", status: DEFAULT_TRACKER_STATUSES[1] },
      ],
    });

    expect(selected.id).toBe("B");
  });

  it("selects an explicit task by id", () => {
    const selected = selectTrackerTask(
      {
        version: 1,
        tasks: [
          { id: "A", title: "First", status: "fixed" },
          { id: "B", title: "Second", status: "done" },
        ],
      },
      { taskId: "B" },
    );

    expect(selected.title).toBe("Second");
  });

  it("builds a prompt from tracker task metadata", () => {
    const prompt = buildPromptFromTrackerTask({
      id: "BV-010",
      title: "Investigate skills-remote flapping",
      status: "open",
      objective: "Determine whether the probe failures are user-visible.",
      acceptanceCriteria: ["Reproduce issue", "Document impact"],
      contextFiles: ["/abs/path/MEMORY.md"],
    });

    expect(prompt).toContain("Task ID: BV-010");
    expect(prompt).toContain("Determine whether the probe failures are user-visible.");
    expect(prompt).toContain("- Reproduce issue");
    expect(prompt).toContain("- /abs/path/MEMORY.md");
  });

  it("writes iteration metadata back into the tracker file", () => {
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        version: 1,
        tasks: [{ id: "BV-010", title: "Investigate", status: "open" }],
      }),
    );

    applyTrackerWriteback({
      path: "/tracker.json",
      taskId: "BV-010",
      runId: "run-abc",
      iteration: 2,
      success: true,
      summary: "Validated current behavior",
      keyChanges: [],
      keyLearnings: ["No user-facing failure observed"],
      timestamp: "2026-04-14T10:00:00.000Z",
      successStatus: "validated",
    });

    expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
    const written = JSON.parse(mockWriteFileSync.mock.calls[0]?.[1] as string);
    expect(written.tasks[0].status).toBe("validated");
    expect(written.tasks[0].execution).toEqual({
      tool: "gnhf",
      runId: "run-abc",
      iteration: 2,
      updatedAt: "2026-04-14T10:00:00.000Z",
      outcome: "success",
      summary: "Validated current behavior",
      keyChanges: [],
      keyLearnings: ["No user-facing failure observed"],
    });
  });
});
