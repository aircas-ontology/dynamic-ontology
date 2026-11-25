export interface TaskDraft {
  taskCode?: string;
  name: string;
  category: string | number;
  region: string | number;
  description: string;
  spaceId: number | null;
  startTime: string;
  endTime: string;
  ongoing: boolean;
  points: [number, number][];
}

/** @description 将接口返回的时间转换为北京时间并格式化展示。 @param value 接口时间字符串。 @returns 北京时间文本。 */
export function formatBeijingDateTime(value: string | undefined): string {
  if (!value) return "";
  const normalized = value.includes("T") || /(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime()))
    return value
      .replace("T", " ")
      .replace(/\.\d{3}Z$/, "")
      .replace(/Z$/, "");
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}`;
}

/** @description 将接口区域点位字符串解析为地图经纬度数组。 @param value 接口区域点位。 @returns 地图点位数组。 */
export function parseRegionPoints(value: string | undefined): [number, number][] {
  if (!value) return [];
  return value.split(";").flatMap((item) => {
    const [longitude, latitude] = item.split(",").map(Number);
    return Number.isFinite(longitude) && Number.isFinite(latitude) ? ([[longitude, latitude]] as [number, number][]) : [];
  });
}

/** @description 将地图经纬度数组序列化为接口区域点位字符串。 @param points 地图点位数组。 @returns 接口区域点位。 */
export function stringifyRegionPoints(points: readonly [number, number][]): string {
  return points.map(([longitude, latitude]) => `${longitude},${latitude}`).join(";");
}

/**
 * @description 校验新增任务表单及区域点位。
 * @param draft 当前任务草稿。
 * @returns 校验错误，无错误时为空字符串。
 */
export function validateTaskDraft(draft: TaskDraft): string {
  if (!draft.name.trim()) return "请输入任务名称";
  if (!draft.category) return "请选择任务类型";
  if (!String(draft.region).trim()) return "请选择或输入任务区域";
  if (!draft.startTime || (!draft.ongoing && (!draft.endTime || draft.endTime < draft.startTime))) return "请选择有效的任务时间";
  if (!draft.description.trim()) return "请输入任务描述";
  if (draft.spaceId === null) return "请选择关联本体空间";
  return "";
}
import type { IntelligenceTaskTheme } from "@/types";

/** @description 将任务记录转换为可独立编辑的表单草稿。 @param task 任务记录。 @returns 任务草稿。 */
export function taskThemeToDraft(task: IntelligenceTaskTheme): TaskDraft {
  const [startTime = "", endTime = ""] = task.period.split(" ~ ");
  return {
    taskCode: task.taskCode,
    name: task.title,
    category: task.category,
    region: task.region,
    description: task.description,
    spaceId: task.spaceId ?? null,
    startTime,
    endTime: endTime === "至今" ? "" : endTime,
    ongoing: endTime === "至今",
    points: (task.points ?? []).map(([lng, lat]) => [lng, lat]),
  };
}

/** @description 使用已确认草稿更新任务，同时保留原统计数据。 @param task 原任务。 @param draft 已校验草稿。 @returns 更新后的任务。 */
export function updateTaskTheme(task: IntelligenceTaskTheme, draft: TaskDraft): IntelligenceTaskTheme {
  return {
    ...task,
    title: draft.name,
    category: draft.category,
    region: draft.region,
    description: draft.description,
    spaceId: draft.spaceId,
    points: draft.points.map(([lng, lat]) => [lng, lat]),
    period: `${draft.startTime} ~ ${draft.ongoing ? "至今" : draft.endTime}`,
  };
}
