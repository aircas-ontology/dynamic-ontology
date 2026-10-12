/** 助手正文中的普通段落。 */
export interface AssistantChatContentTextBlock {
  /** 块类型。 */
  kind: "text";
  /** 展示文本。 */
  text: string;
}

/** 助手正文中的一条语义字段或列表项。 */
export interface AssistantChatContentItemBlock {
  /** 块类型。 */
  kind: "item";
  /** 字段名称。 */
  label?: string;
  /** 字段值或列表文本。 */
  text: string;
}

/** 助手正文中的代码块。 */
export interface AssistantChatContentCodeBlock {
  /** 块类型。 */
  kind: "code";
  /** 代码文本。 */
  text: string;
}

/** 助手正文拆分后的展示块。 */
export type AssistantChatContentBlock = AssistantChatContentTextBlock | AssistantChatContentItemBlock | AssistantChatContentCodeBlock;

/**
 * @description 去掉常见行内 Markdown 标记，保留可读文字。
 * @param text 原始文本。
 * @returns 去掉加粗和行内代码标记后的文本。
 */
function stripMarkdownInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

/**
 * @description 把一段正文拆成文本段和代码段，未闭合的围栏按代码处理。
 * @param content 助手或用户消息正文。
 * @returns 按出现顺序排列的文本或代码段。
 */
function splitAssistantChatContentSegments(content: string): Array<{ kind: "text" | "code"; text: string }> {
  const normalized = content.replace(/\r\n/g, "\n");
  const segments: Array<{ kind: "text" | "code"; text: string }> = [];
  const fence = /```[\w-]*\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match = fence.exec(normalized);
  while (match) {
    if (match.index > lastIndex) {
      segments.push({ kind: "text", text: normalized.slice(lastIndex, match.index) });
    }
    segments.push({ kind: "code", text: (match[1] ?? "").replace(/\n$/, "") });
    lastIndex = match.index + match[0].length;
    match = fence.exec(normalized);
  }

  const rest = normalized.slice(lastIndex);
  const unclosedIndex = rest.indexOf("```");
  if (unclosedIndex >= 0) {
    const before = rest.slice(0, unclosedIndex);
    const after = rest.slice(unclosedIndex).replace(/^```[\w-]*\n?/, "");
    if (before.trim().length > 0) {
      segments.push({ kind: "text", text: before });
    }
    segments.push({ kind: "code", text: after });
    return segments;
  }
  if (rest.length > 0) {
    segments.push({ kind: "text", text: rest });
  }
  return segments;
}

/**
 * @description 判断是否为与选择卡片标题重复的“请在上方卡片中…”提示。
 * @param text 已去掉 Markdown 的一行正文。
 * @returns 重复提示时为 true。
 */
function isRedundantSelectionPrompt(text: string): boolean {
  return /^请在上方卡片中/.test(text);
}

/**
 * @description 把一行正文解析成段落或语义条目。
 * @param line 单行文本。
 * @returns 展示块；空行或重复选卡提示时为 undefined。
 */
function parseAssistantChatContentLine(line: string): AssistantChatContentBlock | undefined {
  const trimmed = line.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/) ?? trimmed.match(/^\d+\.\s+(.+)$/);
  const body = bulletMatch?.[1] ?? trimmed;
  const labeled = body.match(/^(?:\*\*(.+?)\*\*|([^：:*]{1,20}))[：:]\s*(.+)$/);
  const canBeItem = Boolean(bulletMatch) || /^\*\*.+?\*\*[：:]/.test(trimmed);
  if (canBeItem && labeled) {
    const label = stripMarkdownInline(labeled[1] ?? labeled[2] ?? "");
    const text = stripMarkdownInline(labeled[3] ?? "");
    if (label.length > 0 && text.length > 0) {
      return { kind: "item", label, text };
    }
  }
  if (bulletMatch) {
    const text = stripMarkdownInline(body);
    return isRedundantSelectionPrompt(text) ? undefined : { kind: "item", text };
  }
  const text = stripMarkdownInline(trimmed);
  return isRedundantSelectionPrompt(text) ? undefined : { kind: "text", text };
}

/**
 * @description 把助手正文拆成可分条换行展示的块：段落、语义条目和代码。
 * @param content 原始消息正文。
 * @returns 展示块列表；空内容时为空数组。
 */
export function splitAssistantChatContentBlocks(content: string): AssistantChatContentBlock[] {
  if (content.trim().length === 0) {
    return [];
  }

  const blocks: AssistantChatContentBlock[] = [];
  for (const segment of splitAssistantChatContentSegments(content)) {
    if (segment.kind === "code") {
      if (segment.text.length > 0) {
        blocks.push({ kind: "code", text: segment.text });
      }
      continue;
    }
    for (const line of segment.text.split("\n")) {
      const block = parseAssistantChatContentLine(line);
      if (block) {
        blocks.push(block);
      }
    }
  }
  return blocks;
}
