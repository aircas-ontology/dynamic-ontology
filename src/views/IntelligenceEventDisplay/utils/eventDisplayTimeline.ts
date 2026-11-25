export interface TimelineTick {
  label: string;
  progress: number;
}

/**
 * @description 解析「年-月-日 时:分[:秒]」格式的本地时间。
 * @param value 时间文本。
 * @returns 毫秒时间戳。
 */
function parseTimelineTime(value: string): number {
  return Date.parse(value.replace(" ", "T"));
}

/**
 * @description 将时间戳格式化为时间轴上的「月-日 时:分」。
 * @param timestamp 毫秒时间戳。
 * @returns 时间轴刻度文本。
 */
function formatTickLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number): string => String(value).padStart(2, "0");
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * @description 计算时间戳在窗口内的百分比位置。
 * @param start 窗口开始时间戳。
 * @param end 窗口结束时间戳。
 * @param current 当前时间戳。
 * @returns 0 到 100 之间的百分比。
 */
function getProgressByTimestamp(start: number, end: number, current: number): number {
  if (end <= start || !Number.isFinite(current)) return 0;
  return Math.min(100, Math.max(0, ((current - start) / (end - start)) * 100));
}

/**
 * @description 计算当前时间在时间窗口内的百分比位置。
 * @param start 开始时间。
 * @param end 结束时间。
 * @param current 当前时间。
 * @returns 0 到 100 之间的百分比。
 */
export function getTimelineProgress(start: string, end: string, current: string): number {
  const startTime = parseTimelineTime(start);
  const endTime = parseTimelineTime(end);
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return 0;
  return getProgressByTimestamp(startTime, endTime, parseTimelineTime(current));
}

/**
 * @description 构建开始时刻、每日零点与结束时刻的时间轴刻度。
 * @param start 开始时间。
 * @param end 结束时间。
 * @returns 带百分比位置的刻度列表。
 */
export function buildTimelineTicks(start: string, end: string): TimelineTick[] {
  const startTime = parseTimelineTime(start);
  const endTime = parseTimelineTime(end);
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) return [];
  const timestamps = [startTime];
  const cursor = new Date(startTime);
  cursor.setHours(24, 0, 0, 0);
  while (cursor.getTime() < endTime) {
    timestamps.push(cursor.getTime());
    cursor.setDate(cursor.getDate() + 1);
  }
  timestamps.push(endTime);
  return timestamps.map((timestamp) => ({
    label: formatTickLabel(timestamp),
    progress: getProgressByTimestamp(startTime, endTime, timestamp),
  }));
}
