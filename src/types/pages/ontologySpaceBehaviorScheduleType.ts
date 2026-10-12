/** 行为调度策略。 */
export type BehaviorScheduleStrategy = "规则调度" | "周期调度";

/** 周期调度的执行周期。 */
export type BehaviorSchedulePeriodKind = "每天" | "每周" | "每月" | "Cron";

/** 每周执行日。 */
export type BehaviorScheduleWeekday = "周一" | "周二" | "周三" | "周四" | "周五" | "周六" | "周日";

/** 新建调度命令状态。 */
export type BehaviorScheduleCommandStatus = "idle" | "submitting" | "success" | "error";

/** 调度表单模式。 */
export type BehaviorScheduleFormMode = "create" | "edit" | "view";

/** 调度调用日志状态。 */
export type BehaviorScheduleInvocationStatus = "成功" | "失败" | "执行中";

/** 周期选项。 */
export const BEHAVIOR_SCHEDULE_PERIOD_KINDS = ["每天", "每周", "每月", "Cron"] as const;

/** 每周执行日选项。 */
export const BEHAVIOR_SCHEDULE_WEEKDAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"] as const;

/** 调用日志状态选项。 */
export const BEHAVIOR_SCHEDULE_INVOCATION_STATUSES = ["成功", "失败", "执行中"] as const;

/** 每月执行日期 1–31。 */
export const BEHAVIOR_SCHEDULE_MONTH_DAYS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
] as const;

/** 周期调度默认执行时间。 */
export const DEFAULT_BEHAVIOR_SCHEDULE_EXECUTE_TIME = "08:00:00";

/** 新建调度表单草稿。 */
export interface BehaviorScheduleDraft {
  /** 调度名称。 */
  name: string;
  /** 调度策略。 */
  strategy: BehaviorScheduleStrategy;
  /** 执行周期。 */
  periodKind: BehaviorSchedulePeriodKind;
  /** 每周执行日。 */
  weekdays: BehaviorScheduleWeekday[];
  /** 每月执行日期。 */
  monthDay: number | null;
  /** 每天 / 每周 / 每月的执行时间。 */
  executeTime: string;
  /** Cron 表达式。 */
  cronExpression: string;
  /** 关联对象。 */
  target: string;
  /** 关联实例。 */
  instance: string;
  /** 关联行为。 */
  behavior: string;
  /** 调度描述。 */
  description: string;
  /** 规则调度画布文档；未配置时为空。 */
  ruleFlow: ScheduleRuleFlowDocument | null;
}

/** 行为调度列表记录，含查看弹窗所需的表单字段。 */
export type BehaviorScheduleRecord = BehaviorScheduleDraft & {
  /** 调度标识。 */
  id: string;
  /** 创建时间展示文案。 */
  createdAt: string;
};

/** 调度调用日志记录。 */
export interface BehaviorScheduleInvocationLog {
  /** 日志标识。 */
  id: string;
  /** 调用名称。 */
  name: string;
  /** 调用时间展示文案。 */
  invokedAt: string;
  /** 调用状态。 */
  status: BehaviorScheduleInvocationStatus;
}

/** 条件逻辑运算符。 */
export type RuleLogicOperator = "and" | "or";

/** 条件比较运算符。 */
export type RuleCompareOperator = "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains" | "notContains" | "prefixContains";

/** 表达式运算符。 */
export type RuleExprOperator = "add" | "sub" | "mul" | "div" | "gt" | "lt" | "gte" | "lte" | "neq" | "and" | "assign";

/** 规则函数名。 */
export type RuleFunctionName = "max" | "min" | "avg" | "dateYmd" | "dateMd" | "dateHm" | "formatDate";

/** 规则函数参数形态。 */
export type RuleFunctionArgKind = "collection" | "object";

/** 规则值节点形态。 */
export type RuleValueKind = "input" | "variable" | "function" | "expression";

/** 变量对象形态。 */
export type RuleVariableObjectKind = "object" | "collection";

/** 行为参数值类型。 */
export type RuleFlowParamValueType = "string" | "number" | "boolean" | "object" | "collection";

/** 字面量输入值。 */
export interface RuleLiteralValue {
  /** 值形态。 */
  kind: "input";
  /** 输入文本。 */
  text: string;
}

/** 变量引用值。 */
export interface RuleVariableValue {
  /** 值形态。 */
  kind: "variable";
  /** 对象标识。 */
  objectId: string;
  /** 对象显示名。 */
  objectName: string;
  /** 对象形态。 */
  objectKind: RuleVariableObjectKind;
  /** 属性标识。 */
  propertyId: string;
  /** 属性显示名。 */
  propertyName: string;
  /** 所选实例；空数组表示全部实例。 */
  instanceIds: string[];
}

/** 函数值。 */
export interface RuleFunctionValue {
  /** 值形态。 */
  kind: "function";
  /** 函数名。 */
  fn: RuleFunctionName;
  /** 参数形态。 */
  argKind: RuleFunctionArgKind;
  /** 函数参数。 */
  arg: RuleValueNode;
}

/** 表达式项。 */
export type RuleExprTerm =
  | { id: string; type: "value"; value: RuleValueNode }
  | { id: string; type: "operator"; op: RuleExprOperator }
  | { id: string; type: "group"; terms: RuleExprTerm[] };

/** 表达式值。 */
export interface RuleExpressionValue {
  /** 值形态。 */
  kind: "expression";
  /** 表达式项。 */
  terms: RuleExprTerm[];
}

/** 规则值节点。 */
export type RuleValueNode = RuleLiteralValue | RuleVariableValue | RuleFunctionValue | RuleExpressionValue;

/** 叶子条件。 */
export interface RuleLeafCondition {
  /** 条件标识。 */
  id: string;
  /** 条件形态。 */
  type: "leaf";
  /** 左侧值。 */
  left: RuleValueNode;
  /** 比较运算符。 */
  operator: RuleCompareOperator;
  /** 右侧值。 */
  right: RuleValueNode;
}

/** 组合条件。 */
export interface RuleCompositeCondition {
  /** 条件标识。 */
  id: string;
  /** 条件形态。 */
  type: "composite";
  /** 逻辑运算符。 */
  logic: RuleLogicOperator;
  /** 子条件。 */
  children: RuleConditionNode[];
}

/** 条件节点。 */
export type RuleConditionNode = RuleLeafCondition | RuleCompositeCondition;

/** 执行行为参数值。 */
export interface RuleFlowThenParamValue {
  /** 参数标识。 */
  paramId: string;
  /** 参数名。 */
  paramName: string;
  /** 参数值类型。 */
  valueType: RuleFlowParamValueType;
  /** 参数值。 */
  value: RuleValueNode;
}

/** 执行行为。 */
export interface RuleFlowThenAction {
  /** 行为节点标识。 */
  id: string;
  /** 行为标识。 */
  behaviorId: string;
  /** 行为显示名。 */
  behaviorName: string;
  /** 关联对象显示名。 */
  relatedObject: string;
  /** 所选实例；空数组表示全部实例。 */
  instanceIds: string[];
  /** 行为参数。 */
  params: RuleFlowThenParamValue[];
}

/** 顺序执行行为步骤。 */
export interface RuleFlowActionsStep {
  /** 步骤形态。 */
  kind: "actions";
  /** 步骤标识。 */
  id: string;
  /** 顺序行为。 */
  actions: RuleFlowThenAction[];
}

/** 条件分支步骤。 */
export interface RuleFlowBranchStep {
  /** 步骤形态。 */
  kind: "branch";
  /** 步骤标识。 */
  id: string;
  /** 分支条件。 */
  condition: RuleCompositeCondition;
  /** 条件成立路径。 */
  then: RuleFlowStep[];
  /** 条件不成立路径；空表示无否则。 */
  otherwise: RuleFlowStep[] | null;
}

/** Switch 单个 case。 */
export interface RuleFlowSwitchCase {
  /** case 标识。 */
  id: string;
  /** 画布端口标签。 */
  label: string;
  /** 匹配值。 */
  value: RuleValueNode;
  /** case 路径步骤。 */
  steps: RuleFlowStep[];
}

/** Switch 多路分支步骤。 */
export interface RuleFlowSwitchStep {
  /** 步骤形态。 */
  kind: "switch";
  /** 步骤标识。 */
  id: string;
  /** 被分发的表达式。 */
  switchOn: RuleValueNode;
  /** case 列表。 */
  cases: RuleFlowSwitchCase[];
  /** 默认路径；空表示无默认分支。 */
  defaultSteps: RuleFlowStep[] | null;
}

/** 规则流步骤。 */
export type RuleFlowStep = RuleFlowActionsStep | RuleFlowBranchStep | RuleFlowSwitchStep;

/** 规则配置画布文档。 */
export interface ScheduleRuleFlowDocument {
  /** 从规则开始依次执行的步骤。 */
  steps: RuleFlowStep[];
}

/** 变量目录来源。 */
export type RuleVariableCatalogCategory = "ontology" | "custom";

/** 自定义变量键的值类型。 */
export type RuleVariablePropertyValueType = "string" | "number" | "boolean" | "object";

/** 自定义变量的键。 */
export interface RuleVariablePropertyOption {
  /** 键标识。 */
  id: string;
  /** 键名称。 */
  name: string;
  /** 值类型。 */
  valueType: RuleVariablePropertyValueType;
  /** 对象类型的子键。 */
  children?: RuleVariablePropertyOption[];
}

/** 自定义变量对象。 */
export interface RuleVariableCatalogObject {
  /** 变量标识。 */
  id: string;
  /** 变量名称。 */
  name: string;
  /** 对象形态。 */
  kind: RuleVariableObjectKind;
  /** 来源分类。 */
  category: RuleVariableCatalogCategory;
  /** 键列表。 */
  properties: RuleVariablePropertyOption[];
}

/** AI 对话角色。 */
export type ScheduleRuleAiMessageRole = "user" | "assistant";

/** AI 对话状态。 */
export type ScheduleRuleAiMessageStatus = "sending" | "success" | "error";

/** AI 生成规则对话消息。 */
export interface ScheduleRuleAiMessage {
  /** 消息标识。 */
  id: string;
  /** 发送角色。 */
  role: ScheduleRuleAiMessageRole;
  /** 展示文案。 */
  content: string;
  /** 创建时间。 */
  createdAt: string;
  /** 发送状态。 */
  status: ScheduleRuleAiMessageStatus;
  /** 可应用的规则文本。 */
  dsl?: string;
}

/** 自定义变量值类型选项。 */
export const RULE_VARIABLE_PROPERTY_VALUE_TYPE_OPTIONS = [
  { value: "string", label: "字符串" },
  { value: "number", label: "数值" },
  { value: "boolean", label: "布尔" },
  { value: "object", label: "对象" },
] as const;

/** AI 预设提示。 */
export const SCHEDULE_RULE_AI_PRESET_PROMPTS = [
  "如果驱逐舰的威胁等级大于3，执行威胁响应行为",
  "如果OSSAP相对距离小于10，执行高轨监视计划",
  "如果USA-325单区独立变化大于阈值，执行行动事件分析",
] as const;

/** AI 输入字数上限。 */
export const SCHEDULE_RULE_AI_PROMPT_MAX_LENGTH = 500;

/** AI 附件允许的扩展名。 */
export const SCHEDULE_RULE_AI_ATTACHMENT_ACCEPT = ".txt,.md,.markdown,.json,.csv,.log";

/** AI 附件大小上限（字节）。 */
export const SCHEDULE_RULE_AI_ATTACHMENT_MAX_BYTES = 200 * 1024;
