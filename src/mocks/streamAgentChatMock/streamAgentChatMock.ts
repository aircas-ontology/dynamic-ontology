import type { StreamAgentChatData, StreamAgentChatEvent } from "@/types";

export const streamAgentChatMock: StreamAgentChatData = [
  {
    type: "thinking",
    content: "正在检索平台本体列表",
  },
  {
    type: "tool_call",
    tool: "searchDatasources",
    args: '{"keyword":"本体"}',
  },
  {
    type: "tool_result",
    tool: "searchDatasources",
    summary: "找到 2 个数据源",
  },
  {
    type: "selection_request",
    scenario: "space_select",
    title: "请选择目标本体空间",
    multiSelect: false,
    options: [
      {
        id: "3",
        label: "PG 主库",
        description: "POSTGRESQL，127.0.0.1:35432/ontology",
        payload: {
          id: 3,
          type: "POSTGRESQL",
        },
      },
    ],
  },
  {
    type: "content",
    content: "平台当前有以下本体：",
  },
  {
    type: "done",
  },
];

export const streamAgentChatErrorMock: StreamAgentChatEvent = {
  type: "error",
  content: "对话失败，请稍后重试",
};
