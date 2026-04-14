import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs", () => ({
  readFileSync: vi.fn(),
}));

import { readFileSync } from "node:fs";
import {
  buildPromptFromTrackerTask,
  DEFAULT_TRACKER_STATUSES,
  loadTrackerFile,
  selectTrackerTask,
} from "./tracker.js";

const mockReadFileSync = vi.mocked(readFileSync);

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
});
