import type {
  BehaviorTreeBlackboardItem,
  BehaviorTreeExecuteInputParam,
  BehaviorTreeExecuteInputs,
  BehaviorTreeExecuteInstanceRequirement,
  BehaviorTreeExecuteNodePlan,
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
 * @description 读取执行要求中的节点列表（优先 nodes 新格式）。
 * @param plan 执行要求。
 * @returns 节点规划列表。
 */
export function listBehaviorTreeExecuteNodePlans(plan: BehaviorTreeExecuteInputs | null | undefined): BehaviorTreeExecuteNodePlan[] {
  if (!plan) return [];
  if (Array.isArray(plan.nodes) && plan.nodes.length) {
    return plan.nodes.filter((item): item is BehaviorTreeExecuteNodePlan => Boolean(item && String(item.nodeId || "").trim()));
  }
  // 旧扁平结构兼容：按 nodeIds 拼回节点块
  const byNode = new Map<string, BehaviorTreeExecuteNodePlan>();
  const ensure = (nodeId: string): BehaviorTreeExecuteNodePlan => {
    let node = byNode.get(nodeId);
    if (!node) {
      node = { nodeId, inputParams: [], instanceRequirements: [], outputParams: [] };
      byNode.set(nodeId, node);
    }
    return node;
  };
  for (const param of plan.inputParams ?? []) {
    if (!param) continue;
    for (const nodeId of param.nodeIds ?? []) {
      const id = nodeId.trim();
      if (!id) continue;
      ensure(id).inputParams = [...(ensure(id).inputParams ?? []), param];
    }
  }
  for (const requirement of plan.instanceRequirements ?? []) {
    if (!requirement) continue;
    if ((requirement.blackboardKeys ?? []).length) continue;
    for (const nodeId of requirement.nodeIds ?? []) {
      const id = nodeId.trim();
      if (!id) continue;
      ensure(id).instanceRequirements = [...(ensure(id).instanceRequirements ?? []), requirement];
    }
  }
  for (const target of plan.outputParams ?? []) {
    if (!target) continue;
    for (const nodeId of target.nodeIds ?? []) {
      const id = nodeId.trim();
      if (!id) continue;
      ensure(id).outputParams = [...(ensure(id).outputParams ?? []), target];
    }
  }
  return [...byNode.values()];
}

/**
 * @description 按 nodeId 查找节点执行要求。
 * @param plan 执行要求。
 * @param nodeId 节点 id。
 * @returns 节点规划；没有时为 null。
 */
export function findBehaviorTreeExecuteNodePlan(plan: BehaviorTreeExecuteInputs | null | undefined, nodeId: string): BehaviorTreeExecuteNodePlan | null {
  const id = nodeId.trim();
  if (!id) return null;
  return listBehaviorTreeExecuteNodePlans(plan).find((item) => item.nodeId === id) ?? null;
}

/**
 * @description 收集执行要求中需要单独传参的节点 id，顺序与 executeInputs.nodes 一致。
 * @param plan 执行要求。
 * @returns 节点 id 列表。
 */
export function listBehaviorTreeExecPlanNodeIds(plan: BehaviorTreeExecuteInputs | null | undefined): string[] {
  const list: string[] = [];
  for (const node of listBehaviorTreeExecuteNodePlans(plan)) {
    const hasInputs = (node.inputParams ?? []).length > 0;
    const hasOutputs = (node.outputParams ?? []).length > 0;
    const hasInstances = (node.instanceRequirements ?? []).length > 0;
    if (node.entityPrimaryKeyRequired || hasInputs || hasOutputs || hasInstances) list.push(node.nodeId);
  }
  return list;
}

/**
 * @description 平铺节点入参（附带所属 nodeIds，供校验汇总）。
 * @param plan 执行要求。
 * @returns 入参列表。
 */
export function listBehaviorTreeExecPlanInputs(plan: BehaviorTreeExecuteInputs | null | undefined): BehaviorTreeExecuteInputParam[] {
  const list: BehaviorTreeExecuteInputParam[] = [];
  for (const node of listBehaviorTreeExecuteNodePlans(plan)) {
    for (const param of node.inputParams ?? []) {
      if (!param?.key) continue;
      list.push({
        ...param,
        nodeIds: [node.nodeId],
        actionApis: node.actionApi ? [node.actionApi] : param.actionApis,
      });
    }
  }
  // 旧扁平结构：无 nodeIds 的入参不会拼进节点，仍需参与 EXTERNAL 校验
  if (!(plan?.nodes && plan.nodes.length) && Array.isArray(plan?.inputParams)) {
    for (const param of plan.inputParams) {
      if (!param?.key) continue;
      const hasNode = (param.nodeIds ?? []).some((nodeId) => Boolean(String(nodeId || "").trim()));
      if (hasNode) continue;
      list.push({ ...param, nodeIds: param.nodeIds ?? [] });
    }
  }
  return list;
}

/**
 * @description 平铺实例要求（节点级 + 黑板级 blackboardInstances）。
 * @param plan 执行要求。
 * @returns 实例要求列表。
 */
export function listBehaviorTreeExecPlanInstanceRequirements(plan: BehaviorTreeExecuteInputs | null | undefined): BehaviorTreeExecuteInstanceRequirement[] {
  const list: BehaviorTreeExecuteInstanceRequirement[] = [];
  for (const node of listBehaviorTreeExecuteNodePlans(plan)) {
    for (const requirement of node.instanceRequirements ?? []) {
      if (!requirement) continue;
      list.push({
        ...requirement,
        actionApi: requirement.actionApi || node.actionApi,
        actionDisplayName: requirement.actionDisplayName || node.actionDisplayName,
        nodeIds: [node.nodeId],
      });
    }
  }
  for (const item of plan?.blackboardInstances ?? []) {
    if (!item) continue;
    list.push({
      objectIdentifier: item.objectIdentifier,
      nodeIds: [],
      blackboardKeys: item.blackboardKeys ?? [],
      storageGroups: item.storageGroups ?? [],
    });
  }
  // 旧扁平结构：仅在没有 nodes 时回退
  if (!(plan?.nodes && plan.nodes.length) && Array.isArray(plan?.instanceRequirements)) {
    for (const item of plan.instanceRequirements) {
      if (!item) continue;
      list.push(item);
    }
  }
  return list;
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
  for (const item of listBehaviorTreeExecPlanInstanceRequirements(plan)) {
    push(item.objectIdentifier);
    if (item.linkEntityPrimaryKeyRequired) {
      push(item.linkFromObjectIdentifier);
      push(item.linkToObjectIdentifier);
      push(item.linkObjectIdentifier);
    }
  }
  for (const node of listBehaviorTreeExecuteNodePlans(plan)) {
    for (const target of node.outputParams ?? []) push(target.objectIdentifier);
    for (const param of node.inputParams ?? []) {
      const source = (param.sourceType || "EXTERNAL").trim();
      if (source === "PROPERTY" || source === "OBJECT" || source === "LIST") push(param.objectIdentifier);
    }
  }
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
  return listBehaviorTreeExecPlanInstanceRequirements(plan).filter((item) => (item.nodeIds ?? []).includes(nodeId));
}

/**
 * @description 过滤节点相关的写回目标。
 * @param plan 执行要求。
 * @param nodeId 节点 id。
 * @returns 出参列表。
 */
export function listBehaviorTreeNodeOutputTargets(plan: BehaviorTreeExecuteInputs | null | undefined, nodeId: string): BehaviorTreeExecuteOutputParam[] {
  const node = findBehaviorTreeExecuteNodePlan(plan, nodeId);
  if (node) return (node.outputParams ?? []).filter(Boolean);
  return (plan?.outputParams ?? []).filter((item) => (item?.nodeIds ?? []).includes(nodeId));
}

/**
 * @description 节点入参列表。
 * @param plan 执行要求。
 * @param nodeId 节点 id。
 * @returns 入参。
 */
export function listBehaviorTreeNodeInputParams(plan: BehaviorTreeExecuteInputs | null | undefined, nodeId: string): BehaviorTreeExecuteInputParam[] {
  const node = findBehaviorTreeExecuteNodePlan(plan, nodeId);
  if (node) return (node.inputParams ?? []).filter((item) => Boolean(item?.key));
  return listBehaviorTreeExecPlanInputs(plan).filter((item) => (item.nodeIds ?? []).includes(nodeId));
}

/**
 * @description 出参草稿 map 键。
 * @param target 出参目标。
 * @returns 键。
 */
export function resolveBehaviorTreeOutputDraftKey(target: BehaviorTreeExecuteOutputParam): string {
  if (target.mode === "DATA_PRIMARY_KEY") return "__dataPrimaryKey";
  return (target.key || target.parameterName || target.paramName || target.storageGroup || "").trim();
}

/**
 * @description 黑板分组行草稿键（对象|分组）。
 * @param objectId 对象标识。
 * @param storageGroup 分组名。
 * @returns 草稿键。
 */
export function resolveBehaviorTreeBbGroupRowStateKey(objectId: string, storageGroup: string): string {
  return `${objectId}|${storageGroup}`;
}

/**
 * @description 列出某对象黑板属性需要选择的非主分组。
 * @param plan 执行要求。
 * @param objectId 对象标识。
 * @returns 分组名列表（去重保序）。
 */
export function listBehaviorTreeBlackboardStorageGroups(plan: BehaviorTreeExecuteInputs | null | undefined, objectId: string): string[] {
  const id = objectId.trim();
  if (!id || !plan) return [];
  const seen = new Set<string>();
  const list: string[] = [];
  for (const item of plan.blackboardInstances ?? []) {
    if ((item?.objectIdentifier || "").trim() !== id) continue;
    for (const group of item.storageGroups ?? []) {
      const name = (group?.storageGroup || "").trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      list.push(name);
    }
  }
  return list;
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
  blackboardGroupRows?: Record<string, string>;
  nodeDrafts: Record<string, BehaviorTreeNodeExecDraft>;
}): string[] {
  const { plan, objectLabelById = {}, blackboardObjectKeys, blackboardGroupRows = {}, nodeDrafts } = options;
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

  for (const param of listBehaviorTreeExecPlanInputs(plan)) {
    const key = (param.key || "").trim();
    if (!key) continue;
    const source = (param.sourceType || "EXTERNAL").trim();
    if (source !== "EXTERNAL") continue;
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

  for (const requirement of listBehaviorTreeExecPlanInstanceRequirements(plan)) {
    const objectId = (requirement.objectIdentifier || "").trim();
    const blackboardKeys = requirement.blackboardKeys ?? [];
    if (blackboardKeys.length) {
      if (objectId && !(blackboardObjectKeys[objectId] || "").trim()) {
        push(`黑板属性 ${blackboardKeys.join("、")} 的实例（${objectLabel(objectId)}）`);
        continue;
      }
      for (const group of requirement.storageGroups ?? []) {
        const storageGroup = (group?.storageGroup || "").trim();
        if (!storageGroup || !objectId) continue;
        const rowText = (blackboardGroupRows[resolveBehaviorTreeBbGroupRowStateKey(objectId, storageGroup)] || "").trim();
        if (rowText === "") {
          const keys = Array.isArray(group.blackboardKeys) ? group.blackboardKeys.filter(Boolean) : [];
          push(`黑板属性 ${keys.length ? keys.join("、") : blackboardKeys.join("、")} 的分组 ${storageGroup} 行（${objectLabel(objectId)}）`);
        }
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
      const mapKey = resolveBehaviorTreeOutputDraftKey(target);
      const row = (draft.outputParams[mapKey]?.rowKey || "").trim() || (draft.dataPrimaryKey || "").trim();
      if (row === "") {
        push(`${nodeId} 的输出参数行主键（${target.displayName || target.storageGroup || "分组行"}）`);
      }
    }
  }

  return missing;
}

/**
 * @description 判断入参是否为 LIST 对象属性子表多行（详情三字段同时满足）。
 * @param param 节点入参定义。
 * @returns 是否允许多选子表行。
 */
export function isBehaviorTreeListPropertyMultiRowParam(
  param: Pick<BehaviorTreeExecuteInputParam, "valueType" | "sourceType" | "storageGroup"> | null | undefined,
): boolean {
  if (!param) return false;
  const valueType = String(param.valueType || "")
    .trim()
    .toUpperCase();
  const sourceType = String(param.sourceType || "")
    .trim()
    .toUpperCase();
  const storageGroup = String(param.storageGroup || "").trim();
  return valueType === "LIST" && sourceType === "PROPERTY" && storageGroup !== "" && storageGroup !== "main";
}

/**
 * @description 解析节点入参写入 inputParams 的请求键（优先 paramName）。
 * @param param 节点入参定义。
 * @returns 请求键。
 */
export function resolveBehaviorTreeInputParamRequestKey(param: Pick<BehaviorTreeExecuteInputParam, "key" | "paramName"> | null | undefined): string {
  if (!param) return "";
  return String(param.paramName || param.key || "").trim();
}

/**
 * @description 组装节点入参读位置（实例 + 可选分组行）。
 * @param entityPrimaryKey 实体主键。
 * @param rows 分组名到行主键。
 * @returns 请求位置对象。
 */
function buildBehaviorTreeInputParamLocation(
  entityPrimaryKey: string,
  rows: Record<string, string>,
): {
  entityPrimaryKey: string;
  dataPrimaryKeys?: Record<string, string | number>;
} {
  const location: {
    entityPrimaryKey: string;
    dataPrimaryKeys?: Record<string, string | number>;
  } = { entityPrimaryKey };
  const dataPrimaryKeys: Record<string, string | number> = {};
  for (const [group, row] of Object.entries(rows)) {
    const groupName = group.trim();
    const rowText = String(row ?? "").trim();
    if (!groupName || !rowText) continue;
    dataPrimaryKeys[groupName] = rowText;
  }
  if (Object.keys(dataPrimaryKeys).length) location.dataPrimaryKeys = dataPrimaryKeys;
  return location;
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
  blackboardGroupRows?: Record<string, string>;
  nodeDrafts: Record<string, BehaviorTreeNodeExecDraft>;
}): { payload: PostOntologyActionTreeTestParams } | { error: string } {
  const { spaceId, treeApi, plan, blackboard, objectProperties, externalInputDraft, blackboardObjectKeys, blackboardGroupRows = {}, nodeDrafts } = options;
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

  const inputDataPrimaryKeys: Record<string, Record<string, string | number>> = {};
  for (const [stateKey, value] of Object.entries(blackboardGroupRows)) {
    const text = value.trim();
    if (text === "") continue;
    const separatorIndex = stateKey.indexOf("|");
    if (separatorIndex <= 0) continue;
    const objectId = stateKey.slice(0, separatorIndex).trim();
    const group = stateKey.slice(separatorIndex + 1).trim();
    if (!objectId || !group || !(blackboardObjectKeys[objectId] || "").trim()) continue;
    if (!inputDataPrimaryKeys[objectId]) inputDataPrimaryKeys[objectId] = {};
    inputDataPrimaryKeys[objectId][group] = text;
  }
  if (Object.keys(inputDataPrimaryKeys).length) payload.inputDataPrimaryKeys = inputDataPrimaryKeys;

  const nodeExecutes: Record<string, BehaviorTreeNodeExecuteData> = {};
  for (const nodeId of listBehaviorTreeExecPlanNodeIds(plan)) {
    const draft = nodeDrafts[nodeId] || createBehaviorTreeNodeExecDraft();
    const entry: BehaviorTreeNodeExecuteData = {};
    const params: Record<string, unknown> = {};
    for (const param of listBehaviorTreeNodeInputParams(plan, nodeId)) {
      const key = (param.key || "").trim();
      if (!key) continue;
      const source = (param.sourceType || "EXTERNAL").trim();
      if (source !== "EXTERNAL") continue;
      const text = (draft.params[key] || "").trim();
      if (text === "") continue;
      const parsed = parseBehaviorTreeTypedValue(text, param.valueType || "STRING");
      if (!parsed.ok) return { error: `节点 ${nodeId} 的入参 ${key} 不是合法的 ${param.valueType || "STRING"}` };
      params[key] = parsed.value;
    }
    if (Object.keys(params).length) entry.params = params;

    const inputParams: NonNullable<BehaviorTreeNodeExecuteData["inputParams"]> = {};
    for (const param of listBehaviorTreeNodeInputParams(plan, nodeId)) {
      const draftKey = (param.key || "").trim();
      if (!draftKey) continue;
      const source = (param.sourceType || "EXTERNAL").trim();
      if (!source || source === "EXTERNAL" || source === "FIXED") continue;
      const requestKey = resolveBehaviorTreeInputParamRequestKey(param);
      if (!requestKey) continue;
      const draftItem = draft.inputParams[draftKey];
      const instanceText = (draftItem?.entityPrimaryKey || "").trim();
      if (!instanceText) continue;
      if (isBehaviorTreeListPropertyMultiRowParam(param)) {
        const storageGroup = String(param.storageGroup || "").trim();
        const rowKeys = (draftItem?.rowKeys ?? []).map((item) => String(item ?? "").trim()).filter(Boolean);
        if (!rowKeys.length) continue;
        const locations = rowKeys.map((rowId) =>
          buildBehaviorTreeInputParamLocation(instanceText, {
            [storageGroup]: rowId,
          }),
        );
        inputParams[requestKey] = locations.length === 1 ? locations[0]! : locations;
        continue;
      }
      const rows = draftItem?.rows ?? {};
      inputParams[requestKey] = buildBehaviorTreeInputParamLocation(instanceText, rows);
    }
    if (Object.keys(inputParams).length) entry.inputParams = inputParams;

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

    const outputs: NonNullable<BehaviorTreeNodeExecuteData["outputParams"]> = {};
    for (const target of listBehaviorTreeNodeOutputTargets(plan, nodeId)) {
      if (target.mode === "RESULT_ONLY") continue;
      const mapKey = resolveBehaviorTreeOutputDraftKey(target);
      if (!mapKey) continue;
      const item = draft.outputParams[mapKey] || { entityPrimaryKey: "", rowKey: "" };
      const rowText = (item.rowKey || "").trim();
      if (target.mode === "DATA_PRIMARY_KEY") {
        const dataKey = rowText || (draft.dataPrimaryKey || "").trim();
        if (dataKey) entry.dataPrimaryKey = dataKey;
        continue;
      }
      const instanceText = (item.entityPrimaryKey || "").trim();
      const includeRowKey = Boolean(target.rowRequired) && rowText !== "" && Boolean(target.storageGroup);
      if (!instanceText && !includeRowKey) continue;
      const location: { entityPrimaryKey?: string | number; dataPrimaryKeys?: Record<string, string | number> } = {};
      if (instanceText) location.entityPrimaryKey = instanceText;
      if (includeRowKey && target.storageGroup) {
        location.dataPrimaryKeys = { [target.storageGroup]: rowText };
      }
      const outputKey = (target.key || target.parameterName || target.paramName || "").trim();
      if (outputKey) outputs[outputKey] = location;
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
