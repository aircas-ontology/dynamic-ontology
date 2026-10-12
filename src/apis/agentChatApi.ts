import { EventStreamContentType, fetchEventSource } from "@microsoft/fetch-event-source";

import type { StreamAgentChatEvent, StreamAgentChatParams, StreamAgentChatSelectionOption } from "@/types";
import { getAccessTokenHeader } from "@/utils/authToken";
import { isAgentChatStreamClosedError } from "@/utils/resolveAgentChatStreamFailure";

/** 流式对话事件回调。 */
export interface PostAgentChatStreamOptions {
  /** 用于取消本轮流式请求。 */
  signal?: AbortSignal;
  /** 每解析到一条事件时回调。 */
  onEvent: (event: StreamAgentChatEvent) => void;
}

/**
 * @description 解析 Agent 服务基址并拼接流式对话路径。
 * @returns 完整的 `/chat/stream` 地址。
 */
export function resolveAgentChatStreamUrl(): string {
  if (typeof DOMAIN_CONFIG === "undefined" || !DOMAIN_CONFIG.AGENT_URL?.trim()) {
    throw new Error("未配置 Agent 服务地址，请在 domainConfig.js 中设置 AGENT_URL。");
  }
  return `${DOMAIN_CONFIG.AGENT_URL.replace(/\/$/, "")}/chat/stream`;
}

/**
 * @description 判断未知值是否为可枚举对象。
 * @param value 待检查值。
 * @returns 是否为普通对象。
 */
function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @description 把未知选项收成选择卡片选项。
 * @param value 原始选项。
 * @returns 合法选项；缺少 id 或 label 时为 null。
 */
function readSelectionOption(value: unknown): StreamAgentChatSelectionOption | null {
  if (!isPlainRecord(value)) {
    return null;
  }
  const rawId = value.id;
  const id = typeof rawId === "string" ? rawId : typeof rawId === "number" && Number.isFinite(rawId) ? String(rawId) : "";
  const label = typeof value.label === "string" ? value.label : "";
  if (!id || !label) {
    return null;
  }
  return {
    id,
    label,
    ...(typeof value.description === "string" ? { description: value.description } : {}),
    ...(isPlainRecord(value.payload) ? { payload: value.payload } : {}),
  };
}

/**
 * @description 把 SSE `data` 文本解析为流式事件；无法识别时返回 null。
 * @param raw SSE data 字段。
 * @returns 事件对象；空串、[DONE] 或非法 JSON 时为 null。
 */
export function parseAgentChatStreamEvent(raw: string): StreamAgentChatEvent | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "[DONE]") {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!isPlainRecord(parsed)) {
      return null;
    }
    const options = Array.isArray(parsed.options) ? parsed.options.map(readSelectionOption).filter((item) => item !== null) : undefined;
    return {
      ...(typeof parsed.type === "string" ? { type: parsed.type } : {}),
      ...(typeof parsed.content === "string" ? { content: parsed.content } : {}),
      ...(typeof parsed.tool === "string" ? { tool: parsed.tool } : {}),
      ...(typeof parsed.args === "string" ? { args: parsed.args } : {}),
      ...(typeof parsed.summary === "string" ? { summary: parsed.summary } : {}),
      ...(typeof parsed.scenario === "string" ? { scenario: parsed.scenario } : {}),
      ...(typeof parsed.title === "string" ? { title: parsed.title } : {}),
      ...(typeof parsed.multiSelect === "boolean" ? { multiSelect: parsed.multiSelect } : {}),
      ...(options ? { options } : {}),
    };
  } catch {
    return null;
  }
}

/**
 * @description 组装流式对话请求头，已登录时写入 access-token。
 * @returns 可传给 fetchEventSource 的请求头。
 */
export function resolveAgentChatStreamHeaders(): Record<string, string> {
  const accessToken = getAccessTokenHeader();
  if (!accessToken) {
    throw new Error("请先登录后再使用 AI 助手。");
  }
  return {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
    "access-token": accessToken,
  };
}

/**
 * @description 以 SSE 类型化事件逐段返回思考过程与回复。
 *
 * 请求方式：POST `/chat/stream`
 *
 * @param params 流式对话请求体。
 * @param params.message 用户对话消息，必填。
 * @param params.sessionId 会话 id，必填。
 * @param params.datasourceId 当前已选数据源 id；为空表示未选择。
 * @param params.spaceId 当前所在空间 id；为空表示未选择。
 * @param options 取消信号与事件回调。
 * @returns 流结束后结束的 Promise。
 */
export async function postAgentChatStreamInterface(params: StreamAgentChatParams, options: PostAgentChatStreamOptions): Promise<void> {
  let receivedOutput = false;
  try {
    await fetchEventSource(resolveAgentChatStreamUrl(), {
      method: "POST",
      headers: resolveAgentChatStreamHeaders(),
      body: JSON.stringify(params),
      signal: options.signal,
      openWhenHidden: true,
      async onopen(response) {
        if (!response.ok) {
          throw new Error("对话请求失败，请稍后重试。");
        }
        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes(EventStreamContentType)) {
          throw new Error("对话响应格式不正确。");
        }
      },
      onmessage(message) {
        const event = parseAgentChatStreamEvent(message.data);
        if (event) {
          receivedOutput = true;
          options.onEvent(event);
        }
      },
      onerror(error) {
        throw error;
      },
    });
  } catch (cause: unknown) {
    if (isAgentChatStreamClosedError(cause) && receivedOutput) {
      return;
    }
    throw cause;
  }
}
