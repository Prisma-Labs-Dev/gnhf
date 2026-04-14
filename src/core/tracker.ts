import { readFileSync } from "node:fs";

export const DEFAULT_TRACKER_STATUSES = [
  "todo",
  "open",
  "unverified",
  "external",
] as const;

export interface TrackerTask {
  id: string;
  title: string;
  status: string;
  objective?: string;
  details?: string;
  acceptanceCriteria?: string[];
  contextFiles?: string[];
}

export interface TrackerFile {
  version: 1;
  tasks: TrackerTask[];
}

export interface TrackerSelectionOptions {
  taskId?: string;
  statuses?: string[];
}

function asTrimmedString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const normalized = value
    .map((entry) => asTrimmedString(entry))
    .filter((entry): entry is string => Boolean(entry));
  return normalized.length > 0 ? normalized : [];
}

function normalizeTask(input: unknown, index: number): TrackerTask {
  if (!input || typeof input !== "object") {
    throw new Error(`Invalid tracker task at index ${index}: expected object.`);
  }
  const task = input as Record<string, unknown>;
  const id = asTrimmedString(task.id);
  const title = asTrimmedString(task.title);
  const status = asTrimmedString(task.status);
  if (!id) throw new Error(`Invalid tracker task at index ${index}: missing id.`);
  if (!title) {
    throw new Error(`Invalid tracker task ${id}: missing title.`);
  }
  if (!status) {
    throw new Error(`Invalid tracker task ${id}: missing status.`);
  }
  return {
    id,
    title,
    status,
    ...asTrimmedString(task.objective)
      ? { objective: asTrimmedString(task.objective) }
      : {},
    ...asTrimmedString(task.details)
      ? { details: asTrimmedString(task.details) }
      : {},
    ...asStringArray(task.acceptanceCriteria)
      ? { acceptanceCriteria: asStringArray(task.acceptanceCriteria) }
      : {},
    ...asStringArray(task.contextFiles)
      ? { contextFiles: asStringArray(task.contextFiles) }
      : {},
  };
}

export function loadTrackerFile(path: string): TrackerFile {
  const raw = readFileSync(path, "utf-8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Failed to parse tracker file ${path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Invalid tracker file ${path}: expected JSON object.`);
  }
  const tracker = parsed as Record<string, unknown>;
  if (tracker.version !== 1) {
    throw new Error(
      `Invalid tracker file ${path}: unsupported version ${String(tracker.version)}.`,
    );
  }
  if (!Array.isArray(tracker.tasks)) {
    throw new Error(`Invalid tracker file ${path}: tasks must be an array.`);
  }
  return {
    version: 1,
    tasks: tracker.tasks.map((task, index) => normalizeTask(task, index)),
  };
}

export function selectTrackerTask(
  tracker: TrackerFile,
  options: TrackerSelectionOptions = {},
): TrackerTask {
  if (options.taskId) {
    const found = tracker.tasks.find((task) => task.id === options.taskId);
    if (!found) {
      throw new Error(`Tracker task not found: ${options.taskId}`);
    }
    return found;
  }
  const statuses = new Set(
    (options.statuses ?? [...DEFAULT_TRACKER_STATUSES])
      .map((status) => status.trim())
      .filter(Boolean),
  );
  const found = tracker.tasks.find((task) => statuses.has(task.status));
  if (!found) {
    throw new Error(
      `No tracker task matched statuses: ${[...statuses].join(", ")}`,
    );
  }
  return found;
}

export function buildPromptFromTrackerTask(task: TrackerTask): string {
  const lines = [
    "You are working on a predefined tracker task.",
    "",
    `Task ID: ${task.id}`,
    `Title: ${task.title}`,
    `Status: ${task.status}`,
    "",
    "Objective:",
    task.objective ?? task.title,
  ];
  if (task.details) {
    lines.push("", "Details:", task.details);
  }
  if (task.acceptanceCriteria && task.acceptanceCriteria.length > 0) {
    lines.push(
      "",
      "Acceptance Criteria:",
      ...task.acceptanceCriteria.map((item) => `- ${item}`),
    );
  }
  if (task.contextFiles && task.contextFiles.length > 0) {
    lines.push("", "Context Files:", ...task.contextFiles.map((item) => `- ${item}`));
  }
  return lines.join("\n");
}
