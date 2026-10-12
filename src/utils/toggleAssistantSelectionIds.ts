import type { StreamAgentChatSelectionOption } from "@/types";

/**
 * @description 切换 AI 助手选择卡片中的选项。单选时互斥；多选时按勾选结果增删。
 * @param selectedIds 当前已选选项 id。
 * @param optionId 本次操作的选项 id。
 * @param multiSelect 是否允许多选。
 * @param checked 复选框目标勾选状态；未传时按当前选中情况取反。
 * @returns 更新后的已选 id 列表。
 */
export function toggleAssistantSelectionIds(selectedIds: string[], optionId: string, multiSelect: boolean, checked?: boolean): string[] {
  if (!multiSelect) {
    return checked === false ? [] : [optionId];
  }
  const exists = selectedIds.includes(optionId);
  const shouldSelect = checked ?? !exists;
  if (shouldSelect) {
    return exists ? selectedIds : [...selectedIds, optionId];
  }
  return selectedIds.filter((item) => item !== optionId);
}

/**
 * @description 把已选选项 id 组装成回喂模型的一条 message。多个 id 用英文逗号连接。
 * @param selectedIds 已选选项 id。
 * @returns 可发送的 message；未选时为空串。
 */
export function resolveAssistantSelectionConfirmMessage(selectedIds: string[]): string {
  return selectedIds.filter((item) => item.length > 0).join(",");
}

/**
 * @description 把已选选项转成页面展示文案，优先使用选项名称，多个名称用顿号连接。
 * @param selectedIds 已选选项 id。
 * @param options 选择卡片选项。
 * @returns 可读展示文案；未选或找不到名称时回退到 id。
 */
export function resolveAssistantSelectionConfirmDisplay(
  selectedIds: string[],
  options: readonly Pick<StreamAgentChatSelectionOption, "id" | "label">[],
): string {
  return selectedIds
    .filter((item) => item.length > 0)
    .map((item) => {
      const label = options.find((option) => option.id === item)?.label?.trim();
      return label && label.length > 0 ? label : item;
    })
    .join("、");
}
