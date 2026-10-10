import type { RuleVariableCatalogObject } from "@/types";
import { createActionsStep, createBranchStep, createEmptyCompositeCondition, createEmptyLeafCondition } from "./scheduleRuleFlowFactory.ts";
import { serializeScheduleRuleFlow } from "./scheduleRuleFlowText.ts";

/** AI 生成本地等待时长，便于取消。 */
const GENERATE_DELAY_MS = 80;

/**
 * @description 创建可被 AbortSignal 识别的取消错误。
 * @returns AbortError。
 */
function createAbortError(): Error {
  return new DOMException("Aborted", "AbortError");
}

/**
 * @description 可取消的短等待，模拟生成耗时。
 * @param ms 等待毫秒。
 * @param signal 取消信号。
 * @returns 等待完成。
 */
function waitWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    /**
     * @description 等待期间收到取消时清理定时器。
     */
    function onAbort(): void {
      clearTimeout(timer);
      reject(createAbortError());
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * @description 根据提示和变量目录拼一份可解析的规则文档。
 * @param prompt 用户描述。
 * @param catalog 自定义变量目录。
 * @returns 规则文本。
 */
function buildMockRuleDsl(prompt: string, catalog: RuleVariableCatalogObject[]): string {
  const object = catalog[0];
  const property = object?.properties[0];
  const leaf = createEmptyLeafCondition();
  if (object && property) {
    leaf.left = {
      kind: "variable",
      objectId: object.id,
      objectName: object.name,
      objectKind: object.kind,
      propertyId: property.id,
      propertyName: property.name,
      instanceIds: [],
    };
  }
  leaf.operator = prompt.includes("小于") ? "lt" : "gt";
  leaf.right = { kind: "input", text: prompt.includes("小于") ? "10" : "3" };
  const condition = createEmptyCompositeCondition(false);
  condition.children = [leaf];
  const action = createActionsStep();
  const firstAction = action.actions[0];
  if (firstAction) {
    firstAction.behaviorName = prompt.includes("威胁响应") ? "威胁响应行为" : prompt.includes("高轨") ? "高轨监视计划" : "行动事件分析";
  }
  return serializeScheduleRuleFlow({ steps: [createBranchStep(condition, [action])] });
}

/** AI Mock 生成入参。 */
export interface GenerateScheduleRuleFromPromptInput {
  /** 用户描述。 */
  prompt: string;
  /** 附件文本。 */
  attachmentText?: string;
  /** 当前变量目录。 */
  catalog: RuleVariableCatalogObject[];
  /** 取消信号。 */
  signal?: AbortSignal;
}

/** AI Mock 生成结果。 */
export interface GenerateScheduleRuleFromPromptResult {
  /** 回复文案。 */
  reply: string;
  /** 可应用规则文本。 */
  dsl: string;
}

/**
 * @description 用本地 Mock 根据自然语言生成规则文本，不调用后端。
 * @param input 提示、目录和取消信号。
 * @returns 回复与规则文本。
 */
export async function generateScheduleRuleFromPrompt(input: GenerateScheduleRuleFromPromptInput): Promise<GenerateScheduleRuleFromPromptResult> {
  const prompt = input.prompt.trim() || input.attachmentText?.trim() || "";
  if (!prompt) {
    throw new Error("请先描述规则");
  }
  await waitWithAbort(GENERATE_DELAY_MS, input.signal);
  const dsl = buildMockRuleDsl(prompt, input.catalog);
  return {
    reply: "已生成规则，可点击「同步到规则」应用到画布。",
    dsl,
  };
}
