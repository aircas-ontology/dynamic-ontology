/** 流式对话事件类型。文档未声明 OpenAPI enum；`selection_request` 仅出现在相关字段说明中。 */
export type StreamAgentChatEventType = "thinking" | "tool_call" | "tool_result" | "content" | "error" | "done" | "selection_request";

/** 选择卡片场景。文档给出的示例为 space_select / datasource_select。 */
export type StreamAgentChatSelectionScenario = "space_select" | "datasource_select" | (string & {});

/** 选择卡片选项。 */
export interface StreamAgentChatSelectionOption {
  /** 选项 id，点击后原样回喂模型，必填。 */
  id: string;
  /** 选项主标题，必填。 */
  label: string;
  /** 选项副标题或描述。 */
  description?: string;
  /** 工具返回原始字段透传。 */
  payload?: Record<string, unknown>;
}

/** Agent 流式对话请求参数。 */
export interface StreamAgentChatParams {
  /** 用户对话消息，必填。 */
  message: string;
  /** 会话 id，同一会话每轮相同；新对话由前端生成 UUID v4，必填。 */
  sessionId: string;
  /** 当前已选数据源 id；为空表示未选择。 */
  datasourceId?: number;
  /** 当前所在空间 id；为空表示未选择。 */
  spaceId?: number;
}

/** Agent 流式对话事件。 */
export interface StreamAgentChatEvent {
  /** 事件类型。 */
  type?: StreamAgentChatEventType | (string & {});
  /** 文本内容。content / thinking / error 使用。 */
  content?: string;
  /** 工具名。tool_call / tool_result 使用。 */
  tool?: string;
  /** 工具入参摘要。tool_call 使用。 */
  args?: string;
  /** 工具结果摘要。tool_result 使用。 */
  summary?: string;
  /** 选择场景标识。selection_request 使用。 */
  scenario?: StreamAgentChatSelectionScenario;
  /** 卡片标题。selection_request 使用。 */
  title?: string;
  /** 是否允许多选。不传默认 false。 */
  multiSelect?: boolean;
  /** 卡片选项列表。selection_request 使用。 */
  options?: StreamAgentChatSelectionOption[];
}

/** Agent 流式对话的响应数据：按到达顺序排列的事件。 */
export type StreamAgentChatData = StreamAgentChatEvent[];
