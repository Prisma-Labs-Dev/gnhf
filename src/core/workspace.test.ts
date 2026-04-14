import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./git.js", () => ({
  commitAll: vi.fn(),
  getBranchCommitCount: vi.fn(() => 0),
  resetHard: vi.fn(),
}));

import { commitAll, getBranchCommitCount, resetHard } from "./git.js";
import {
  createDefaultWorkspaceStrategy,
  createExternalStateWorkspaceStrategy,
  ExternalStateWorkspaceStrategy,
  GitWorkspaceStrategy,
} from "./workspace.js";

const mockCommitAll = vi.mocked(commitAll);
const mockGetBranchCommitCount = vi.mocked(getBranchCommitCount);
const mockResetHard = vi.mocked(resetHard);

describe("workspace strategies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBranchCommitCount.mockReturnValue(0);
  });

  it("git workspace rollback resets the checkout", () => {
    const workspace = new GitWorkspaceStrategy();

    workspace.rollback("/repo");

    expect(mockResetHard).toHaveBeenCalledWith("/repo");
  });

  it("git workspace records success by committing and recounting branch commits", () => {
    mockGetBranchCommitCount.mockReturnValue(3);
    const workspace = new GitWorkspaceStrategy();

    const commitCount = workspace.recordSuccess({
      cwd: "/repo",
      baseCommit: "base123",
      iteration: 2,
      summary: "add validation tests",
    });

    expect(mockCommitAll).toHaveBeenCalledWith(
      "gnhf #2: add validation tests",
      "/repo",
    );
    expect(mockGetBranchCommitCount).toHaveBeenCalledWith("base123", "/repo");
    expect(commitCount).toBe(3);
  });

  it("external-state workspace never performs destructive rollback", () => {
    const workspace = new ExternalStateWorkspaceStrategy();

    workspace.rollback("/repo");

    expect(mockResetHard).not.toHaveBeenCalled();
  });

  it("external-state workspace never writes commits on success", () => {
    const workspace = new ExternalStateWorkspaceStrategy();

    const commitCount = workspace.recordSuccess({
      cwd: "/repo",
      baseCommit: "base123",
      iteration: 2,
      summary: "validate issue",
    });

    expect(mockCommitAll).not.toHaveBeenCalled();
    expect(mockGetBranchCommitCount).not.toHaveBeenCalled();
    expect(commitCount).toBe(0);
  });

  it("external-state workspace always reports zero commit count", () => {
    const workspace = new ExternalStateWorkspaceStrategy();

    expect(workspace.getCommitCount("base123", "/repo")).toBe(0);
    expect(mockGetBranchCommitCount).not.toHaveBeenCalled();
  });

  it("factory helpers return the expected strategy implementations", () => {
    expect(createDefaultWorkspaceStrategy()).toBeInstanceOf(GitWorkspaceStrategy);
    expect(createExternalStateWorkspaceStrategy()).toBeInstanceOf(
      ExternalStateWorkspaceStrategy,
    );
  });
});
