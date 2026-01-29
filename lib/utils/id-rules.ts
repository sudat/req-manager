const NON_AREA_CHARS = /[^A-Z0-9_]/g;

const pad = (value: string | number, length: number) =>
  String(value).padStart(length, "0");

const BT_ID_REGEX = /^BT-([A-Z0-9_]+)-(\d{4})$/;
const SF_ID_REGEX = /^SF-([A-Z0-9_]+)-(\d{4})$/;
const LEGACY_TASK_REGEX = /^([A-Z0-9_]+)-(\d{4})$/;
const LEGACY_TASK_NUMBER_REGEX = /^TASK-(\d{3,4})$/;
const LEGACY_SRF_REGEX = /^SRF-(\d{3,4})$/;

export type IdSpec = {
  prefix: string;
  padLength: number;
};

export type BtIdParts = {
  area: string;
  seq: string;
};

export type SfIdParts = {
  area?: string;
  seq: string;
};

export const normalizeAreaCode = (value: string): string => {
  return value.toUpperCase().replace(NON_AREA_CHARS, "");
};

export const parseBtId = (id: string): BtIdParts | null => {
  const match = BT_ID_REGEX.exec(id);
  if (!match) return null;
  return { area: match[1], seq: match[2] };
};

export const parseTaskIdForAreaSeq = (id: string): BtIdParts | null => {
  const bt = parseBtId(id);
  if (bt) return bt;
  const legacyMatch = LEGACY_TASK_REGEX.exec(id);
  if (legacyMatch && legacyMatch[1] !== "BT") {
    return { area: legacyMatch[1], seq: legacyMatch[2] };
  }
  return null;
};

export const parseLegacyTaskNumber = (id: string): string | null => {
  const match = LEGACY_TASK_NUMBER_REGEX.exec(id);
  if (!match) return null;
  return pad(match[1], 4);
};

export const parseSfId = (id: string): SfIdParts | null => {
  const sfMatch = SF_ID_REGEX.exec(id);
  if (sfMatch) {
    return { area: sfMatch[1], seq: sfMatch[2] };
  }
  const legacyMatch = LEGACY_SRF_REGEX.exec(id);
  if (legacyMatch) {
    return { seq: pad(legacyMatch[1], 4) };
  }
  return null;
};

export const inferSequentialIdSpec = (id: string): IdSpec | null => {
  const lastDashIndex = id.lastIndexOf("-");
  if (lastDashIndex === -1 || lastDashIndex === id.length - 1) return null;
  const suffix = id.slice(lastDashIndex + 1);
  if (!/^\d+$/.test(suffix)) return null;
  const prefix = id.slice(0, lastDashIndex + 1);
  return { prefix, padLength: suffix.length };
};

export const inferIdSpecFromExisting = (existingIds: string[], startsWith: string): IdSpec | null => {
  const candidate = existingIds.find((id) => id.startsWith(startsWith));
  if (!candidate) return null;
  return inferSequentialIdSpec(candidate);
};

export const getBtPrefix = (area: string): string => {
  const normalized = normalizeAreaCode(area);
  return `BT-${normalized || "BD"}-`;
};

export const getNextBtId = (area: string, existingIds: string[]): string => {
  const normalized = normalizeAreaCode(area) || "BD";
  const prefix = `BT-${normalized}-`;
  const maxNumber = existingIds.reduce((max, id) => {
    const btMatch = BT_ID_REGEX.exec(id);
    if (btMatch && btMatch[1] === normalized) {
      return Math.max(max, Number.parseInt(btMatch[2], 10));
    }
    const legacyMatch = LEGACY_TASK_REGEX.exec(id);
    if (legacyMatch && legacyMatch[1] === normalized) {
      return Math.max(max, Number.parseInt(legacyMatch[2], 10));
    }
    return max;
  }, 0);
  return `${prefix}${pad(maxNumber + 1, 4)}`;
};

export const getBrIdSpecForTask = (taskId: string, existingIds: string[]): IdSpec => {
  const inferred = inferIdSpecFromExisting(existingIds, "BR-");
  if (inferred) return inferred;

  const task = parseTaskIdForAreaSeq(taskId);
  if (task) {
    return { prefix: `BR-${task.area}-${task.seq}-`, padLength: 4 };
  }

  return { prefix: `BR-${taskId}-`, padLength: 3 };
};

export const getSrIdSpecForSystemFunction = (
  systemDomainId: string,
  systemFunctionId: string,
  existingIds: string[]
): IdSpec => {
  const inferred = inferIdSpecFromExisting(existingIds, "SR-");
  if (inferred) return inferred;

  const parsed = parseSfId(systemFunctionId);
  const area = parsed?.area ?? normalizeAreaCode(systemDomainId) || "SD";
  const seq = parsed?.seq ?? pad(1, 4);
  return { prefix: `SR-${area}-${seq}-`, padLength: 4 };
};

export const getSrIdSpecForTask = (taskId: string, existingIds: string[]): IdSpec => {
  const inferred = inferIdSpecFromExisting(existingIds, "SR-");
  if (inferred) return inferred;

  return { prefix: `SR-${taskId}-`, padLength: 3 };
};
