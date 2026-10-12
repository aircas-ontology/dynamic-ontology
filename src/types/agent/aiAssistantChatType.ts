import type { StreamAgentChatSelectionOption } from "../apis/streamAgentChatType";

/** AI 助手发送命令状态。 */
export type AiAssistantCommandStatus = "idle" | "submitting" | "success" | "error";

/** 折叠过程条目类型。 */
export type AiAssistantProcessKind = "thinking" | "tool_call" | "tool_result";

/** 折叠过程中的一条思考或工具记录。 */
export interface AiAssistantProcessItem {
  /** 过程条目类型。 */
  kind: AiAssistantProcessKind;
  /** 展示文本。 */
  text: string;
}

/** AI 助手本体构建步骤状态。 */
export type AiAssistantBuildStepStatus = "pending" | "active" | "complete" | "error";

/** AI 助手本体构建步骤。 */
export interface AiAssistantBuildStep {
  /** 步骤序号，从 1 开始。 */
  index: number;
  /** 步骤标题。 */
  title: string;
  /** 步骤状态。 */
  status: AiAssistantBuildStepStatus;
}

/** AI 助手本体构建进度。 */
export interface AiAssistantBuildProgress {
  /** 当前步骤序号，从 1 开始。 */
  current: number;
  /** 步骤总数。 */
  total: number;
  /** 步骤列表。 */
  steps: AiAssistantBuildStep[];
}

/** 属性选择表格中的一行。 */
export interface AiAssistantPropertySelectionRow {
  /** 选项 id，确认后回喂模型。 */
  id: string;
  /** 属性名称。 */
  name: string;
  /** 字段名。 */
  field: string;
  /** 数据类型。 */
  dataType: string;
  /** 来源表。 */
  sourceTable: string;
  /** 是否主键。 */
  primaryKey: boolean;
  /** 属性描述。 */
  description: string;
}

/** 流式选择卡片。 */
export interface AiAssistantSelectionCard {
  /** 选择场景标识。 */
  scenario?: string;
  /** 卡片标题。 */
  title?: string;
  /** 是否允许多选。 */
  multiSelect: boolean;
  /** 选项列表。 */
  options: readonly StreamAgentChatSelectionOption[];
}

/** 用户消息。 */
export interface AiAssistantUserMessage {
  /** 消息 id。 */
  id: string;
  /** 角色。 */
  role: "user";
  /** 消息文本。 */
  content: string;
}

/** 助手消息。 */
export interface AiAssistantAssistantMessage {
  /** 消息 id。 */
  id: string;
  /** 角色。 */
  role: "assistant";
  /** 正式回复文本。 */
  content: string;
  /** 折叠过程条目。 */
  processItems: AiAssistantProcessItem[];
  /** 本体构建步骤进度；普通问答时为空。 */
  buildProgress?: AiAssistantBuildProgress;
  /** 选择卡片。 */
  selection?: AiAssistantSelectionCard;
  /** 本轮错误文案。 */
  errorMessage?: string;
}

/** AI 助手会话消息。 */
export type AiAssistantMessage = AiAssistantUserMessage | AiAssistantAssistantMessage;
