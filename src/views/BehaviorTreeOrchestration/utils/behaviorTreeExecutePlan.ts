import type {
  BehaviorTreeBlackboardItem,
  BehaviorTreeExecuteInputs,
  BehaviorTreeExecuteInstanceRequirement,
  BehaviorTreeExecuteOutputParam,
  BehaviorTreeNodeDraft,
  BehaviorTreeNodeExecDraft,
  BehaviorTreeNodeExecuteData,
  BehaviorTreeObjectPropertyOption,
  PostOntologyActionTreeTestParams,
} from "@/types";
import { resolveBehaviorTreeBlackboardSource } from "./behaviorTreeBlackboard.ts";
import { parseBehaviorTreeTypedValue } from "./behaviorTreeTypedValue.ts";

/**
 * @description 创建空的节点执行草稿。
 * @returns 草稿。
 */
export function createBehaviorTreeNodeExecDraft(): BehaviorTreeNodeExecDraft {
  return {
    params: {},
    entityPrimaryKey: "",
    entityPrimaryKeys: {},
    inputParams: {},
    outputParams: {},
    dataPrimaryKey: "",
  };
}

/**
 * @description 收集执行要求中需要单独传参的节点 id。
 * @param plan 执行要求。
 * @returns 节点 id 列表。
 */
export function listBehaviorTreeExecPlanNodeIds(plan: BehaviorTreeExecuteInputs | null | undefined): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  const push = (nodeId: string | undefined) => {
    const id = (nodeId || "").trim();
    if (!id || seen.has(id)) return;
    seen.add(id);
    list.push(id);
  };
  for (const item of plan?.inputParams ?? []) {
    for (const nodeId of item.nodeIds ?? []) push(nodeId);
  }
  for (const item of plan?.instanceRequirements ?? []) {
    for (const nodeId of item.nodeIds ?? []) push(nodeId);
  }
  for (const item of plan?.outputParams ?? []) {
    for (const nodeId of item.nodeIds ?? []) push(nodeId);
  }
  return list.sort();
}

/**
 * @description 收集需要拉取实例列表的对象 id。
 * @param plan 执行要求。
 * @returns 对象 uniqueIdentifier 列表。
 */
export function listBehaviorTreeExecPlanObjectIds(plan: BehaviorTreeExecuteInputs | null | undefined): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  const push = (objectId: string | undefined) => {
    const id = (objectId || "").trim();
    if (!id || seen.has(id)) return;
    seen.add(id);
    list.push(id);
  };
  for (const item of plan?.instanceRequirements ?? []) {
    push(item.objectIdentifier);
    if (item.linkEntityPrimaryKeyRequired) {
      push(item.linkFromObjectIdentifier);
      push(item.linkToObjectIdentifier);
      push(item.linkObjectIdentifier);
    }
  }
  for (const item of plan?.outputParams ?? []) push(item.objectIdentifier);
  return list;
}

/**
 * @description 解析节点展示名。
 * @param roots 树根。
 * @param nodeId 节点 id。
 * @returns 展示名。
 */
export function resolveBehaviorTreeNodeDisplayName(roots: BehaviorTreeNodeDraft[], nodeId: string): string {
  const walk = (nodes: BehaviorTreeNodeDraft[]): string | null => {
    for (const node of nodes) {
      if (node.id === nodeId) return node.displayName.trim() || nodeId;
      const nested = walk(node.children);
      if (nested) return nested;
    }
    return null;
  };
  return walk(roots) || nodeId;
}

/**
 * @description 从树定义收集 ACTION 节点绑定的行为 api。
 * @param roots 树根。
 * @returns nodeId -> actionApi。
 */
export function mapBehaviorTreeBoundActionApis(roots: BehaviorTreeNodeDraft[]): Record<string, string> {
  const map: Record<string, string> = {};
  const walk = (nodes: BehaviorTreeNodeDraft[]) => {
    for (const node of nodes) {
      if (node.kind === "ACTION") {
        const api = (node.config?.actionApi || "").trim();
        if (api) map[node.id] = api;
      }
      walk(node.children);
    }
  };
  walk(roots);
  return map;
}

/**
 * @description 解析节点关系两端对象。
 * @param requirements 该节点相关实例要求。
 * @returns from/to；无关系时为 null。
 */
export function resolveBehaviorTreeNodeLinkEnds(requirements: BehaviorTreeExecuteInstanceRequirement[]): { from: string; to: string; self: boolean } | null {
  for (const item of requirements) {
    if (!item.linkEntityPrimaryKeyRequired) continue;
    const from = (item.linkFromObjectIdentifier || "").trim();
    const to = (item.linkToObjectIdentifier || item.linkObjectIdentifier || "").trim();
    if (!from) continue;
    return { from, to: to || from, self: Boolean(item.selfRelation) || (!!to && from === to) };
  }
  return null;
}

/**
 * @description 过滤节点相关的实例要求。
 * @param plan 执行要求。
 * @param nodeId 节点 id。
 * @returns 要求列表。
 */
export function listBehaviorTreeNodeRequirements(plan: BehaviorTreeExecuteInputs | null | undefined, nodeId: string): BehaviorTreeExecuteInstanceRequirement[] {
  return (plan?.instanceRequirements ?? []).filter((item) => (item.nodeIds ?? []).includes(nodeId));
}

/**
 * @description 过滤节点相关的写回目标。
 * @param plan 执行要求。
 * @param nodeId 节点 id。
 * @returns 出参列表。
 */
export function listBehaviorTreeNodeOutputTargets(plan: BehaviorTreeExecuteInputs | null | undefined, nodeId: string): BehaviorTreeExecuteOutputParam[] {
  return (plan?.outputParams ?? []).filter((item) => (item.nodeIds ?? []).includes(nodeId));
}

/**
 * @description 校验试跑必填数据是否齐全（对齐原型 missingExecData）。
 * @param options 校验上下文。
 * @returns 缺失项文案。
 */
export function collectBehaviorTreeExecMissingFields(options: {
  plan: BehaviorTreeExecuteInputs | null;
  objectLabelById?: Record<string, string>;
  blackboardObjectKeys: Record<string, string>;
  nodeDrafts: Record<string, BehaviorTreeNodeExecDraft>;
}): string[] {
  const { plan, objectLabelById = {}, blackboardObjectKeys, nodeDrafts } = options;
  if (!plan) return [];
  const missing: string[] = [];
  const seen = new Set<string>();
  const push = (text: string) => {
    if (seen.has(text)) return;
    seen.add(text);
    missing.push(text);
  };
  const objectLabel = (objectId: string | undefined) => {
    const id = (objectId || "").trim();
    if (!id) return "";
    return objectLabelById[id] || id;
  };

  for (const param of plan.inputParams ?? []) {
    const key = (param.key || "").trim();
    if (!key) continue;
    const nodeIds = param.nodeIds ?? [];
    if (!nodeIds.length) {
      push(`行为入参 ${key}`);
      continue;
    }
    for (const nodeId of nodeIds) {
      const text = (nodeDrafts[nodeId]?.params[key] || "").trim();
      if (text === "") push(`${nodeId} 的 ${key}`);
    }
  }

  for (const requirement of plan.instanceRequirements ?? []) {
    const objectId = (requirement.objectIdentifier || "").trim();
    const blackboardKeys = requirement.blackboardKeys ?? [];
    if (blackboardKeys.length) {
      if (objectId && !(blackboardObjectKeys[objectId] || "").trim()) {
        push(`黑板属性 ${blackboardKeys.join("、")} 的实例（${objectLabel(objectId)}）`);
      }
      continue;
    }
    for (const nodeId of requirement.nodeIds ?? []) {
      const draft = nodeDrafts[nodeId] || createBehaviorTreeNodeExecDraft();
      const ends = requirement.linkEntityPrimaryKeyRequired ? resolveBehaviorTreeNodeLinkEnds([requirement]) : null;
      const hasEnds = !!ends && (draft.entityPrimaryKeys.from || "").trim() !== "" && (draft.entityPrimaryKeys.to || "").trim() !== "";
      const isEndObject = hasEnds && objectId && ends && (objectId === ends.from || objectId === ends.to);
      const selected = (objectId ? draft.entityPrimaryKeys[objectId] : "")?.trim() || (draft.entityPrimaryKey || "").trim();
      if (!isEndObject && objectId && selected === "") {
        push(`${nodeId} 的实例（${objectLabel(objectId)}）`);
      }
      if (!requirement.linkEntityPrimaryKeyRequired || hasEnds) continue;
      if (ends) {
        push(`${nodeId} 的关系两端实例（From ${objectLabel(ends.from) || "对象未定"}、To ${objectLabel(ends.to) || "对象未定"}）`);
        continue;
      }
      const linkObject = (requirement.linkObjectIdentifier || "").trim();
      if (linkObject && (draft.entityPrimaryKeys[linkObject] || "").trim()) continue;
      push(`${nodeId} 的关系对端实例（${objectLabel(linkObject) || "对端对象未定"}）`);
    }
  }

  for (const nodeId of listBehaviorTreeExecPlanNodeIds(plan)) {
    const draft = nodeDrafts[nodeId] || createBehaviorTreeNodeExecDraft();
    for (const target of listBehaviorTreeNodeOutputTargets(plan, nodeId)) {
      if (target.mode !== "DATA_PRIMARY_KEY") continue;
      const mapKey = (target.key || target.paramName || target.storageGroup || "").trim();
      const row = (draft.outputParams[mapKey]?.rowKey || "").trim() || (draft.dataPrimaryKey || "").trim();
      if (row === "") {
        push(`${nodeId} 的输出参数行主键（${target.displayName || target.storageGroup || "分组行"}）`);
      }
    }
  }

  return missing;
}

/**
 * @description 组装试跑请求体。
 * @param options 组装上下文。
 * @returns 请求体；解析失败时返回 error。
 */
export function buildBehaviorTreeTestPayload(options: {
  spaceId: string;
  treeApi: string;
  plan: BehaviorTreeExecuteInputs | null;
  blackboard: BehaviorTreeBlackboardItem[];
  objectProperties: Record<string, BehaviorTreeObjectPropertyOption>;
  externalInputDraft: Record<string, string>;
  blackboardObjectKeys: Record<string, string>;
  nodeDrafts: Record<string, BehaviorTreeNodeExecDraft>;
}): { payload: PostOntologyActionTreeTestParams } | { error: string } {
  const { spaceId, treeApi, plan, blackboard, objectProperties, externalInputDraft, blackboardObjectKeys, nodeDrafts } = options;
  const payload: PostOntologyActionTreeTestParams = {
    ontologySpaceId: spaceId,
    treeApi,
  };

  const inputs: Record<string, unknown> = {};
  for (const item of blackboard) {
    if (resolveBehaviorTreeBlackboardSource(item) !== "EXTERNAL") continue;
    const key = item.key.trim();
    if (!key) continue;
    const text = (externalInputDraft[key] ?? "").trim();
    if (text === "") continue;
    const parsed = parseBehaviorTreeTypedValue(text, item.valueType);
    if (!parsed.ok) return { error: `inputs.${key} 不是合法的 ${item.valueType}` };
    inputs[key] = parsed.value;
  }
  if (Object.keys(inputs).length) payload.inputs = inputs;

  const entityPrimaryKeys: Record<string, string | number> = {};
  for (const [objectId, value] of Object.entries(blackboardObjectKeys)) {
    const text = value.trim();
    if (text) entityPrimaryKeys[objectId] = text;
  }
  if (Object.keys(entityPrimaryKeys).length) payload.entityPrimaryKeys = entityPrimaryKeys;

  const nodeExecutes: Record<string, BehaviorTreeNodeExecuteData> = {};
  for (const nodeId of listBehaviorTreeExecPlanNodeIds(plan)) {
    const draft = nodeDrafts[nodeId] || createBehaviorTreeNodeExecDraft();
    const entry: BehaviorTreeNodeExecuteData = {};
    const params: Record<string, unknown> = {};
    for (const param of plan?.inputParams ?? []) {
      if (!(param.nodeIds ?? []).includes(nodeId)) continue;
      const key = (param.key || "").trim();
      if (!key) continue;
      const text = (draft.params[key] || "").trim();
      if (text === "") continue;
      const parsed = parseBehaviorTreeTypedValue(text, param.valueType || "STRING");
      if (!parsed.ok) return { error: `节点 ${nodeId} 的入参 ${key} 不是合法的 ${param.valueType || "STRING"}` };
      params[key] = parsed.value;
    }
    if (Object.keys(params).length) entry.params = params;

    const requirements = listBehaviorTreeNodeRequirements(plan, nodeId);
    const ends = resolveBehaviorTreeNodeLinkEnds(requirements);
    const byObject: Record<string, string | number> = {};
    if (ends) {
      const from = (draft.entityPrimaryKeys.from || "").trim();
      const to = (draft.entityPrimaryKeys.to || "").trim();
      if (from) byObject.from = from;
      if (to) byObject.to = to;
    } else {
      const objects = [
        ...new Set(
          requirements
            .filter((item) => !(item.blackboardKeys ?? []).length)
            .map((item) => (item.objectIdentifier || "").trim())
            .filter(Boolean),
        ),
      ];
      if (objects.length <= 1) {
        const text = (objects[0] ? draft.entityPrimaryKeys[objects[0]] : "")?.trim() || (draft.entityPrimaryKey || "").trim();
        if (text) entry.entityPrimaryKey = text;
      } else {
        for (const objectId of objects) {
          const text = (draft.entityPrimaryKeys[objectId] || "").trim();
          if (text) byObject[objectId] = text;
        }
      }
    }
    if (Object.keys(byObject).length) entry.entityPrimaryKeys = byObject;

    const inputParams: NonNullable<BehaviorTreeNodeExecuteData["inputParams"]> = {};
    for (const [key, item] of Object.entries(draft.inputParams)) {
      const instanceText = (item.entityPrimaryKey || "").trim();
      const dataPrimaryKeys: Record<string, string | number> = {};
      for (const [group, row] of Object.entries(item.rows)) {
        const rowText = row.trim();
        if (rowText) dataPrimaryKeys[group] = rowText;
      }
      if (!instanceText && !Object.keys(dataPrimaryKeys).length) continue;
      inputParams[key] = {
        ...(instanceText ? { entityPrimaryKey: instanceText } : {}),
        ...(Object.keys(dataPrimaryKeys).length ? { dataPrimaryKeys } : {}),
      };
    }
    if (Object.keys(inputParams).length) entry.inputParams = inputParams;

    const outputs: NonNullable<BehaviorTreeNodeExecuteData["outputParams"]> = {};
    for (const target of listBehaviorTreeNodeOutputTargets(plan, nodeId)) {
      const mapKey = (target.key || target.paramName || target.storageGroup || "").trim();
      if (!mapKey) continue;
      const item = draft.outputParams[mapKey] || { entityPrimaryKey: "", rowKey: "" };
      const rowText = (item.rowKey || "").trim();
      if (target.mode === "DATA_PRIMARY_KEY") {
        const dataKey = rowText || (draft.dataPrimaryKey || "").trim();
        if (dataKey) entry.dataPrimaryKey = dataKey;
        continue;
      }
      if (target.mode === "RESULT_ONLY") continue;
      const instanceText = (item.entityPrimaryKey || "").trim();
      if (!instanceText && !rowText) continue;
      const location: { entityPrimaryKey?: string | number; dataPrimaryKeys?: Record<string, string | number> } = {};
      if (instanceText) location.entityPrimaryKey = instanceText;
      if (rowText && target.storageGroup) {
        location.dataPrimaryKeys = { [target.storageGroup]: rowText };
      }
      outputs[mapKey] = location;
    }
    if (Object.keys(outputs).length) entry.outputParams = outputs;

    if (Object.keys(entry).length) nodeExecutes[nodeId] = entry;
  }
  if (Object.keys(nodeExecutes).length) payload.nodeExecutes = nodeExecutes;

  void objectProperties;

  return { payload };
}

/**
 * @description 从实体记录提取主键与展示名。
 * @param record 实体记录。
 * @returns 主键与标签；无主键时返回 null。
 */
export function mapBehaviorTreeEntityRecordOption(record: Record<string, unknown>): {
  value: string;
  label: string;
} | null {
  const primary = record.primaryKey ?? record.entityPrimaryKey ?? record.id ?? null;
  if (primary == null || primary === "") return null;
  const value = String(primary);
  const display = (typeof record.displayName === "string" && record.displayName) || (typeof record.name === "string" && record.name) || "";
  return { value, label: display ? `${display} · ${value}` : value };
}
