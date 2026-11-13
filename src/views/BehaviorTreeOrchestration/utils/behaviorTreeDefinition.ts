import type {
  BehaviorTreeDefinition,
  BehaviorTreeKindMeta,
  BehaviorTreeModel,
  BehaviorTreeNodeConfigDraft,
  BehaviorTreeNodeDraft,
  BehaviorTreeNodeKind,
  BehaviorTreeOrchestrationMeta,
  BehaviorTreeSavePayload,
  BehaviorTreeSerializedNode,
  BehaviorTreeValueType,
} from "@/types";
import { resolveBehaviorTreeBlackboardSource } from "./behaviorTreeBlackboard.ts";
import { createDefaultBehaviorTreeConfig } from "./behaviorTreeModel.ts";
import { isBehaviorTreeValueLessOp } from "./behaviorTreeConstants.ts";
import { behaviorTreeEmptyToNull, behaviorTreeIntOrNull, behaviorTreeValueToText, parseBehaviorTreeTypedValue } from "./behaviorTreeTypedValue.ts";

/**
 * @description 将草稿配置转为序列化 config。
 * @param node 节点草稿。
 * @param blackboardTypeOf 查黑板类型。
 * @returns 序列化 config。
 */
export function buildBehaviorTreeNodeConfig(
  node: BehaviorTreeNodeDraft,
  blackboardTypeOf: (key: string) => BehaviorTreeValueType | null,
): Record<string, unknown> | null {
  const draft = node.config || {};
  switch (node.kind) {
    case "SELECTOR":
    case "SEQUENCE":
      return { runMode: draft.runMode || "STANDARD" };
    case "PARALLEL":
      return { policy: draft.policy || "ALL_SUCCESS", maxConcurrency: behaviorTreeIntOrNull(draft.maxConcurrency) };
    case "REPEATER":
      return { loopMode: draft.loopMode || "FIXED_TIMES", times: behaviorTreeIntOrNull(draft.times) };
    case "UNTIL_SUCCESS":
    case "UNTIL_FAILURE":
      return { maxTimes: behaviorTreeIntOrNull(draft.maxTimes), finishState: draft.finishState || "FAILURE" };
    case "COOLDOWN":
      return {
        intervalSeconds: behaviorTreeIntOrNull(draft.intervalSeconds),
        entityPrimaryKeyKey: behaviorTreeEmptyToNull(draft.entityPrimaryKeyKey),
        hitResult: draft.hitResult || "FAILURE",
      };
    case "TIME_LIMIT":
      return { limitSeconds: behaviorTreeIntOrNull(draft.limitSeconds), timeoutState: draft.timeoutState || "FAILURE" };
    case "BLACKBOARD_CONDITION": {
      const config: Record<string, unknown> = { key: (draft.key || "").trim(), op: draft.op || "EQ" };
      if (!isBehaviorTreeValueLessOp(String(config.op))) {
        const declared = blackboardTypeOf(String(config.key));
        const parsed = parseBehaviorTreeTypedValue(draft.value, declared || "STRING");
        config.value = parsed.ok ? parsed.value : draft.value;
      }
      return config;
    }
    case "CONDITION":
      return { expression: (draft.expression || "").trim() };
    case "ACTION":
      return {
        actionApi: (draft.actionApi || "").trim(),
        timeoutSeconds: behaviorTreeIntOrNull(draft.timeoutSeconds),
        retryTimes: behaviorTreeIntOrNull(draft.retryTimes),
      };
    default:
      return null;
  }
}

/**
 * @description 将后端 config 转为表单草稿。
 * @param kind 节点 kind。
 * @param config 后端 config。
 * @returns 草稿。
 */
export function behaviorTreeConfigToDraft(kind: BehaviorTreeNodeKind, config: Record<string, unknown> | null | undefined): BehaviorTreeNodeConfigDraft | null {
  const cfg = config || {};
  const asText = (value: unknown): string => (value == null ? "" : String(value));
  switch (kind) {
    case "SELECTOR":
    case "SEQUENCE":
      return { runMode: asText(cfg.runMode) || "STANDARD" };
    case "PARALLEL":
      return { policy: asText(cfg.policy) || "ALL_SUCCESS", maxConcurrency: asText(cfg.maxConcurrency) };
    case "REPEATER":
      return { loopMode: asText(cfg.loopMode) || "FIXED_TIMES", times: asText(cfg.times) };
    case "UNTIL_SUCCESS":
    case "UNTIL_FAILURE":
      return { maxTimes: asText(cfg.maxTimes), finishState: asText(cfg.finishState) || "FAILURE" };
    case "COOLDOWN":
      return {
        intervalSeconds: asText(cfg.intervalSeconds),
        entityPrimaryKeyKey: asText(cfg.entityPrimaryKeyKey),
        hitResult: asText(cfg.hitResult) || "FAILURE",
      };
    case "TIME_LIMIT":
      return { limitSeconds: asText(cfg.limitSeconds), timeoutState: asText(cfg.timeoutState) || "FAILURE" };
    case "BLACKBOARD_CONDITION":
      return { key: asText(cfg.key), op: asText(cfg.op) || "EQ", value: behaviorTreeValueToText(cfg.value) };
    case "CONDITION":
      return { expression: asText(cfg.expression) };
    case "ACTION":
      return {
        actionApi: asText(cfg.actionApi),
        timeoutSeconds: asText(cfg.timeoutSeconds),
        retryTimes: asText(cfg.retryTimes),
      };
    default:
      return createDefaultBehaviorTreeConfig(kind);
  }
}

/**
 * @description 序列化单节点。
 * @param node 草稿节点。
 * @param kindMeta kind 元信息。
 * @param blackboardTypeOf 黑板类型查询。
 * @returns 序列化节点。
 */
export function serializeBehaviorTreeNode(
  node: BehaviorTreeNodeDraft,
  kindMeta: Record<BehaviorTreeNodeKind, BehaviorTreeKindMeta>,
  blackboardTypeOf: (key: string) => BehaviorTreeValueType | null,
): BehaviorTreeSerializedNode {
  const out: BehaviorTreeSerializedNode = {
    id: node.id,
    kind: node.kind,
    displayName: node.displayName || kindMeta[node.kind].name,
    enabled: node.enabled !== false,
    config: buildBehaviorTreeNodeConfig(node, blackboardTypeOf),
    children: node.children.map((child) => serializeBehaviorTreeNode(child, kindMeta, blackboardTypeOf)),
  };
  if (node.skipIf.trim()) out.skipIf = node.skipIf.trim();
  if (node.whileCondition.trim()) out.whileCondition = node.whileCondition.trim();
  return out;
}

/**
 * @description 由模型构建 treeDefinition。
 * @param model 编辑模型。
 * @param kindMeta kind 元信息。
 * @returns 树定义。
 */
export function buildBehaviorTreeDefinition(model: BehaviorTreeModel, kindMeta: Record<BehaviorTreeNodeKind, BehaviorTreeKindMeta>): BehaviorTreeDefinition {
  const blackboardTypeOf = (key: string): BehaviorTreeValueType | null => {
    const found = model.blackboard.find((item) => item.key.trim() === key);
    return found ? found.valueType : null;
  };
  return {
    blackboard: model.blackboard.map((item) => {
      const source = resolveBehaviorTreeBlackboardSource(item);
      const serialized: BehaviorTreeDefinition["blackboard"][number] = {
        key: item.key.trim(),
        valueType: item.valueType,
        source,
      };
      if (source === "FIXED") {
        const parsed = parseBehaviorTreeTypedValue(item.fixedValueText, item.valueType);
        serialized.value = parsed.ok ? parsed.value : null;
      }
      if (source === "PROPERTY") {
        serialized.bindPropertyUniqueIdentifier = behaviorTreeEmptyToNull(item.bindPropertyUniqueIdentifier);
      }
      const description = behaviorTreeEmptyToNull(item.description);
      if (description) serialized.description = description;
      return serialized;
    }),
    // 默认值只属于外部输入：固定值写在 blackboard.value，对象属性执行时按实例回读
    variables: model.blackboard
      .filter((item) => resolveBehaviorTreeBlackboardSource(item) === "EXTERNAL" && String(item.defaultValueText ?? "").trim() !== "")
      .map((item) => {
        const parsed = parseBehaviorTreeTypedValue(item.defaultValueText, item.valueType);
        return {
          name: item.key.trim(),
          valueType: item.valueType,
          scope: "RUNTIME" as const,
          defaultValue: parsed.ok ? parsed.value : null,
        };
      }),
    roots: model.roots.map((root) => serializeBehaviorTreeNode(root, kindMeta, blackboardTypeOf)),
  };
}

/**
 * @description 构建 TREE 保存请求体预览。
 * @param model 模型。
 * @param kindMeta kind 元信息。
 * @param meta 编排元数据。
 * @returns 请求体。
 */
export function buildBehaviorTreeSavePayload(
  model: BehaviorTreeModel,
  kindMeta: Record<BehaviorTreeNodeKind, BehaviorTreeKindMeta>,
  meta: BehaviorTreeOrchestrationMeta,
): BehaviorTreeSavePayload {
  return {
    ontologySpaceId: Number(meta.spaceId),
    actionApi: meta.actionApi.trim(),
    displayName: meta.displayName.trim(),
    description: behaviorTreeEmptyToNull(meta.description),
    categoryId: meta.categoryId.trim() ? Number(meta.categoryId) : null,
    actionKind: "TREE",
    treeDefinition: buildBehaviorTreeDefinition(model, kindMeta),
  };
}

/**
 * @description 导入序列化节点为草稿。
 * @param raw 序列化节点。
 * @returns 草稿节点。
 */
export function importBehaviorTreeSerializedNode(raw: BehaviorTreeSerializedNode): BehaviorTreeNodeDraft {
  const kind = raw.kind;
  return {
    id: raw.id,
    kind,
    displayName: raw.displayName || kind,
    enabled: raw.enabled !== false,
    skipIf: raw.skipIf || "",
    whileCondition: raw.whileCondition || "",
    config: behaviorTreeConfigToDraft(kind, (raw.config as Record<string, unknown> | null) ?? null),
    children: (raw.children || []).map((child) => importBehaviorTreeSerializedNode(child)),
    _x: 0,
    _y: 0,
  };
}

/**
 * @description 导入 treeDefinition 到模型。
 * @param definition 树定义。
 * @returns 编辑模型。
 */
export function importBehaviorTreeDefinition(definition: BehaviorTreeDefinition): BehaviorTreeModel {
  const variables = Array.isArray(definition.variables) ? definition.variables : [];
  return {
    blackboard: (definition.blackboard || []).map((item) => {
      const source = resolveBehaviorTreeBlackboardSource({
        source: item.source,
        bindPropertyUniqueIdentifier: item.bindPropertyUniqueIdentifier || "",
      });
      const variable = variables.find((entry) => entry.name === item.key);
      return {
        key: item.key || "",
        valueType: item.valueType || "STRING",
        source,
        bindPropertyUniqueIdentifier: item.bindPropertyUniqueIdentifier || "",
        fixedValueText: source === "FIXED" ? behaviorTreeValueToText(item.value) : "",
        defaultValueText: source === "EXTERNAL" && variable ? behaviorTreeValueToText(variable.defaultValue) : "",
        description: item.description || "",
      };
    }),
    roots: (definition.roots || []).map((root) => importBehaviorTreeSerializedNode(root)),
  };
}
