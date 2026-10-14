import type { StreamAgentChatParams } from "@/types";

/** 组装流式对话入参时的可选上下文。 */
export interface BuildStreamAgentChatParamsInput {
  /** 用户消息。 */
  message: string;
  /** 会话 id。 */
  sessionId: string;
  /** 当前空间 id；空则省略。 */
  spaceId?: number | string | null;
  /** 当前数据源 id；空则省略。 */
  datasourceId?: number | null;
}

/**
 * @description 把可选数字字段收成有限数字；空值或非法值返回 undefined。
 * @param value 路由或调用方传入的原始值。
 * @returns 有限数字；无法使用时为 undefined。
 */
function readOptionalNumber(value: number | string | null | undefined): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

/**
 * @description 组装流式对话请求体。未选择的数据源和空间不写入字段。
 * @param input 消息、会话和可选上下文。
 * @returns 可提交的 `AgentChatParam`。
 */
export function buildStreamAgentChatParams(input: BuildStreamAgentChatParamsInput): StreamAgentChatParams {
  const params: StreamAgentChatParams = {
    message: input.message.trim(),
    sessionId: input.sessionId,
  };
  const spaceId = readOptionalNumber(input.spaceId);
  if (spaceId !== undefined) {
    params.spaceId = spaceId;
  }
  const datasourceId = readOptionalNumber(input.datasourceId);
  if (datasourceId !== undefined) {
    params.datasourceId = datasourceId;
  }
  return params;
}
