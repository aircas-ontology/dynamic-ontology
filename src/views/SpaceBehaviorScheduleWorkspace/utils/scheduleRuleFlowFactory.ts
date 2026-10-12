import type {
  RuleCompareOperator,
  RuleCompositeCondition,
  RuleConditionNode,
  RuleExprOperator,
  RuleFlowActionsStep,
  RuleFlowBranchStep,
  RuleFlowStep,
  RuleFlowSwitchCase,
  RuleFlowSwitchStep,
  RuleFlowThenAction,
  RuleFunctionName,
  RuleLeafCondition,
  RuleLiteralValue,
  RuleValueNode,
  ScheduleRuleFlowDocument,
} from "@/types";

const RULE_COMPARE_OPERATOR_LABELS: Record<RuleCompareOperator, string> = {
  eq: "等于",
  neq: "不等于",
  gt: "大于",
  lt: "小于",
  gte: "大于或等于",
  lte: "小于或等于",
  contains: "包含",
  notContains: "不包含",
  prefixContains: "前置包含",
};

const RULE_FUNCTION_LABELS: Record<RuleFunctionName, string> = {
  max: "求最大值",
  min: "求最小值",
  avg: "求平均值",
  dateYmd: "取年月日",
  dateMd: "取月日",
  dateHm: "取时分",
  formatDate: "格式化日期",
};

const RULE_EXPR_OPERATOR_LABELS: Record<RuleExprOperator, string> = {
  add: "+",
  sub: "-",
  mul: "*",
  div: "/",
  gt: ">",
  lt: "<",
  gte: ">=",
  lte: "<=",
  neq: "≠",
  and: "&&",
  assign: "赋值:",
};

let ruleNodeSeq = 0;

/**
 * @description 生成规则流节点标识，避免画布节点互相覆盖。
 * @param prefix 标识前缀。
 * @returns 节点标识。
 */
export function createRuleNodeId(prefix: string): string {
  ruleNodeSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${ruleNodeSeq.toString(36)}`;
}

/**
 * @description 创建空白字面量。
 * @returns 空输入值。
 */
export function createEmptyLiteral(): RuleLiteralValue {
  return { kind: "input", text: "" };
}

/**
 * @description 创建空白叶子条件。
 * @returns 左右均为空值、运算符为等于的叶子。
 */
export function createEmptyLeafCondition(): RuleLeafCondition {
  return {
    id: createRuleNodeId("leaf"),
    type: "leaf",
    left: createEmptyLiteral(),
    operator: "eq",
    right: createEmptyLiteral(),
  };
}

/**
 * @description 创建空白组合条件。
 * @param withChild 是否放入一条空白叶子。
 * @returns 组合条件。
 */
export function createEmptyCompositeCondition(withChild = true): RuleCompositeCondition {
  return {
    id: createRuleNodeId("comp"),
    type: "composite",
    logic: "and",
    children: withChild ? [createEmptyLeafCondition()] : [],
  };
}

/**
 * @description 创建未配置的执行行为。
 * @returns 空白执行行为。
 */
export function createEmptyThenAction(): RuleFlowThenAction {
  return {
    id: createRuleNodeId("then"),
    behaviorId: "",
    behaviorName: "",
    relatedObject: "",
    instanceIds: [],
    params: [],
  };
}

/**
 * @description 创建顺序执行行为步骤。
 * @param actions 行为列表；缺省时放入一条空白行为。
 * @returns 动作步骤。
 */
export function createActionsStep(actions?: RuleFlowThenAction[]): RuleFlowActionsStep {
  return {
    kind: "actions",
    id: createRuleNodeId("step"),
    actions: actions && actions.length ? actions : [createEmptyThenAction()],
  };
}

/**
 * @description 创建条件分支步骤，默认 then 为一条未配置行为。
 * @param condition 分支条件。
 * @param thenSteps 成立路径。
 * @param otherwise 不成立路径。
 * @returns 条件分支步骤。
 */
export function createBranchStep(condition?: RuleCompositeCondition, thenSteps?: RuleFlowStep[], otherwise: RuleFlowStep[] | null = null): RuleFlowBranchStep {
  return {
    kind: "branch",
    id: createRuleNodeId("branch"),
    condition: condition ?? createEmptyCompositeCondition(true),
    then: thenSteps ?? [createActionsStep()],
    otherwise,
  };
}

/**
 * @description 创建 Switch 的单个 case。
 * @param label 端口标签。
 * @returns Switch case。
 */
export function createDefaultSwitchCase(label = "case"): RuleFlowSwitchCase {
  return {
    id: createRuleNodeId("case"),
    label,
    value: createEmptyLiteral(),
    steps: [createActionsStep()],
  };
}

/**
 * @description 创建带两个 case 和默认路径的 Switch 步骤。
 * @param switchOn 被分发的值。
 * @param cases case 列表。
 * @param defaultSteps 默认路径。
 * @returns Switch 步骤。
 */
export function createSwitchStep(
  switchOn?: RuleValueNode,
  cases?: RuleFlowSwitchCase[],
  defaultSteps: RuleFlowStep[] | null = [createActionsStep()],
): RuleFlowSwitchStep {
  return {
    kind: "switch",
    id: createRuleNodeId("switch"),
    switchOn: switchOn ?? createEmptyLiteral(),
    cases: cases && cases.length ? cases : [createDefaultSwitchCase("case 1"), createDefaultSwitchCase("case 2")],
    defaultSteps,
  };
}

/**
 * @description 创建默认规则流：规则开始后接一条空条件分支。
 * @returns 默认规则流文档。
 */
export function createDefaultScheduleRuleFlow(): ScheduleRuleFlowDocument {
  return { steps: [createBranchStep()] };
}

/**
 * @description 深拷贝规则流文档，避免弹窗与草稿共用引用。
 * @param doc 规则流文档。
 * @returns 文档副本。
 */
export function cloneScheduleRuleFlow(doc: ScheduleRuleFlowDocument): ScheduleRuleFlowDocument {
  return structuredClone(doc);
}

/**
 * @description 深拷贝任意可结构化克隆的值。
 * @param value 原始值。
 * @returns 副本。
 */
export function cloneRuleFlowValue<Value>(value: Value): Value {
  return structuredClone(value);
}

/**
 * @description 截断画布节点展示文案。
 * @param value 原始文案。
 * @param maxLength 最大长度。
 * @returns 截断后的文案。
 */
export function truncateRuleFlowText(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

/**
 * @description 把规则值摘要成画布可读文案。
 * @param value 规则值。
 * @returns 摘要文案。
 */
export function summarizeValue(value: RuleValueNode): string {
  if (value.kind === "input") return value.text.trim() || "空值";
  if (value.kind === "variable") {
    if (!value.objectName || !value.propertyName) return "未选变量";
    return `${value.objectName}.${value.propertyName}`;
  }
  if (value.kind === "function") {
    return `${RULE_FUNCTION_LABELS[value.fn]}(${summarizeValue(value.arg)})`;
  }
  const parts = value.terms.map((term) => {
    if (term.type === "value") return summarizeValue(term.value);
    if (term.type === "operator") return RULE_EXPR_OPERATOR_LABELS[term.op];
    return "(...)";
  });
  return parts.join(" ") || "空表达式";
}

/**
 * @description 把条件树摘要成画布可读文案。
 * @param node 条件节点。
 * @returns 摘要文案。
 */
export function summarizeRuleCondition(node: RuleConditionNode): string {
  if (node.type === "leaf") {
    return `${summarizeValue(node.left)} ${RULE_COMPARE_OPERATOR_LABELS[node.operator]} ${summarizeValue(node.right)}`;
  }
  const joiner = node.logic === "and" ? " 且 " : " 或 ";
  const parts = node.children.map(summarizeRuleCondition).filter((item) => item.trim().length > 0);
  const first = parts[0];
  if (!first) return "";
  return parts.length === 1 ? first : parts.join(joiner);
}

/**
 * @description 把执行行为摘要成画布副标题。
 * @param action 执行行为。
 * @returns 摘要文案。
 */
export function summarizeThenAction(action: RuleFlowThenAction): string {
  if (!action.params.length) return "行为无参数";
  return truncateRuleFlowText(action.params.map((param) => `${param.paramName}=${summarizeValue(param.value)}`).join("，"), 26);
}
