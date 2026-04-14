import { basename, dirname, join } from "node:path";
import {
  createBranch,
  createWorktree,
  ensureCleanWorkingTree,
  getHeadCommit,
  getRepoRootDir,
  removeWorktree,
} from "./git.js";
import type { RunInfo } from "./run.js";
import { setupRun } from "./run.js";
import {
  createDefaultWorkspaceStrategy,
  createExternalStateWorkspaceStrategy,
  type WorkspaceStrategy,
} from "./workspace.js";
import { slugifyPrompt } from "../utils/slugify.js";

export interface PreparedWorkspaceLaunch {
  runInfo: RunInfo;
  effectiveCwd: string;
  workspace: WorkspaceStrategy;
  worktreePath: string | null;
  cleanup?: () => void;
}

export function initializeGitBranchWorkspace(
  prompt: string,
  cwd: string,
): PreparedWorkspaceLaunch {
  ensureCleanWorkingTree(cwd);
  const baseCommit = getHeadCommit(cwd);
  const branchName = slugifyPrompt(prompt);
  createBranch(branchName, cwd);
  const runId = branchName.split("/")[1]!;
  return {
    runInfo: setupRun(runId, prompt, baseCommit, cwd),
    effectiveCwd: cwd,
    workspace: createDefaultWorkspaceStrategy(),
    worktreePath: null,
  };
}

export function initializeGitWorktreeWorkspace(
  prompt: string,
  cwd: string,
): PreparedWorkspaceLaunch {
  const repoRoot = getRepoRootDir(cwd);
  const baseCommit = getHeadCommit(cwd);
  const branchName = slugifyPrompt(prompt);
  const runId = branchName.split("/")[1]!;
  const worktreePath = join(
    dirname(repoRoot),
    `${basename(repoRoot)}-gnhf-worktrees`,
    runId,
  );
  createWorktree(repoRoot, worktreePath, branchName);
  return {
    runInfo: setupRun(runId, prompt, baseCommit, worktreePath),
    effectiveCwd: worktreePath,
    workspace: createDefaultWorkspaceStrategy(),
    worktreePath,
    cleanup: () => {
      try {
        removeWorktree(cwd, worktreePath);
      } catch {
        // Best-effort cleanup only.
      }
    },
  };
}

export function initializeExternalStateWorkspace(
  prompt: string,
  cwd: string,
  stateRoot: string,
): PreparedWorkspaceLaunch {
  const baseCommit = getHeadCommit(cwd);
  const branchName = slugifyPrompt(prompt);
  const runId = branchName.split("/")[1]!;
  return {
    runInfo: setupRun(runId, prompt, baseCommit, cwd, {
      stateRoot,
      ensureIgnored: false,
    }),
    effectiveCwd: cwd,
    workspace: createExternalStateWorkspaceStrategy(),
    worktreePath: null,
  };
}

export function finalizePreparedWorkspace(
  prepared: PreparedWorkspaceLaunch,
  commitCount: number,
): { preservedWorktree: boolean } {
  if (!prepared.worktreePath) return { preservedWorktree: false };
  if (commitCount > 0) return { preservedWorktree: true };
  prepared.cleanup?.();
  return { preservedWorktree: false };
}
