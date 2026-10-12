import type { AiAssistantBuildProgress, AiAssistantBuildStep, AiAssistantBuildStepStatus } from "@/types";

const defaultBuildStepTitles = [
  "定义本体对象",
  "导入资料",
  "构建对象",
  "构建属性",
  "构建关系",
  "构建函数",
  "构建行为",
  "构建行为树",
  "构建行为调度规则",
  "评估",
  "完成",
];

/**
 * @description 从助手正文中读取大模型构建步骤标记。
 * @param content 当前已累积的助手正文。
 * @param terminalStatus 当前流终止状态。
 * @returns 构建进度；未识别步骤时返回 undefined。
 */
export function resolveAssistantBuildProgress(content: string, terminalStatus?: "done" | "error"): AiAssistantBuildProgress | undefined {
  const match = content.match(/【第\s*(\d+)\s*步\s*\/\s*共\s*(\d+)\s*步】/);
  if (!match) return undefined;
  const current = Math.max(1, Number(match[1]));
  const total = Math.max(current, Number(match[2]));
  const steps: AiAssistantBuildStep[] = Array.from({ length: total }, (_, offset) => {
    const index = offset + 1;
    let status: AiAssistantBuildStepStatus = index < current ? "complete" : index === current ? "active" : "pending";
    if (terminalStatus === "done" && index === current) status = "complete";
    if (terminalStatus === "error" && index === current) status = "error";
    return { index, title: defaultBuildStepTitles[index - 1] ?? `构建步骤 ${index}`, status };
  });
  return { current, total, steps };
}
