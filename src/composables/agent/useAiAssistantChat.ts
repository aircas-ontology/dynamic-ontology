import { onScopeDispose, readonly, ref } from "vue";
import { useRoute } from "vue-router";

import { abortAgentChatInterface, postAgentChatStreamInterface, uploadAgentDocumentInterface } from "@/apis";
import type { AiAssistantCommandStatus, AiAssistantMessage } from "@/types";
import { applyAssistantChatEventToMessages, hasAssistantChatOutput, stampAssistantChatError } from "@/utils/applyAssistantChatEvent";
import { buildStreamAgentChatParams } from "@/utils/buildStreamAgentChatParams";
import { generateUuidV4 } from "@/utils/generateUuidV4";
import { resolveAgentChatStreamFailure } from "@/utils/resolveAgentChatStreamFailure";

/**
 * @description 从当前路由读取空间 id；不在空间页时不传。
 * @param spaceId 路由 params 或 query 中的 spaceId。
 * @returns 有限数字空间 id；无法使用时为 undefined。
 */
function readRouteSpaceId(spaceId: unknown): number | undefined {
  const value = Array.isArray(spaceId) ? spaceId[0] : spaceId;
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * @description 判断异常是否为用户取消或新对话中止。
 * @param cause 捕获到的异常。
 * @returns 是否为中止错误。
 */
function isAbortError(cause: unknown): boolean {
  return cause instanceof DOMException && cause.name === "AbortError";
}

/**
 * @description AI 助手流式对话：维护 sessionId、消息、发送状态，并在销毁时取消进行中的 SSE。
 * @returns 只读会话状态与发送、新对话、选择回喂方法。
 */
export function useAiAssistantChat() {
  const route = useRoute();
  const sessionId = ref(generateUuidV4());
  const draft = ref("");
  const messages = ref<AiAssistantMessage[]>([]);
  const status = ref<AiAssistantCommandStatus>("idle");
  const errorMessage = ref("");
  const attachment = ref<{ fileName: string; charCount: number; truncated: boolean; status: "uploading" | "ready" | "error"; error?: string } | null>(null);
  let requestSerial = 0;
  let abortController: AbortController | null = null;

  /**
   * @description 中止当前流式请求。
   */
  function abortAssistantChatStream(): void {
    abortController?.abort();
    abortController = null;
  }
  /** @description 中断服务端当前会话并停止本地流式输出。 */
  async function stopAssistantChat(): Promise<void> {
    if (status.value !== "submitting") return;
    requestSerial += 1;
    abortAssistantChatStream();
    status.value = "success";
    try {
      await abortAgentChatInterface(sessionId.value);
    } catch (cause) {
      errorMessage.value = cause instanceof Error ? cause.message : "停止对话失败。";
    }
  }

  /**
   * @description 发送一条用户消息并消费 SSE 事件。发送中忽略重复调用。
   * @param text 可选覆盖输入框的消息；选择卡片回喂时传入选项 id。
   * @param displayContent 页面气泡展示文案；未传时与发送内容一致。
   */
  async function sendAssistantMessage(text?: string, displayContent?: string): Promise<void> {
    if (status.value === "submitting") {
      return;
    }

    const message = (text ?? draft.value).trim();
    if (!message && !attachment.value) {
      return;
    }

    const attachmentName = attachment.value?.fileName;
    const requestMessage = message || (attachmentName ? `附件：${attachmentName}` : "");
    if (!requestMessage) {
      return;
    }
    const visibleContent =
      displayContent?.trim() || (attachmentName ? (message ? `${message}\n附件：${attachmentName}` : `附件：${attachmentName}`) : requestMessage);
    const serial = ++requestSerial;
    abortAssistantChatStream();
    abortController = new AbortController();

    const assistantMessageId = generateUuidV4();
    messages.value = [
      ...messages.value,
      { id: generateUuidV4(), role: "user", content: visibleContent },
      { id: assistantMessageId, role: "assistant", content: "", processItems: [] },
    ];
    draft.value = "";
    attachment.value = null;
    errorMessage.value = "";
    status.value = "submitting";
    errorMessage.value = "";
    let alreadyTerminal = false;

    try {
      await postAgentChatStreamInterface(
        buildStreamAgentChatParams({
          message: requestMessage,
          sessionId: sessionId.value,
          spaceId: readRouteSpaceId(route.params.spaceId ?? route.query.spaceId),
        }),
        {
          signal: abortController.signal,
          onEvent(event) {
            if (serial !== requestSerial) {
              return;
            }
            messages.value = applyAssistantChatEventToMessages(messages.value, assistantMessageId, event);
            if (event.type === "error") {
              alreadyTerminal = true;
              status.value = "error";
              errorMessage.value = event.content?.trim() || "对话失败，请稍后重试。";
            }
            if (event.type === "done") {
              alreadyTerminal = true;
              status.value = "success";
            }
          },
        },
      );
      if (serial === requestSerial && status.value === "submitting") {
        status.value = "success";
      }
    } catch (cause: unknown) {
      if (serial !== requestSerial || isAbortError(cause)) {
        return;
      }
      const assistantMessage = messages.value.find((item) => item.id === assistantMessageId && item.role === "assistant");
      const decision = resolveAgentChatStreamFailure({
        cause,
        alreadyTerminal,
        hasOutput: assistantMessage?.role === "assistant" && hasAssistantChatOutput(assistantMessage),
      });
      if (decision.kind === "ignore") {
        return;
      }
      if (decision.kind === "complete") {
        status.value = "success";
        return;
      }
      status.value = "error";
      errorMessage.value = decision.message ?? "对话失败，请稍后重试。";
      messages.value = stampAssistantChatError(messages.value, assistantMessageId, errorMessage.value);
    }
  }

  /**
   * @description 开始新对话：只更换 sessionId，清空消息并中止进行中的流。
   */
  function startNewAssistantConversation(): void {
    requestSerial += 1;
    abortAssistantChatStream();
    sessionId.value = generateUuidV4();
    messages.value = [];
    draft.value = "";
    status.value = "idle";
    errorMessage.value = "";
    attachment.value = null;
  }

  /**
   * @description 校验并上传当前会话参考文档。
   * @param file 待上传的 txt 或 md 文件。
   */
  async function uploadAssistantDocument(file: File): Promise<void> {
    const extension = file.name.toLowerCase().split(".").pop();
    if (extension !== "txt" && extension !== "md") {
      attachment.value = null;
      errorMessage.value = "文件格式错误，仅支持上传 txt 或 md 文件。";
      return;
    }
    attachment.value = { fileName: file.name, charCount: 0, truncated: false, status: "uploading" };
    try {
      const response = await uploadAgentDocumentInterface(sessionId.value, file);
      if (response.code !== 200 || !response.data) throw new Error(response.message || "文档上传失败");
      attachment.value = { ...response.data, status: "ready" };
      if (response.data.truncated) errorMessage.value = `文档已截断，保留 ${response.data.charCount} 个字符`;
    } catch (error) {
      attachment.value = {
        fileName: file.name,
        charCount: 0,
        truncated: false,
        status: "error",
        error: error instanceof Error ? error.message : "文档上传失败",
      };
    }
  }

  /** @description 移除当前待发送文档。 */
  function removeAssistantAttachment(): void {
    attachment.value = null;
  }

  /**
   * @description 把选择卡片选项 id 原样回喂模型，页面气泡展示对应名称。
   * @param optionId 选项 id，多个 id 用英文逗号连接。
   * @param displayContent 页面展示用的选项名称。
   */
  function selectAssistantOption(optionId: string, displayContent?: string): void {
    void sendAssistantMessage(optionId, displayContent);
  }

  onScopeDispose(() => {
    requestSerial += 1;
    abortAssistantChatStream();
  });

  return {
    sessionId: readonly(sessionId),
    draft,
    messages: readonly(messages),
    status: readonly(status),
    errorMessage: readonly(errorMessage),
    attachment: readonly(attachment),
    uploadAssistantDocument,
    removeAssistantAttachment,
    sendAssistantMessage,
    startNewAssistantConversation,
    selectAssistantOption,
    stopAssistantChat,
  };
}
