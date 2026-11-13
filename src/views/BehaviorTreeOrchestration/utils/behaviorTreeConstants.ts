import type { BehaviorTreeKindMeta, BehaviorTreeNodeKind, BehaviorTreeValueType } from "@/types";

/** 与后端 BehaviorNodeKindEnum 对齐的本地节点元信息。 */
export const BEHAVIOR_TREE_LOCAL_KINDS: readonly BehaviorTreeKindMeta[] = [
  { kind: "SELECTOR", name: "选择节点", category: "COMPOSITE", maxChildren: -1 },
  { kind: "SEQUENCE", name: "顺序节点", category: "COMPOSITE", maxChildren: -1 },
  { kind: "PARALLEL", name: "并行节点", category: "COMPOSITE", maxChildren: -1 },
  { kind: "INVERTER", name: "取反节点", category: "DECORATOR", maxChildren: 1 },
  { kind: "REPEATER", name: "重复节点", category: "DECORATOR", maxChildren: 1 },
  { kind: "UNTIL_SUCCESS", name: "直到成功", category: "DECORATOR", maxChildren: 1 },
  { kind: "UNTIL_FAILURE", name: "直到失败", category: "DECORATOR", maxChildren: 1 },
  { kind: "COOLDOWN", name: "冷却节点", category: "DECORATOR", maxChildren: 1 },
  { kind: "TIME_LIMIT", name: "限时节点", category: "DECORATOR", maxChildren: 1 },
  { kind: "FORCE_SUCCESS", name: "强制成功", category: "DECORATOR", maxChildren: 1 },
  { kind: "BLACKBOARD_CONDITION", name: "黑板条件", category: "LEAF", maxChildren: 0 },
  { kind: "CONDITION", name: "表达式条件", category: "LEAF", maxChildren: 0 },
  { kind: "ACTION", name: "行为节点", category: "LEAF", maxChildren: 0 },
];

/** 节点类别中文标签。 */
export const BEHAVIOR_TREE_CATEGORY_LABELS: Record<string, string> = {
  COMPOSITE: "容器",
  DECORATOR: "装饰器",
  LEAF: "叶子",
};

/** 黑板值类型列表。 */
export const BEHAVIOR_TREE_VALUE_TYPES: readonly BehaviorTreeValueType[] = [
  "STRING",
  "INTEGER",
  "LONG",
  "FLOAT",
  "DOUBLE",
  "BOOL",
  "BYTE",
  "SHORT",
  "CHAR",
  "LIST",
  "DATE",
  "OBJECT",
];

/** 数值比较支持的类型。 */
export const BEHAVIOR_TREE_NUMBER_TYPES: readonly BehaviorTreeValueType[] = ["INTEGER", "LONG", "FLOAT", "DOUBLE"];

/** 黑板取值来源选项。 */
export const BEHAVIOR_TREE_BLACKBOARD_SOURCE_OPTIONS = [
  { value: "FIXED", label: "固定值" },
  { value: "EXTERNAL", label: "外部输入" },
  { value: "PROPERTY", label: "对象属性" },
] as const;

/** 黑板来源中文标签。 */
export const BEHAVIOR_TREE_BLACKBOARD_SOURCE_LABELS: Record<string, string> = {
  FIXED: "固定值",
  EXTERNAL: "外部输入",
  PROPERTY: "对象属性",
};

/**
 * 对象属性 propertyType → 黑板 valueType（与后端 toBlackboardValueType 对齐）。
 */
export const BEHAVIOR_TREE_PROPERTY_TYPE_TO_VALUE_TYPE: Record<string, BehaviorTreeValueType> = {
  Bool: "BOOL",
  Int: "INTEGER",
  Long: "LONG",
  Float: "FLOAT",
  Short: "SHORT",
  Byte: "BYTE",
  Double: "DOUBLE",
  Decimal: "DOUBLE",
  Date: "DATE",
  Timestamp: "DATE",
  Array: "LIST",
  Map: "OBJECT",
  Ontology: "OBJECT",
  String: "STRING",
};

export const BEHAVIOR_TREE_RUN_MODE_OPTIONS = [
  { value: "STANDARD", label: "标准 STANDARD" },
  { value: "MEMORY", label: "记忆 MEMORY" },
  { value: "REACTIVE", label: "响应式 REACTIVE" },
] as const;

export const BEHAVIOR_TREE_PARALLEL_POLICY_OPTIONS = [
  { value: "ALL_SUCCESS", label: "全部成功 ALL_SUCCESS" },
  { value: "ANY_SUCCESS", label: "任一成功 ANY_SUCCESS" },
  { value: "ALL_FAILURE", label: "全部失败 ALL_FAILURE" },
  { value: "ANY_FAILURE", label: "任一失败 ANY_FAILURE" },
] as const;

export const BEHAVIOR_TREE_LOOP_MODE_OPTIONS = [
  { value: "FIXED_TIMES", label: "固定次数 FIXED_TIMES" },
  { value: "INFINITE", label: "无限循环 INFINITE" },
  { value: "UNTIL_CONDITION", label: "按条件 UNTIL_CONDITION" },
] as const;

export const BEHAVIOR_TREE_STATE_OPTIONS = [
  { value: "SUCCESS", label: "成功 SUCCESS" },
  { value: "FAILURE", label: "失败 FAILURE" },
] as const;

export const BEHAVIOR_TREE_OP_OPTIONS = [
  { value: "EQ", label: "等于 EQ" },
  { value: "NE", label: "不等于 NE" },
  { value: "GT", label: "大于 GT" },
  { value: "GE", label: "大于等于 GE" },
  { value: "LT", label: "小于 LT" },
  { value: "LE", label: "小于等于 LE" },
  { value: "CONTAINS", label: "包含 CONTAINS" },
  { value: "NOT_CONTAINS", label: "不包含 NOT_CONTAINS" },
  { value: "IS_EMPTY", label: "为空 IS_EMPTY" },
  { value: "IS_NOT_EMPTY", label: "不为空 IS_NOT_EMPTY" },
] as const;

/** 画布节点尺寸与间距。 */
export const BEHAVIOR_TREE_NODE_W = 190;
export const BEHAVIOR_TREE_NODE_H = 58;
export const BEHAVIOR_TREE_H_GAP = 56;
export const BEHAVIOR_TREE_V_GAP = 120;

/** 调色板拖拽 MIME。 */
export const BEHAVIOR_TREE_DRAG_MIME = "application/x-bt";

/**
 * @description 创建可变的 kind 元信息表。
 * @returns kind -> meta 映射。
 */
export function createBehaviorTreeKindMetaMap(): Record<BehaviorTreeNodeKind, BehaviorTreeKindMeta> {
  const map = {} as Record<BehaviorTreeNodeKind, BehaviorTreeKindMeta>;
  for (const item of BEHAVIOR_TREE_LOCAL_KINDS) {
    map[item.kind] = { ...item };
  }
  return map;
}

/**
 * @description 将 maxChildren 格式化为界面可读的子节点连接约束文案。
 * @param maxChildren 最大子节点数；小于 0（如 -1）表示不限制。
 * @returns 约束说明。
 */
export function formatBehaviorTreeMaxChildrenHint(maxChildren: number): string {
  if (maxChildren < 0) return "可连接多个子节点";
  if (maxChildren === 0) return "不可连接子节点";
  if (maxChildren === 1) return "仅可连接 1 个子节点";
  return `最多可连接 ${maxChildren} 个子节点`;
}

/**
 * @description 判断比较运算符是否不需要比较值。
 * @param op 运算符。
 * @returns 不需要比较值时为 true。
 */
export function isBehaviorTreeValueLessOp(op: string): boolean {
  return op === "IS_EMPTY" || op === "IS_NOT_EMPTY";
}
