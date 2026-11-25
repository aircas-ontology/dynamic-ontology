import type { IntelligenceEventThemeCategory } from "@/types";

export interface EventThemeDraft {
  name: string;
  category: IntelligenceEventThemeCategory | "";
  region: string;
  startTime: string;
  endTime: string;
  points: [number, number][];
  description: string;
  spaceId: number | null;
}

/**
 * @description 校验新增事件主题表单、时间窗口与区域点位。
 * @param draft 当前事件主题草稿。
 * @returns 校验错误，无错误时为空字符串。
 */
export function validateEventThemeDraft(draft: EventThemeDraft): string {
  if (!draft.name.trim()) return "请输入事件主题名称";
  if (!draft.category) return "请选择事件主题类别";
  if (!draft.startTime || !draft.endTime || draft.endTime < draft.startTime) return "请选择有效的时间窗口";
  if (!draft.region.trim()) return "请选择地理区域";
  if (draft.points.length < 3) return "请至少选择 3 个区域点位";
  if (!draft.description.trim()) return "请输入事件主题描述";
  if (draft.spaceId === null) return "请选择关联本体空间";
  return "";
}
