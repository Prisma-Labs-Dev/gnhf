import {
  applyTrackerWriteback,
  type TrackerWritebackOptions,
} from "./tracker.js";

export interface IterationResultRecord {
  runId: string;
  iteration: number;
  success: boolean;
  summary: string;
  keyChanges: string[];
  keyLearnings: string[];
  timestamp: Date;
}

export interface ResultRecorder {
  recordIteration(record: IterationResultRecord): void;
}

export class NoopResultRecorder implements ResultRecorder {
  recordIteration(_record: IterationResultRecord): void {
    // Intentionally empty.
  }
}

export class TrackerResultRecorder implements ResultRecorder {
  constructor(private options: TrackerWritebackOptions) {}

  recordIteration(record: IterationResultRecord): void {
    applyTrackerWriteback({
      ...this.options,
      runId: record.runId,
      iteration: record.iteration,
      success: record.success,
      summary: record.summary,
      keyChanges: record.keyChanges,
      keyLearnings: record.keyLearnings,
      timestamp: record.timestamp.toISOString(),
    });
  }
}

export function createDefaultResultRecorder(): ResultRecorder {
  return new NoopResultRecorder();
}
