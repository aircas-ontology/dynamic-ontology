import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { createMockHttpServer, loadMockRoutes } from "../scripts/mock-server.mjs";

import { applyAssistantChatEventToMessages } from "../src/utils/applyAssistantChatEvent.ts";
import { buildStreamAgentChatParams } from "../src/utils/buildStreamAgentChatParams.ts";
import { generateUuidV4 } from "../src/utils/generateUuidV4.ts";
import { resolveAgentChatStreamFailure } from "../src/utils/resolveAgentChatStreamFailure.ts";
import {
  isAssistantPropertyProposalCode,
  isAssistantPropertySelectionCard,
  mapAssistantPropertySelectionRows,
} from "../src/utils/mapAssistantPropertySelectionRows.ts";
import { splitAssistantChatContentBlocks } from "../src/utils/splitAssistantChatContent.ts";
import { resolveAssistantBuildProgress } from "../src/utils/resolveAssistantBuildProgress.ts";
import {
  resolveAssistantSelectionConfirmDisplay,
  resolveAssistantSelectionConfirmMessage,
  toggleAssistantSelectionIds,
} from "../src/utils/toggleAssistantSelectionIds.ts";

/**
 * @description 读取相对 tests 目录的源文件文本。
 * @param relativePath 相对路径。
 * @returns 文件内容。
 */
function readSource(relativePath) {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
}

test("generateUuidV4 uses getRandomValues when randomUUID is missing", () => {
  const bytes = Uint8Array.from({ length: 16 }, (_, index) => index + 1);
  const value = generateUuidV4({
    getRandomValues(target) {
      target.set(bytes);
      return target;
    },
  });
  assert.match(value, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.doesNotMatch(readSource("../src/utils/generateUuidV4.ts"), /randomUUID/);
});

test("generateUuidV4 fails when getRandomValues is unavailable", () => {
  assert.throws(() => generateUuidV4({}), /不支持生成会话 id/);
});

test("buildStreamAgentChatParams omits missing datasource and space", () => {
  assert.deepEqual(
    buildStreamAgentChatParams({
      message: "  平台上有哪些本体？  ",
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
    }),
    {
      message: "平台上有哪些本体？",
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
    },
  );
  assert.deepEqual(
    buildStreamAgentChatParams({
      message: "继续",
      sessionId: "session-1",
      spaceId: "92",
      datasourceId: null,
    }),
    {
      message: "继续",
      sessionId: "session-1",
      spaceId: 92,
    },
  );
  assert.deepEqual(
    buildStreamAgentChatParams({
      message: "无效空间",
      sessionId: "session-2",
      spaceId: "abc",
      datasourceId: 3,
    }),
    {
      message: "无效空间",
      sessionId: "session-2",
      datasourceId: 3,
    },
  );
});

test("applyAssistantChatEventToMessages folds process events and appends content", () => {
  const assistantId = "assistant-1";
  const start = [
    { id: "user-1", role: "user", content: "平台上有哪些本体？" },
    { id: assistantId, role: "assistant", content: "", processItems: [] },
  ];

  const afterThinking = applyAssistantChatEventToMessages(start, assistantId, {
    type: "thinking",
    content: "正在检索平台本体列表",
  });
  const afterTool = applyAssistantChatEventToMessages(afterThinking, assistantId, {
    type: "tool_call",
    tool: "searchDatasources",
    args: '{"keyword":"本体"}',
  });
  const afterResult = applyAssistantChatEventToMessages(afterTool, assistantId, {
    type: "tool_result",
    tool: "searchDatasources",
    summary: "找到 2 个数据源",
  });
  const afterContent = applyAssistantChatEventToMessages(afterResult, assistantId, {
    type: "content",
    content: "平台当前有以下本体：",
  });
  const afterSelection = applyAssistantChatEventToMessages(afterContent, assistantId, {
    type: "selection_request",
    scenario: "space_select",
    title: "请选择目标本体空间",
    multiSelect: false,
    options: [{ id: "3", label: "PG 主库" }],
  });

  const assistant = afterSelection[1];
  assert.equal(assistant.role, "assistant");
  assert.equal(assistant.content, "平台当前有以下本体：");
  assert.deepEqual(assistant.processItems, [
    { kind: "thinking", text: "正在检索平台本体列表" },
    { kind: "tool_call", text: 'searchDatasources {"keyword":"本体"}' },
    { kind: "tool_result", text: "searchDatasources 找到 2 个数据源" },
  ]);
  assert.deepEqual(assistant.selection, {
    scenario: "space_select",
    title: "请选择目标本体空间",
    multiSelect: false,
    options: [{ id: "3", label: "PG 主库" }],
  });
});

test("applyAssistantChatEventToMessages ignores done and unknown events", () => {
  const assistantId = "assistant-3";
  const start = [{ id: assistantId, role: "assistant", content: "已有内容", processItems: [] }];
  const afterDone = applyAssistantChatEventToMessages(start, assistantId, { type: "done" });
  const afterUnknown = applyAssistantChatEventToMessages(afterDone, assistantId, { type: "other" });
  assert.equal(afterUnknown[0]?.content, "已有内容");
  assert.equal(afterUnknown[0]?.errorMessage, undefined);
});

test("generateUuidV4 fails when random bytes are incomplete", () => {
  assert.throws(
    () =>
      generateUuidV4({
        getRandomValues() {
          return new Uint8Array(4);
        },
      }),
    /不支持生成会话 id/,
  );
});

test("applyAssistantChatEventToMessages writes error content onto the assistant message", () => {
  const assistantId = "assistant-2";
  const next = applyAssistantChatEventToMessages([{ id: assistantId, role: "assistant", content: "", processItems: [] }], assistantId, {
    type: "error",
    content: "对话失败，请稍后重试",
  });
  assert.equal(next[0].errorMessage, "对话失败，请稍后重试");
});

test("assistant build progress follows step markers and terminal events", () => {
  assert.equal(resolveAssistantBuildProgress("普通问答"), undefined);
  const progress = resolveAssistantBuildProgress("【第3步/共11步】正在构建对象");
  assert.equal(progress?.current, 3);
  assert.equal(progress?.steps[0]?.status, "complete");
  assert.equal(progress?.steps[2]?.status, "active");
  assert.equal(progress?.steps[3]?.status, "pending");
  assert.equal(resolveAssistantBuildProgress("【第3步/共11步】", "done")?.steps[2]?.status, "complete");
  assert.equal(resolveAssistantBuildProgress("【第3步/共11步】", "error")?.steps[2]?.status, "error");
});

test("resolveAgentChatStreamFailure treats connection reset after output as complete", () => {
  assert.deepEqual(resolveAgentChatStreamFailure({ cause: new Error("Connection reset"), alreadyTerminal: false, hasOutput: true }), {
    kind: "complete",
  });
  assert.deepEqual(resolveAgentChatStreamFailure({ cause: new Error("Connection reset"), alreadyTerminal: true, hasOutput: true }), {
    kind: "ignore",
  });
  assert.deepEqual(resolveAgentChatStreamFailure({ cause: new Error("read ECONNRESET"), alreadyTerminal: false, hasOutput: false }), {
    kind: "fail",
    message: "对话连接已中断，请重试。",
  });
  assert.deepEqual(resolveAgentChatStreamFailure({ cause: new Error("对话请求失败，请稍后重试。"), alreadyTerminal: false, hasOutput: false }), {
    kind: "fail",
    message: "对话请求失败，请稍后重试。",
  });
});

test("agent stream api uses SSE, AGENT_URL and access-token", () => {
  const source = readSource("../src/apis/agentChatApi.ts");
  assert.match(source, /export async function postAgentChatStreamInterface/);
  assert.match(source, /fetchEventSource/);
  assert.match(source, /DOMAIN_CONFIG\.AGENT_URL/);
  assert.match(source, /\/chat\/stream/);
  assert.match(source, /access-token/);
  assert.match(source, /getAccessTokenHeader/);
  assert.match(source, /isAgentChatStreamClosedError/);
  assert.doesNotMatch(source, /from "@\/utils\/request"/);
});

test("mock agent stream returns typed SSE events", async () => {
  const server = createMockHttpServer({ routes: await loadMockRoutes() });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.equal(typeof address, "object");
  const response = await fetch(`http://127.0.0.1:${address.port}/agent/chat/stream`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "平台上有哪些本体？", sessionId: "session-1" }),
  });
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /text\/event-stream/);
  assert.match(body, /data: \{"type":"thinking"/);
  assert.match(body, /data: \{"type":"done"\}/);
  const errorResponse = await fetch(`http://127.0.0.1:${address.port}/agent/chat/stream/error`, { method: "POST" });
  const errorBody = await errorResponse.text();
  assert.match(errorBody, /data: \{"type":"error","content":"对话失败，请稍后重试"\}/);
  server.close();
});

test("runtime config type allows optional AGENT_URL", () => {
  const source = readSource("../src/types/global/runtimeConfigType.ts");
  assert.match(source, /readonly AGENT_URL\?: string/);
});

test("ai assistant composable starts a new conversation by replacing sessionId only", () => {
  const source = readSource("../src/composables/agent/useAiAssistantChat.ts");
  assert.match(source, /export function useAiAssistantChat/);
  assert.match(source, /function startNewAssistantConversation/);
  assert.match(source, /generateUuidV4/);
  assert.match(source, /buildStreamAgentChatParams/);
  assert.match(source, /postAgentChatStreamInterface/);
  assert.match(source, /AbortController/);
  assert.match(source, /onScopeDispose/);
  assert.match(source, /resolveAgentChatStreamFailure/);
  assert.doesNotMatch(source, /clear_context/);
  assert.doesNotMatch(source, /datasourceId/);
});

test("toggleAssistantSelectionIds supports single and multi checkbox selection", () => {
  assert.deepEqual(toggleAssistantSelectionIds(["1"], "2", false, true), ["2"]);
  assert.deepEqual(toggleAssistantSelectionIds(["2"], "2", false, false), []);
  assert.deepEqual(toggleAssistantSelectionIds(["1"], "2", true, true), ["1", "2"]);
  assert.deepEqual(toggleAssistantSelectionIds(["1", "2"], "1", true, false), ["2"]);
  assert.equal(resolveAssistantSelectionConfirmMessage(["3"]), "3");
  assert.equal(resolveAssistantSelectionConfirmMessage(["3", "5"]), "3,5");
  assert.equal(resolveAssistantSelectionConfirmMessage([]), "");
  assert.equal(
    resolveAssistantSelectionConfirmDisplay(
      ["13"],
      [
        { id: "13", label: "海军本体空间" },
        { id: "1", label: "xxx战场1" },
      ],
    ),
    "海军本体空间",
  );
  assert.equal(
    resolveAssistantSelectionConfirmDisplay(
      ["id", "target_name"],
      [
        { id: "id", label: "主键ID" },
        { id: "target_name", label: "目标名称" },
      ],
    ),
    "主键ID、目标名称",
  );
  assert.equal(resolveAssistantSelectionConfirmDisplay(["missing"], [{ id: "13", label: "海军本体空间" }]), "missing");
  assert.equal(resolveAssistantSelectionConfirmDisplay([], [{ id: "13", label: "海军本体空间" }]), "");
});

test("ai assistant drawer uses the project composable and drops local replies", () => {
  const drawer = readSource("../src/layout/components/AiAssistantDrawer.vue");
  const conversation = readSource("../src/layout/components/AiAssistantConversation.vue");
  assert.match(drawer, /useAiAssistantChat/);
  assert.match(drawer, /startNewAssistantConversation/);
  assert.match(drawer, /新对话/);
  assert.doesNotMatch(drawer, /promptReplies/);
  assert.doesNotMatch(drawer, /function resolveAssistantReply/);
  assert.match(conversation, /processItems/);
  assert.match(conversation, /过程/);
  assert.match(conversation, /el-checkbox/);
  assert.match(conversation, /aircas-checkbox/);
  assert.match(conversation, /确认/);
  assert.match(conversation, /select-option/);
  assert.match(conversation, /resolveAssistantSelectionConfirmDisplay/);
  assert.match(conversation, /splitAssistantChatContentBlocks/);
  assert.match(conversation, /ai-assistant-drawer__content-item/);
  assert.match(conversation, /AiAssistantPropertySelectionTable/);
  assert.match(conversation, /isAssistantPropertySelectionCard/);
  assert.doesNotMatch(conversation, /@click="emit\('select-option', option.id\)"/);
  const propertyTable = readSource("../src/layout/components/AiAssistantPropertySelectionTable.vue");
  assert.match(propertyTable, /aircas-table/);
  assert.match(propertyTable, /aircas-table--flat/);
  assert.match(propertyTable, /el-table-column/);
  assert.match(propertyTable, /属性名称/);
  assert.match(conversation, /本体构建步骤/);
  assert.match(conversation, /ai-assistant-drawer__build-steps/);
  assert.match(conversation, /\.ai-assistant-drawer__message--assistant \.ai-assistant-drawer__bubble \{[\s\S]*max-width: 95%/);
  assert.match(drawer, /size="620px"/);
  assert.match(drawer, /@keydown="handleAssistantInputKeydown"/);
  assert.match(drawer, /event\.key !== "Enter"/);
  assert.match(drawer, /event\.isComposing/);
  assert.match(drawer, /event\.shiftKey/);
  assert.match(drawer, /event\.preventDefault\(\)/);
});

test("mapAssistantPropertySelectionRows builds table rows and detects property cards", () => {
  const options = [
    {
      id: "id",
      label: "主键ID",
      description: "bigserial · hms_target · 主键",
      payload: {
        name: "主键ID",
        description: "主键ID",
        field: "id",
        type: "bigserial",
        sourceTable: "hms_target",
        primaryKey: true,
        viaField: "",
      },
    },
    {
      id: "target_name",
      label: "目标名称",
      payload: { name: "目标名称", field: "target_name", type: "varchar", sourceTable: "hms_target", primaryKey: false },
    },
  ];
  assert.equal(isAssistantPropertySelectionCard(undefined), false);
  assert.equal(isAssistantPropertySelectionCard({ scenario: "properties_select", options }), true);
  assert.equal(isAssistantPropertySelectionCard({ scenario: "space_select", options: [{ id: "13", label: "海军本体空间" }] }), false);
  assert.deepEqual(mapAssistantPropertySelectionRows(options), [
    { id: "id", name: "主键ID", field: "id", dataType: "bigserial", sourceTable: "hms_target", primaryKey: true, description: "主键ID" },
    { id: "target_name", name: "目标名称", field: "target_name", dataType: "varchar", sourceTable: "hms_target", primaryKey: false, description: "" },
  ]);
  assert.equal(isAssistantPropertyProposalCode('{"stage":"properties_proposed","properties":[]}'), true);
  assert.equal(isAssistantPropertyProposalCode('{"stage":"object_defined"}'), false);
});

test("splitAssistantChatContentBlocks turns semantic analysis into separate rows", () => {
  assert.deepEqual(splitAssistantChatContentBlocks(""), []);
  assert.deepEqual(splitAssistantChatContentBlocks("请确认该定义是否准确。"), [{ kind: "text", text: "请确认该定义是否准确。" }]);
  assert.deepEqual(
    splitAssistantChatContentBlocks(
      [
        "【第1步/共11步】  ",
        "您描述的对象为：**一种用于远程精确打击的轮式火箭炮系统**。",
        "据此，我为您拟定本体对象草案如下：",
        "- **对象名称**：海马斯火箭炮系统",
        "- **对象标识**：himarsRocketSystem（英文驼峰命名）",
        "- **一句话定义**：HIMARS 远程精确打击武器系统",
        "- **领域归属**：陆基武器装备",
        "",
        "请确认该定义是否准确。",
      ].join("\n"),
    ),
    [
      { kind: "text", text: "【第1步/共11步】" },
      { kind: "text", text: "您描述的对象为：一种用于远程精确打击的轮式火箭炮系统。" },
      { kind: "text", text: "据此，我为您拟定本体对象草案如下：" },
      { kind: "item", label: "对象名称", text: "海马斯火箭炮系统" },
      { kind: "item", label: "对象标识", text: "himarsRocketSystem（英文驼峰命名）" },
      { kind: "item", label: "一句话定义", text: "HIMARS 远程精确打击武器系统" },
      { kind: "item", label: "领域归属", text: "陆基武器装备" },
      { kind: "text", text: "请确认该定义是否准确。" },
    ],
  );
  assert.deepEqual(splitAssistantChatContentBlocks("- 匹配表名：`hms_target`"), [{ kind: "item", label: "匹配表名", text: "hms_target" }]);
  assert.deepEqual(splitAssistantChatContentBlocks('```json\n{"stage":"object_defined"}\n```'), [{ kind: "code", text: '{"stage":"object_defined"}' }]);
  assert.deepEqual(splitAssistantChatContentBlocks('前文\n```json\n{"a":1}'), [
    { kind: "text", text: "前文" },
    { kind: "code", text: '{"a":1}' },
  ]);
  assert.deepEqual(splitAssistantChatContentBlocks("请在上方卡片中勾选需要的关系。"), []);
  assert.deepEqual(splitAssistantChatContentBlocks("已推导出关系候选。\n请在上方卡片中勾选需要的关系。\n请勾选需要纳入本体的关系"), [
    { kind: "text", text: "已推导出关系候选。" },
    { kind: "text", text: "请勾选需要纳入本体的关系" },
  ]);
  assert.deepEqual(splitAssistantChatContentBlocks("请在上方卡片中选择目标空间"), []);
});

test("ai assistant selection confirm shows labels in the user bubble and still sends option ids", () => {
  const source = readSource("../src/composables/agent/useAiAssistantChat.ts");
  assert.match(source, /function sendAssistantMessage\(text\?: string, displayContent\?: string\)/);
  assert.match(source, /content: visibleContent/);
  assert.match(source, /message,/);
  assert.match(source, /function selectAssistantOption\(optionId: string, displayContent\?: string\)/);
  assert.match(source, /sendAssistantMessage\(optionId, displayContent\)/);
});

test("llm builder assistant entry stays a local message", () => {
  const source = readSource("../src/views/OntologyLlmBuilder/index.vue");
  assert.match(source, /function openAssistant/);
  assert.match(source, /AI 助手将在后续步骤中提供构建建议/);
  assert.doesNotMatch(source, /useAiAssistantChat/);
});
