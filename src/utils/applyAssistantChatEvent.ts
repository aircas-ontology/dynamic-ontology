import type { AiAssistantAssistantMessage, AiAssistantMessage, AiAssistantProcessItem, StreamAgentChatEvent } from "@/types";
import { resolveAssistantBuildProgress } from "./resolveAssistantBuildProgress.ts";

/**
 * @description 把工具名和摘要拼成一条过程文案。
 * @param parts 按展示顺序排列的文本片段。
 * @returns 去除空段后以空格连接的文本。
 */
function joinProcessText(parts: Array<string | undefined>): string {
  return parts.filter((part): part is string => typeof part === "string" && part.length > 0).join(" ");
}

/**
 * @description 按流式事件更新当前助手消息：过程折叠，正式回复只拼 content。
 * @param message 当前助手消息。
 * @param event 一条 SSE 事件。
 * @returns 更新后的助手消息。
 */
function applyEventToAssistantMessage(message: AiAssistantAssistantMessage, event: StreamAgentChatEvent): AiAssistantAssistantMessage {
  if (event.type === "thinking") {
    const item: AiAssistantProcessItem = { kind: "thinking", text: event.content ?? "" };
    return { ...message, processItems: [...message.processItems, item] };
  }
  if (event.type === "tool_call") {
    const item: AiAssistantProcessItem = { kind: "tool_call", text: joinProcessText([event.tool, event.args]) };
    return { ...message, processItems: [...message.processItems, item] };
  }
  if (event.type === "tool_result") {
    const item: AiAssistantProcessItem = { kind: "tool_result", text: joinProcessText([event.tool, event.summary]) };
    return { ...message, processItems: [...message.processItems, item] };
  }
  if (event.type === "content") {
    const content = `${message.content}${event.content ?? ""}`;
    return { ...message, content, buildProgress: resolveAssistantBuildProgress(content) };
  }
  if (event.type === "selection_request") {
    return {
      ...message,
      selection: {
        scenario: event.scenario,
        title: event.title,
        multiSelect: event.multiSelect === true,
        options: event.options ?? [],
      },
    };
  }
  if (event.type === "error") {
    return {
      ...message,
      errorMessage: event.content ?? "对话失败，请稍后重试。",
      buildProgress: message.buildProgress ? resolveAssistantBuildProgress(message.content, "error") : undefined,
    };
  }
  if (event.type === "done" && message.buildProgress) {
    return { ...message, buildProgress: resolveAssistantBuildProgress(message.content, "done") };
  }
  return message;
}

/**
 * @description 判断助手消息是否已有过程、正文或选择卡片。
 * @param message 助手消息。
 * @returns 是否已有可展示输出。
 */
export function hasAssistantChatOutput(message: AiAssistantAssistantMessage): boolean {
  return message.content.length > 0 || message.processItems.length > 0 || message.selection !== undefined;
}

/**
 * @description 把失败文案写到指定助手消息上。
 * @param messages 当前会话消息。
 * @param assistantMessageId 本轮助手消息 id。
 * @param errorMessage 失败文案。
 * @returns 更新后的消息列表。
 */
export function stampAssistantChatError(messages: AiAssistantMessage[], assistantMessageId: string, errorMessage: string): AiAssistantMessage[] {
  return messages.map((message) => {
    if (message.role !== "assistant" || message.id !== assistantMessageId) {
      return message;
    }
    return { ...message, errorMessage };
  });
}

/**
 * @description 把一条流式事件应用到指定助手消息，其它消息保持不变。
 * @param messages 当前会话消息。
 * @param assistantMessageId 本轮助手消息 id。
 * @param event 一条 SSE 事件。
 * @returns 更新后的消息列表。
 */
export function applyAssistantChatEventToMessages(
  messages: AiAssistantMessage[],
  assistantMessageId: string,
  event: StreamAgentChatEvent,
): AiAssistantMessage[] {
  return messages.map((message) => {
    if (message.role !== "assistant" || message.id !== assistantMessageId) {
      return message;
    }
    return applyEventToAssistantMessage(message, event);
  });
}
