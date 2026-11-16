import type {
  RuleCompareOperator,
  RuleCompositeCondition,
  RuleConditionNode,
  RuleFlowStep,
  RuleFlowThenAction,
  RuleValueNode,
  ScheduleRuleDetailGroup,
} from "@/types";

const comparisonOperators = new Set<RuleCompareOperator>(["eq", "neq", "gt", "gte", "lt", "lte", "contains", "notContains", "prefixContains"]);
/** @description 判断外部值是否为普通记录。 @param value 外部值。 @returns 是否为记录。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
/** @description 读取必填字符串。 @param value 外部值。 @returns 字符串。 */
function requireString(value: unknown): string {
  if (typeof value !== "string") throw new Error("画布字段格式无效");
  return value;
}
/** @description 判断支持的比较操作符。 @param value 外部值。 @returns 是否为比较操作符。 */
function isCompareOperator(value: unknown): value is RuleCompareOperator {
  return typeof value === "string" && [...comparisonOperators].some((operator) => operator === value);
}
/** @description 恢复输入值或变量并保留创建时的名称与实例。 @param value 外部值。 @returns 规则值。 */
function restoreValue(value: unknown): RuleValueNode {
  if (!isRecord(value)) throw new Error("画布变量格式无效");
  if (value.kind === "input") return { kind: "input", text: requireString(value.text) };
  if (
    value.kind === "variable" &&
    (value.objectKind === "object" || value.objectKind === "collection") &&
    Array.isArray(value.instanceIds) &&
    value.instanceIds.every((id) => typeof id === "string")
  ) {
    return {
      kind: "variable",
      objectId: requireString(value.objectId),
      objectName: requireString(value.objectName),
      objectKind: value.objectKind,
      propertyId: requireString(value.propertyId),
      propertyName: requireString(value.propertyName),
      instanceIds: value.instanceIds,
    };
  }
  throw new Error("画布值类型不支持");
}
/** @description 恢复条件树。 @param value 外部条件。 @returns 条件节点。 */
function restoreCondition(value: unknown): RuleConditionNode {
  if (!isRecord(value)) throw new Error("画布条件格式无效");
  const id = requireString(value.id);
  if (value.type === "composite" && (value.logic === "and" || value.logic === "or") && Array.isArray(value.children))
    return { id, type: "composite", logic: value.logic, children: value.children.map(restoreCondition) };
  if (value.type === "leaf" && isCompareOperator(value.operator))
    return { id, type: "leaf", left: restoreValue(value.left), right: restoreValue(value.right), operator: value.operator };
  throw new Error("画布条件格式无效");
}
/** @description 恢复行为节点以及已保存的完整执行请求。 @param value 外部行为。 @param details 参数映射。 @returns 行为节点。 */
function restoreAction(value: unknown, details: ScheduleRuleDetailGroup["actionDetails"]): RuleFlowThenAction {
  if (!isRecord(value) || !Array.isArray(value.params) || !Array.isArray(value.instanceIds) || !value.instanceIds.every((id) => typeof id === "string"))
    throw new Error("画布行为格式无效");
  const id = requireString(value.id);
  const behaviorId = requireString(value.behaviorId);
  const behaviorName = requireString(value.behaviorName);
  const relatedObject = requireString(value.relatedObject);
  if (!isRecord(value.behaviorParameters) || !isRecord(value.behaviorParameters.request) || typeof value.behaviorParameters.request.actionApi !== "string")
    throw new Error("画布行为参数缺失");
  details[id] = {
    actionApi: value.behaviorParameters.request.actionApi,
    ontologyIdentifier: relatedObject,
    entityJson: JSON.stringify(value.behaviorParameters.request),
    entityId: "",
  };
  const params: RuleFlowThenAction["params"] = value.params.map((param: unknown) => {
    if (
      !isRecord(param) ||
      (param.valueType !== "string" &&
        param.valueType !== "number" &&
        param.valueType !== "boolean" &&
        param.valueType !== "object" &&
        param.valueType !== "collection")
    )
      throw new Error("画布行为参数格式无效");
    return { paramId: requireString(param.paramId), paramName: requireString(param.paramName), valueType: param.valueType, value: restoreValue(param.value) };
  });
  return { id, behaviorId, behaviorName, relatedObject, instanceIds: value.instanceIds, params };
}
/** @description 恢复包含条件、行为和 switch 的递归步骤。 @param value 外部步骤数组。 @param details 参数映射。 @returns 步骤。 */
function restoreSteps(value: unknown, details: ScheduleRuleDetailGroup["actionDetails"]): RuleFlowStep[] {
  if (!Array.isArray(value)) throw new Error("画布步骤格式无效");
  return value.map((step: unknown): RuleFlowStep => {
    if (!isRecord(step)) throw new Error("画布步骤格式无效");
    const id = requireString(step.id);
    if (step.kind === "actions" && Array.isArray(step.actions) && step.actions.length)
      return { id, kind: "actions", actions: step.actions.map((action: unknown) => restoreAction(action, details)) };
    if (step.kind === "branch") {
      const condition: RuleConditionNode = restoreCondition(step.condition);
      if (condition.type !== "composite") throw new Error("画布根条件格式无效");
      const root: RuleCompositeCondition = condition;
      return {
        id,
        kind: "branch",
        condition: root,
        then: restoreSteps(step.then, details),
        otherwise: step.otherwise === null ? null : restoreSteps(step.otherwise, details),
      };
    }
    if (step.kind === "switch" && Array.isArray(step.cases) && step.cases.length) {
      return {
        id,
        kind: "switch",
        switchOn: restoreValue(step.switchOn),
        cases: step.cases.map((item: unknown) => {
          if (!isRecord(item)) throw new Error("画布 case 格式无效");
          return { id: requireString(item.id), label: requireString(item.label), value: restoreValue(item.value), steps: restoreSteps(item.steps, details) };
        }),
        defaultSteps: step.defaultSteps === null ? null : restoreSteps(step.defaultSteps, details),
      };
    }
    throw new Error("画布步骤类型不支持");
  });
}
/** @description 解析版本化画布文档并验证所有节点。 @param value 画布 JSON。 @returns 只读画布或错误。 */
export function restoreRuleFlowDocument(value: unknown): { ok: true; group: ScheduleRuleDetailGroup } | { ok: false; error: string } {
  try {
    if (typeof value !== "string" || !value.trim()) throw new Error("画布结构为空");
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed) || parsed.version !== 1) throw new Error("画布版本不支持");
    const actionDetails: ScheduleRuleDetailGroup["actionDetails"] = {};
    const steps = restoreSteps(parsed.steps, actionDetails);
    if (!steps.length) throw new Error("画布步骤为空");
    return { ok: true, group: { flow: { steps }, actionDetails } };
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : "画布解析失败" };
  }
}
