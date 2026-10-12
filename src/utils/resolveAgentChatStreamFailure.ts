/** 流式对话在连接被对端关闭后的处理结果。 */
export interface AgentChatStreamFailureDecision {
  /** 忽略、视为正常结束，或判定失败。 */
  kind: "ignore" | "complete" | "fail";
  /** 失败时给用户看的文案。 */
  message?: string;
}

/**
 * @description 判断异常是否为 SSE 读流时的连接中断（HTTP 已 200 后对端 RST / 网络断开）。
 * @param cause 捕获到的异常。
 * @returns 是否为连接中断。
 */
export function isAgentChatStreamClosedError(cause: unknown): boolean {
  if (cause instanceof DOMException && cause.name === "AbortError") {
    return false;
  }
  const text = cause instanceof Error ? `${cause.name} ${cause.message}` : String(cause ?? "");
  return /connection reset|econnreset|networkerror|network error|failed to fetch/i.test(text);
}

/**
 * @description 从未知异常中取出可展示文案。
 * @param cause 捕获到的异常。
 * @returns 非空错误文案。
 */
function readErrorMessage(cause: unknown): string {
  if (cause instanceof Error && cause.message.trim()) {
    return cause.message.trim();
  }
  return "对话失败，请稍后重试。";
}

/**
 * @description 决定流式对话在抛错后应忽略、视为完成还是失败。对端在 200 后 RST 关流时，已有输出不当失败。
 * @param input.cause 捕获到的异常。
 * @param input.alreadyTerminal 本轮是否已因 done/error 进入终态。
 * @param input.hasOutput 本轮是否已收到过程、正文或选择卡片。
 * @returns 处理决定。
 */
export function resolveAgentChatStreamFailure(input: { cause: unknown; alreadyTerminal: boolean; hasOutput: boolean }): AgentChatStreamFailureDecision {
  if (input.cause instanceof DOMException && input.cause.name === "AbortError") {
    return { kind: "ignore" };
  }
  if (isAgentChatStreamClosedError(input.cause)) {
    if (input.alreadyTerminal) {
      return { kind: "ignore" };
    }
    if (input.hasOutput) {
      return { kind: "complete" };
    }
    return { kind: "fail", message: "对话连接已中断，请重试。" };
  }
  return { kind: "fail", message: readErrorMessage(input.cause) };
}
