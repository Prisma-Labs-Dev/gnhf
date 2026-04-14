import {
  commitAll,
  getBranchCommitCount,
  resetHard,
} from "./git.js";

export interface RecordSuccessParams {
  cwd: string;
  baseCommit: string;
  iteration: number;
  summary: string;
}

export interface WorkspaceStrategy {
  getCommitCount(baseCommit: string, cwd: string): number;
  rollback(cwd: string): void;
  recordSuccess(params: RecordSuccessParams): number;
}

export class GitWorkspaceStrategy implements WorkspaceStrategy {
  getCommitCount(baseCommit: string, cwd: string): number {
    return getBranchCommitCount(baseCommit, cwd);
  }

  rollback(cwd: string): void {
    resetHard(cwd);
  }

  recordSuccess(params: RecordSuccessParams): number {
    commitAll(`gnhf #${params.iteration}: ${params.summary}`, params.cwd);
    return getBranchCommitCount(params.baseCommit, params.cwd);
  }
}

export function createDefaultWorkspaceStrategy(): WorkspaceStrategy {
  return new GitWorkspaceStrategy();
}
