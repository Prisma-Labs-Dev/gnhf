import { beforeEach, describe, expect, it, vi } from "vitest";
import { slugifyPrompt } from "../utils/slugify.js";

vi.mock("./git.js", () => ({
  createBranch: vi.fn(),
  createWorktree: vi.fn(),
  ensureCleanWorkingTree: vi.fn(),
  getHeadCommit: vi.fn(() => "head123"),
  getRepoRootDir: vi.fn(() => "/repo"),
  removeWorktree: vi.fn(),
}));

vi.mock("./run.js", () => ({
  setupRun: vi.fn(() => ({
    runId: "run-abc",
    runDir: "/state/.gnhf/runs/run-abc",
    promptPath: "/state/.gnhf/runs/run-abc/prompt.md",
    notesPath: "/state/.gnhf/runs/run-abc/notes.md",
    schemaPath: "/state/.gnhf/runs/run-abc/output-schema.json",
    logPath: "/state/.gnhf/runs/run-abc/gnhf.log",
    baseCommit: "head123",
    baseCommitPath: "/state/.gnhf/runs/run-abc/base-commit",
  })),
}));

import {
  createBranch,
  createWorktree,
  ensureCleanWorkingTree,
  getHeadCommit,
  getRepoRootDir,
  removeWorktree,
} from "./git.js";
import { setupRun } from "./run.js";
import {
  finalizePreparedWorkspace,
  initializeExternalStateWorkspace,
} from "./workspace-launch.js";

const mockCreateBranch = vi.mocked(createBranch);
const mockCreateWorktree = vi.mocked(createWorktree);
const mockEnsureCleanWorkingTree = vi.mocked(ensureCleanWorkingTree);
const mockGetHeadCommit = vi.mocked(getHeadCommit);
const mockGetRepoRootDir = vi.mocked(getRepoRootDir);
const mockRemoveWorktree = vi.mocked(removeWorktree);
const mockSetupRun = vi.mocked(setupRun);

describe("workspace launch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetHeadCommit.mockReturnValue("head123");
    mockGetRepoRootDir.mockReturnValue("/repo");
  });

  it("initializes external-state runs without git branch or worktree mutation", () => {
    const prompt = "validate tracker behavior";
    const runId = slugifyPrompt(prompt).split("/")[1]!;

    const prepared = initializeExternalStateWorkspace(
      prompt,
      "/repo",
      "/state",
    );

    expect(mockGetHeadCommit).toHaveBeenCalledWith("/repo");
    expect(mockSetupRun).toHaveBeenCalledWith(runId, prompt, "head123", "/repo", {
      stateRoot: "/state",
      ensureIgnored: false,
    });
    expect(mockEnsureCleanWorkingTree).not.toHaveBeenCalled();
    expect(mockCreateBranch).not.toHaveBeenCalled();
    expect(mockCreateWorktree).not.toHaveBeenCalled();
    expect(mockRemoveWorktree).not.toHaveBeenCalled();
    expect(prepared.effectiveCwd).toBe("/repo");
    expect(prepared.worktreePath).toBeNull();
    expect(
      prepared.workspace.recordSuccess({
        cwd: "/repo",
        baseCommit: "head123",
        iteration: 1,
        summary: "validate tracker behavior",
      }),
    ).toBe(0);
  });

  it("does not invoke cleanup when finalizing a non-worktree launch", () => {
    const cleanup = vi.fn();

    const result = finalizePreparedWorkspace(
      {
        runInfo: mockSetupRun("run-abc", "prompt", "head123", "/repo", {
          stateRoot: "/state",
          ensureIgnored: false,
        }),
        effectiveCwd: "/repo",
        workspace: initializeExternalStateWorkspace(
          "prompt",
          "/repo",
          "/state",
        ).workspace,
        worktreePath: null,
        cleanup,
      },
      0,
    );

    expect(cleanup).not.toHaveBeenCalled();
    expect(result).toEqual({ preservedWorktree: false });
  });

  it("cleans up empty worktrees but preserves worktrees with commits", () => {
    const cleanup = vi.fn();
    const prepared = {
      runInfo: mockSetupRun("run-abc", "prompt", "head123", "/repo", {
        stateRoot: "/state",
        ensureIgnored: false,
      }),
      effectiveCwd: "/repo",
      workspace: initializeExternalStateWorkspace("prompt", "/repo", "/state")
        .workspace,
      worktreePath: "/repo-gnhf-worktrees/run-abc",
      cleanup,
    };

    expect(finalizePreparedWorkspace(prepared, 0)).toEqual({
      preservedWorktree: false,
    });
    expect(cleanup).toHaveBeenCalledTimes(1);

    cleanup.mockClear();

    expect(finalizePreparedWorkspace(prepared, 2)).toEqual({
      preservedWorktree: true,
    });
    expect(cleanup).not.toHaveBeenCalled();
  });
});
