import type { ActionTreeBindableAction } from "../apis/getActionTreeNodeDefsType";

/** 行为树节点类别。 */
export type BehaviorTreeNodeCategory = "COMPOSITE" | "DECORATOR" | "LEAF";

/** 行为树节点 kind。 */
export type BehaviorTreeNodeKind =
  | "SELECTOR"
  | "SEQUENCE"
  | "PARALLEL"
  | "INVERTER"
  | "REPEATER"
  | "UNTIL_SUCCESS"
  | "UNTIL_FAILURE"
  | "COOLDOWN"
  | "TIME_LIMIT"
  | "FORCE_SUCCESS"
  | "BLACKBOARD_CONDITION"
  | "CONDITION"
  | "ACTION";

/** 黑板值类型。 */
export type BehaviorTreeValueType = "STRING" | "INTEGER" | "LONG" | "FLOAT" | "DOUBLE" | "BOOL" | "BYTE" | "SHORT" | "CHAR" | "LIST" | "DATE" | "OBJECT";

/** 节点 kind 元信息。 */
export interface BehaviorTreeKindMeta {
  kind: BehaviorTreeNodeKind;
  name: string;
  category: BehaviorTreeNodeCategory;
  maxChildren: number;
}

/** 黑板键草稿。 */
export interface BehaviorTreeBlackboardItem {
  key: string;
  valueType: BehaviorTreeValueType;
  bindPropertyUniqueIdentifier: string;
  defaultValueText: string;
  description: string;
}

/** 节点配置草稿（表单字符串态）。 */
export type BehaviorTreeNodeConfigDraft = Record<string, string>;

/** 行为树节点草稿。 */
export interface BehaviorTreeNodeDraft {
  id: string;
  kind: BehaviorTreeNodeKind;
  displayName: string;
  enabled: boolean;
  skipIf: string;
  whileCondition: string;
  config: BehaviorTreeNodeConfigDraft | null;
  children: BehaviorTreeNodeDraft[];
  _x: number;
  _y: number;
  _w?: number;
}

/** 行为树编辑模型。 */
export interface BehaviorTreeModel {
  blackboard: BehaviorTreeBlackboardItem[];
  roots: BehaviorTreeNodeDraft[];
}

/** 打开编排弹框时的元数据（来自创建/编辑表单）。 */
export interface BehaviorTreeOrchestrationMeta {
  spaceId: string;
  categoryId: string;
  actionApi: string;
  displayName: string;
  description: string;
  /** 编辑已有树或本会话已创建成功时为 true。 */
  isEditMode?: boolean;
}

/** 编排工作区加载状态。 */
export type BehaviorTreeOrchestrationLoadStatus = "idle" | "loading" | "ready" | "error";

/** 行为树保存命令状态。 */
export type BehaviorTreeSaveStatus = "idle" | "submitting" | "success" | "error";

/** 行为树持久化事件。 */
export type BehaviorTreePersistMode = "created" | "updated";

/** 右侧 Inspector Tab。 */
export type BehaviorTreeInspectorTab = "node" | "board" | "json";

/** 调色板拖拽载荷。 */
export interface BehaviorTreeDragPayload {
  kind: BehaviorTreeNodeKind;
  actionApi?: string;
}

/** 节点目录同步结果。 */
export interface BehaviorTreeNodeDefsSnapshot {
  availableActions: ActionTreeBindableAction[];
  kindPatches: Array<{ kind: string; name?: string; category?: string; maxChildren?: number }>;
}

/** 序列化后的树定义（提交用）。 */
export interface BehaviorTreeDefinition {
  blackboard: Array<{
    key: string;
    valueType: BehaviorTreeValueType;
    bindPropertyUniqueIdentifier: string | null;
    description: string | null;
  }>;
  variables: Array<{
    name: string;
    valueType: BehaviorTreeValueType;
    scope: "RUNTIME";
    defaultValue: unknown;
  }>;
  roots: BehaviorTreeSerializedNode[];
}

/** 序列化节点。 */
export interface BehaviorTreeSerializedNode {
  id: string;
  kind: BehaviorTreeNodeKind;
  displayName: string;
  enabled: boolean;
  config: Record<string, unknown> | null;
  children: BehaviorTreeSerializedNode[];
  skipIf?: string;
  whileCondition?: string;
}

/** TREE 行为保存请求体（二期使用；一期用于 JSON 预览）。 */
export interface BehaviorTreeSavePayload {
  ontologySpaceId: number;
  actionApi: string;
  displayName: string;
  description: string | null;
  categoryId: number | null;
  actionKind: "TREE";
  treeDefinition: BehaviorTreeDefinition;
}
