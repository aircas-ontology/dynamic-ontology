import type {
  ActionTreeBindableAction,
  ActionTreeBindableParam,
  BehaviorTreeBlackboardItem,
  BehaviorTreeInputBindingDraft,
  BehaviorTreeNodeConfigDraft,
  BehaviorTreeNodeDraft,
  BehaviorTreeOutputBindingDraft,
  BehaviorTreeSuccessConditionDraft,
} from "@/types";
import { resolveBehaviorTreeBlackboardSource } from "../../../utils/behaviorTreeBlackboard.ts";

/** 入参取值来源选项。 */
export const BEHAVIOR_TREE_INPUT_FROM_OPTIONS = [
  { value: "", label: "默认（按行为声明的来源）" },
  { value: "BLACKBOARD", label: "黑板变量" },
  { value: "ACTION_OUTPUT", label: "行为节点出参" },
] as const;

/** 行为声明来源中文。 */
export const BEHAVIOR_TREE_PARAM_SOURCE_LABELS: Record<string, string> = {
  EXTERNAL: "外部输入",
  PROPERTY: "对象属性",
  FIXED: "固定值",
  OBJECT: "对象",
  LIST: "List",
};

/**
 * @description 按 name 去重参数列表。
 * @param list 参数列表。
 * @returns 去重后的参数。
 */
export function dedupeBehaviorTreeActionParams(list: ActionTreeBindableParam[] | null | undefined): ActionTreeBindableParam[] {
  const seen: Record<string, true> = {};
  const rows: ActionTreeBindableParam[] = [];
  for (const item of list || []) {
    if (!item?.name || seen[item.name]) continue;
    seen[item.name] = true;
    rows.push(item);
  }
  return rows;
}

/**
 * @description 解析可配置入参列表（优先 bindableInputs）。
 * @param action 可绑定行为。
 * @returns 入参列表。
 */
export function listBehaviorTreeBindableInputs(action: ActionTreeBindableAction | null | undefined): ActionTreeBindableParam[] {
  if (!action) return [];
  return dedupeBehaviorTreeActionParams(action.bindableInputs?.length ? action.bindableInputs : action.inputParams);
}

/**
 * @description 解析可回传出参列表（优先 bindableOutputs）。
 * @param action 可绑定行为。
 * @returns 出参列表。
 */
export function listBehaviorTreeBindableOutputs(action: ActionTreeBindableAction | null | undefined): ActionTreeBindableParam[] {
  if (!action) return [];
  return dedupeBehaviorTreeActionParams(action.bindableOutputs?.length ? action.bindableOutputs : action.outputParams);
}

/**
 * @description 读取 ACTION 入参绑定草稿列表。
 * @param config 节点配置。
 * @returns 绑定列表。
 */
export function listBehaviorTreeInputBindingDrafts(config: BehaviorTreeNodeConfigDraft | null | undefined): BehaviorTreeInputBindingDraft[] {
  const list = config?.inputBindings;
  return Array.isArray(list) ? list : [];
}

/**
 * @description 读取 ACTION 出参回传草稿列表。
 * @param config 节点配置。
 * @returns 回传列表。
 */
export function listBehaviorTreeOutputBindingDrafts(config: BehaviorTreeNodeConfigDraft | null | undefined): BehaviorTreeOutputBindingDraft[] {
  const list = config?.outputBindings;
  return Array.isArray(list) ? list : [];
}

/**
 * @description 查找指定入参绑定。
 * @param config 节点配置。
 * @param key 入参名。
 * @returns 绑定或 null。
 */
export function findBehaviorTreeInputBindingDraft(config: BehaviorTreeNodeConfigDraft | null | undefined, key: string): BehaviorTreeInputBindingDraft | null {
  return listBehaviorTreeInputBindingDrafts(config).find((item) => item.key === key) || null;
}

/**
 * @description 查找指定出参回传。
 * @param config 节点配置。
 * @param key 出参标识。
 * @returns 回传或 null。
 */
export function findBehaviorTreeOutputBindingDraft(config: BehaviorTreeNodeConfigDraft | null | undefined, key: string): BehaviorTreeOutputBindingDraft | null {
  return listBehaviorTreeOutputBindingDrafts(config).find((item) => item.key === key) || null;
}

/**
 * @description 更新或删除一条入参绑定；from 清空即删除。
 * @param config 节点配置。
 * @param key 入参名。
 * @param patch 补丁。
 */
export function patchBehaviorTreeInputBinding(
  config: BehaviorTreeNodeConfigDraft,
  key: string,
  patch: Partial<BehaviorTreeInputBindingDraft> & { from?: BehaviorTreeInputBindingDraft["from"] },
): void {
  const list = listBehaviorTreeInputBindingDrafts(config).map((item) => ({ ...item }));
  const index = list.findIndex((item) => item.key === key);
  const base = index >= 0 ? list[index] : undefined;
  const from = patch.from ?? base?.from ?? "";
  const item: BehaviorTreeInputBindingDraft = {
    key,
    from,
    blackboardKey: patch.blackboardKey !== undefined ? patch.blackboardKey : base?.blackboardKey,
    fromNodeId: patch.fromNodeId !== undefined ? patch.fromNodeId : base?.fromNodeId,
    fromOutput: patch.fromOutput !== undefined ? patch.fromOutput : base?.fromOutput,
  };
  if (!item.from) {
    if (index >= 0) list.splice(index, 1);
  } else {
    if (!item.blackboardKey) delete item.blackboardKey;
    if (!item.fromNodeId) delete item.fromNodeId;
    if (!item.fromOutput) delete item.fromOutput;
    if (index >= 0) list.splice(index, 1, item);
    else list.push(item);
  }
  config.inputBindings = list;
}

/**
 * @description 更新或删除一条出参回传；黑板键清空即删除。
 * @param config 节点配置。
 * @param key 出参标识。
 * @param blackboardKey 黑板键。
 */
export function patchBehaviorTreeOutputBinding(config: BehaviorTreeNodeConfigDraft, key: string, blackboardKey: string): void {
  const list = listBehaviorTreeOutputBindingDrafts(config).map((item) => ({ ...item }));
  const index = list.findIndex((item) => item.key === key);
  const trimmed = blackboardKey.trim();
  if (!trimmed) {
    if (index >= 0) list.splice(index, 1);
  } else if (index >= 0) {
    list.splice(index, 1, { key, blackboardKey: trimmed });
  } else {
    list.push({ key, blackboardKey: trimmed });
  }
  config.outputBindings = list;
}

/**
 * @description 将后端 inputBindings 对象转为草稿数组。
 * @param raw 序列化对象。
 * @returns 草稿列表。
 */
export function mapBehaviorTreeInputBindingsToDraft(raw: unknown): BehaviorTreeInputBindingDraft[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const rows: BehaviorTreeInputBindingDraft[] = [];
  for (const [name, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!name || !value || typeof value !== "object" || Array.isArray(value)) continue;
    const binding = value as Record<string, unknown>;
    const blackboardKey = typeof binding.blackboardKey === "string" ? binding.blackboardKey.trim() : "";
    if (blackboardKey) {
      rows.push({ key: name, from: "BLACKBOARD", blackboardKey });
      continue;
    }
    const nodeId = typeof binding.nodeId === "string" ? binding.nodeId.trim() : "";
    const output = typeof binding.output === "string" ? binding.output.trim() : "";
    if (nodeId && output) {
      rows.push({ key: name, from: "ACTION_OUTPUT", fromNodeId: nodeId, fromOutput: output });
    }
  }
  return rows;
}

/**
 * @description 将后端 outputBindings 对象转为草稿数组。
 * @param raw 序列化对象。
 * @returns 草稿列表。
 */
export function mapBehaviorTreeOutputBindingsToDraft(raw: unknown): BehaviorTreeOutputBindingDraft[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const rows: BehaviorTreeOutputBindingDraft[] = [];
  for (const [name, value] of Object.entries(raw as Record<string, unknown>)) {
    const blackboardKey = typeof value === "string" ? value.trim() : "";
    if (!name || !blackboardKey) continue;
    rows.push({ key: name, blackboardKey });
  }
  return rows;
}

/**
 * @description 将入参绑定草稿序列化为后端对象；半填项跳过。
 * @param drafts 草稿列表。
 * @returns 序列化对象或 undefined。
 */
export function serializeBehaviorTreeInputBindings(
  drafts: BehaviorTreeInputBindingDraft[] | undefined,
): Record<string, { blackboardKey: string } | { nodeId: string; output: string }> | undefined {
  const out: Record<string, { blackboardKey: string } | { nodeId: string; output: string }> = {};
  for (const item of drafts || []) {
    const key = item.key?.trim();
    if (!key || !item.from) continue;
    if (item.from === "BLACKBOARD") {
      const blackboardKey = (item.blackboardKey || "").trim();
      if (blackboardKey) out[key] = { blackboardKey };
      continue;
    }
    if (item.from === "ACTION_OUTPUT") {
      const nodeId = (item.fromNodeId || "").trim();
      const output = (item.fromOutput || "").trim();
      if (nodeId && output) out[key] = { nodeId, output };
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * @description 将出参回传草稿序列化为后端对象。
 * @param drafts 草稿列表。
 * @returns 序列化对象或 undefined。
 */
export function serializeBehaviorTreeOutputBindings(drafts: BehaviorTreeOutputBindingDraft[] | undefined): Record<string, string> | undefined {
  const out: Record<string, string> = {};
  for (const item of drafts || []) {
    const key = item.key?.trim();
    const blackboardKey = (item.blackboardKey || "").trim();
    if (!key || !blackboardKey) continue;
    out[key] = blackboardKey;
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * @description 收集顺序子树中必然成功的 ACTION 节点。
 * @param node 子树根。
 * @param out 输出列表。
 */
function collectSureBehaviorTreeActions(node: BehaviorTreeNodeDraft, out: BehaviorTreeNodeDraft[]): void {
  if (node.kind === "ACTION") {
    out.push(node);
    return;
  }
  if (node.kind !== "SEQUENCE") return;
  for (const child of node.children || []) collectSureBehaviorTreeActions(child, out);
}

/**
 * @description 扫描目标节点之前必然成功的 ACTION。
 * @param nodes 同级节点。
 * @param ordered 是否顺序保证。
 * @param targetId 目标节点 id。
 * @returns 是否找到及前置列表。
 */
function scanSureBehaviorTreeBefore(nodes: BehaviorTreeNodeDraft[], ordered: boolean, targetId: string): { found: boolean; out: BehaviorTreeNodeDraft[] } {
  const out: BehaviorTreeNodeDraft[] = [];
  for (const node of nodes || []) {
    if (node.id === targetId) return { found: true, out };
    if (node.kind === "ACTION") {
      if (ordered) out.push(node);
      continue;
    }
    const inner = scanSureBehaviorTreeBefore(node.children || [], node.kind === "SEQUENCE", targetId);
    if (inner.found) return { found: true, out: out.concat(inner.out) };
    if (ordered) collectSureBehaviorTreeActions(node, out);
  }
  return { found: false, out: [] };
}

/**
 * @description 解析目标节点可引用的上游必然成功 ACTION 列表。
 * @param roots 树根。
 * @param targetId 目标节点 id。
 * @returns 上游 ACTION 列表。
 */
export function listBehaviorTreeSurePredecessorActions(roots: BehaviorTreeNodeDraft[], targetId: string): BehaviorTreeNodeDraft[] {
  return scanSureBehaviorTreeBefore(roots, true, targetId).out;
}

/**
 * @description 紧邻的上一个可引用 ACTION；更早结果应走黑板。
 * @param roots 树根。
 * @param targetId 目标节点 id。
 * @returns 上一个 ACTION 或 null。
 */
export function findBehaviorTreeSurePreviousActionNode(roots: BehaviorTreeNodeDraft[], targetId: string): BehaviorTreeNodeDraft | null {
  const list = listBehaviorTreeSurePredecessorActions(roots, targetId);
  return list.length ? (list[list.length - 1] ?? null) : null;
}

/**
 * @description 出参可回传的黑板键选项。
 * @param blackboard 黑板草稿。
 * @param outputName 出参标识。
 * @param current 当前已选键。
 * @returns 选项列表。
 */
export function listBehaviorTreeReturnableBlackboardOptions(
  blackboard: BehaviorTreeBlackboardItem[],
  outputName: string,
  current: string,
): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [{ value: "", label: "（不回传）" }];
  for (const item of blackboard || []) {
    const key = item.key.trim();
    if (!key) continue;
    const source = resolveBehaviorTreeBlackboardSource(item);
    if (source === "EXTERNAL") {
      options.push({ value: key, label: `${key} (${item.valueType} · 外部输入)` });
    } else if (source === "PROPERTY" && item.bindPropertyUniqueIdentifier.trim() === outputName) {
      options.push({ value: key, label: `${key} (${item.valueType} · 对象属性，写回表后进黑板)` });
    }
  }
  if (current && !options.some((item) => item.value === current)) {
    options.push({
      value: current,
      label: `${current}（不满足回传条件：不是外部输入键，也不是绑本出参写回属性的对象属性键）`,
    });
  }
  return options;
}

/**
 * @description 按 actionApi 查找可绑定行为。
 * @param availableActions 目录。
 * @param actionApi 行为 api。
 * @returns 行为或 null。
 */
export function findBehaviorTreeBindableAction(availableActions: ActionTreeBindableAction[], actionApi: string): ActionTreeBindableAction | null {
  const api = actionApi.trim();
  if (!api) return null;
  return availableActions.find((item) => item.actionApi === api) || null;
}

/**
 * @description 读取 ACTION 执行成功条件草稿。
 * @param config 节点配置。
 * @returns 成功条件草稿。
 */
export function readBehaviorTreeSuccessConditionDraft(config: BehaviorTreeNodeConfigDraft | null | undefined): BehaviorTreeSuccessConditionDraft {
  const raw = config?.successCondition;
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || !("expression" in raw)) {
    return { expression: "" };
  }
  const expression = raw.expression;
  return { expression: typeof expression === "string" ? expression : expression == null ? "" : String(expression) };
}

/**
 * @description 更新 ACTION 执行成功条件草稿；表达式为空时删除条件。
 * @param config 节点配置。
 * @param patch 字段补丁。
 */
export function patchBehaviorTreeSuccessCondition(config: BehaviorTreeNodeConfigDraft, patch: Partial<BehaviorTreeSuccessConditionDraft>): void {
  const next = { ...readBehaviorTreeSuccessConditionDraft(config), ...patch };
  const expression = next.expression.trim();
  if (!expression) {
    delete config.successCondition;
    return;
  }
  config.successCondition = { expression };
}

/**
 * @description 将后端 successCondition 转为草稿；旧 outputKey/op/value 格式视为未配置。
 * @param raw 序列化对象。
 * @returns 草稿；未配置时返回空草稿。
 */
export function mapBehaviorTreeSuccessConditionToDraft(raw: unknown): BehaviorTreeSuccessConditionDraft {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { expression: "" };
  }
  const record = raw as Record<string, unknown>;
  if (!("expression" in record)) {
    return { expression: "" };
  }
  return { expression: record.expression == null ? "" : String(record.expression) };
}

/**
 * @description 将成功条件草稿序列化为保存对象；空表达式返回 null。
 * @param draft 草稿。
 * @returns 序列化对象或 null。
 */
export function serializeBehaviorTreeSuccessCondition(draft: BehaviorTreeSuccessConditionDraft | null | undefined): Record<string, unknown> | null {
  const expression = String(draft?.expression || "").trim();
  if (!expression) return null;
  return { expression };
}
