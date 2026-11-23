export interface TaskDraft {
  name: string;
  category: string;
  region: string;
  description: string;
  spaceId: number | null;
  startTime: string;
  endTime: string;
  ongoing: boolean;
  points: [number, number][];
}

/**
 * @description 校验新增任务表单及区域点位。
 * @param draft 当前任务草稿。
 * @returns 校验错误，无错误时为空字符串。
 */
export function validateTaskDraft(draft: TaskDraft): string {
  if (!draft.name.trim()) return "请输入任务名称";
  if (!draft.category) return "请选择任务类型";
  if (!draft.region.trim()) return "请选择或输入任务区域";
  if (draft.points.length < 3) return "区域点位至少需要 3 个点";
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
