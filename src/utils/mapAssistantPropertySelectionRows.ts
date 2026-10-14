import type { AiAssistantPropertySelectionRow, AiAssistantSelectionCard, StreamAgentChatSelectionOption } from "@/types";

/**
 * @description 从选项 payload 读取字符串字段，缺失时回退。
 * @param payload 选项透传字段。
 * @param key 字段名。
 * @param fallback 回退文本。
 * @returns 非空字符串。
 */
function readPayloadString(payload: { readonly [key: string]: unknown } | undefined, key: string, fallback: string): string {
  const value = payload?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

/**
 * @description 判断选择卡片是否为对象属性选择。
 * @param selection 选择卡片；不存在时为 false。
 * @returns 属性选择时为 true。
 */
export function isAssistantPropertySelectionCard(selection?: Pick<AiAssistantSelectionCard, "scenario" | "options">): boolean {
  if (!selection) {
    return false;
  }
  if (selection.scenario === "properties_select") {
    return true;
  }
  return selection.options.length > 0 && selection.options.every((option) => typeof option.payload?.field === "string");
}

/**
 * @description 判断代码块是否为属性草案 JSON，已由表格承接时不再展示。
 * @param text 代码块文本。
 * @returns 属性草案代码时为 true。
 */
export function isAssistantPropertyProposalCode(text: string): boolean {
  return /"stage"\s*:\s*"properties_proposed"/.test(text) || /"properties"\s*:\s*\[/.test(text);
}

/**
 * @description 把属性选择选项转成表格行。
 * @param options 选择卡片选项。
 * @returns 表格行列表。
 */
export function mapAssistantPropertySelectionRows(options: readonly StreamAgentChatSelectionOption[]): AiAssistantPropertySelectionRow[] {
  return options.map((option) => {
    const payload = option.payload;
    return {
      id: option.id,
      name: readPayloadString(payload, "name", option.label),
      field: readPayloadString(payload, "field", option.id),
      dataType: readPayloadString(payload, "type", ""),
      sourceTable: readPayloadString(payload, "sourceTable", ""),
      primaryKey: payload?.primaryKey === true,
      description: readPayloadString(payload, "description", option.description ?? ""),
    };
  });
}
