import type {
  RuleCompareOperator,
  RuleCompositeCondition,
  RuleConditionNode,
  RuleFlowThenAction,
  RuleValueNode,
  ScheduleBehaviorOption,
  ScheduleRuleDetailGroup,
} from "@/types";

type Token = { kind: "condition"; value: RuleConditionNode } | { kind: "left" | "right" | "and" | "or" };
const operators: Record<string, RuleCompareOperator> = {
  EQ: "eq",
  NE: "neq",
  GT: "gt",
  GE: "gte",
  LT: "lt",
  LE: "lte",
  CONTAINS: "contains",
  NOT_CONTAINS: "notContains",
};

/** @description 判断外部数据是否为对象记录。 @param value 外部数据。 @returns 是否为记录。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** @description 在未指定主实例时使用接口保存的目标实例，供行为参数组件回显。 @param detail 已保存行为信息。 @returns 可恢复参数 JSON。 */
export function buildSavedActionEntityJson(detail: ScheduleRuleDetailGroup["actionDetails"][string] | undefined): string {
  if (!detail) return "";
  if (!detail.entityId) return detail.entityJson;
  try {
    const parsed: unknown = JSON.parse(detail.entityJson || "{}");
    if (!isRecord(parsed) || parsed.entityPrimaryKey !== undefined) return detail.entityJson;
    return JSON.stringify({ ...parsed, entityPrimaryKey: detail.entityId });
  } catch {
    return detail.entityJson;
  }
}

/** @description 严格读取括号个数，并兼容接口说明中的历史布尔形式。 @param value 括号数量。 @returns 数量。 */
function readBracketCount(value: unknown): number {
  if (value === undefined || value === null || value === false) return 0;
  if (value === true) return 1;
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 100) return value;
  throw new Error("规则括号数量无效");
}

/** @description 将接口操作数还原成可展示的固定值或变量。 @param value 操作数。 @returns 画布值。 */
function restoreOperand(value: unknown): RuleValueNode {
  if (!isRecord(value)) throw new Error("规则操作数缺失");
  if (value.type === "fixed" && typeof value.fixValue === "string") return { kind: "input", text: value.fixValue };
  if (value.type === "dynamic" && typeof value.OntologyId === "string" && value.OntologyId && typeof value.entityId === "string" && value.entityId) {
    const propertyId = typeof value.propertyId === "string" ? value.propertyId : "";
    const propertyName = typeof value.propertyName === "string" ? value.propertyName : "";
    if (!propertyId && !propertyName) throw new Error("规则变量属性缺失");
    return {
      kind: "variable",
      objectId: value.OntologyId,
      objectName: value.OntologyId,
      objectKind: "object",
      propertyId,
      propertyName: propertyName || propertyId,
      instanceIds: [value.entityId],
    };
  }
  throw new Error("规则变量或固定值不完整");
}

/** @description 解析括号和 AND 优先级，重建条件树并拒绝不完整表达式。 @param value 接口判断项。 @param nextId 生成节点 ID。 @returns 根条件组合。 */
function restoreCondition(value: unknown, nextId: () => string): RuleCompositeCondition {
  if (!Array.isArray(value) || !value.length) throw new Error("规则条件为空");
  const tokens: Token[] = [];
  value.forEach((item: unknown, index) => {
    if (!isRecord(item) || typeof item.condition !== "string" || !Object.hasOwn(operators, item.condition)) throw new Error("规则比较操作符不支持");
    const operator = operators[item.condition];
    if (!operator) throw new Error("规则比较操作符不支持");
    for (let count = readBracketCount(item.isLeft); count > 0; count--) tokens.push({ kind: "left" });
    tokens.push({
      kind: "condition",
      value: {
        id: nextId(),
        type: "leaf",
        left: restoreOperand(item.leftOperate),
        right: restoreOperand(item.rightOperate),
        operator,
      },
    });
    for (let count = readBracketCount(item.isRight); count > 0; count--) tokens.push({ kind: "right" });
    if (index < value.length - 1) {
      if (item.linkFlag !== "AND" && item.linkFlag !== "OR") throw new Error("规则条件连接符无效");
      tokens.push({ kind: item.linkFlag === "AND" ? "and" : "or" });
    } else if (item.linkFlag != null && item.linkFlag !== "NULL") throw new Error("规则最后一项不应包含连接符");
  });
  let position = 0;
  /** @description 合并同逻辑节点以便直观展示。 @param logic 逻辑。 @param left 左节点。 @param right 右节点。 @returns 组合节点。 */
  function combine(logic: "and" | "or", left: RuleConditionNode, right: RuleConditionNode): RuleCompositeCondition {
    return {
      id: nextId(),
      type: "composite",
      logic,
      children: [
        ...(left.type === "composite" && left.logic === logic ? left.children : [left]),
        ...(right.type === "composite" && right.logic === logic ? right.children : [right]),
      ],
    };
  }
  /** @description 读取一项或括号包围的条件。 @returns 条件节点。 */
  function parsePrimary(): RuleConditionNode {
    const token = tokens[position++];
    if (token?.kind === "condition") return token.value;
    if (token?.kind !== "left") throw new Error("规则条件或括号无效");
    const node = parseOr();
    if (tokens[position++]?.kind !== "right") throw new Error("规则括号不匹配");
    return node;
  }
  /** @description 按优先级解析 AND。 @returns 条件节点。 */
  function parseAnd(): RuleConditionNode {
    let node = parsePrimary();
    while (tokens[position]?.kind === "and") {
      position++;
      node = combine("and", node, parsePrimary());
    }
    return node;
  }
  /** @description 按优先级解析 OR。 @returns 条件节点。 */
  function parseOr(): RuleConditionNode {
    let node = parseAnd();
    while (tokens[position]?.kind === "or") {
      position++;
      node = combine("or", node, parseAnd());
    }
    return node;
  }
  const node = parseOr();
  if (position !== tokens.length) throw new Error("规则括号不匹配");
  return node.type === "composite" ? node : { id: nextId(), type: "composite", logic: "and", children: [node] };
}

/** @description 依据独立规则、取反标志和行为参数构建只读画布数据；不会猜测原始 switch 结构。 @param value 规则详情。 @param options 当前可用行为。 @returns 详情组或错误。 */
export function restoreRuleScheduleDetail(
  value: unknown,
  options: readonly ScheduleBehaviorOption[],
): { ok: true; groups: ScheduleRuleDetailGroup[] } | { ok: false; error: string } {
  try {
    if (!isRecord(value) || !Array.isArray(value.judgeRules) || !value.judgeRules.length) throw new Error("规则详情为空");
    let sequence = 0;
    /** @description 为详情画布生成独立节点标识。 @returns 节点 ID。 */
    function nextId(): string {
      sequence++;
      return `detail-${sequence}`;
    }
    const groups = new Map<string, ScheduleRuleDetailGroup>();
    for (const entry of value.judgeRules) {
      if (
        !isRecord(entry) ||
        !Array.isArray(entry.judgeParams) ||
        !isRecord(entry.actionParam) ||
        typeof entry.actionParam.action_api !== "string" ||
        !entry.actionParam.action_api
      )
        throw new Error("规则或行为信息不完整");
      if (entry.condition !== undefined && typeof entry.condition !== "boolean") throw new Error("规则取反标志无效");
      const condition = restoreCondition(entry.judgeParams, nextId);
      const key = JSON.stringify(entry.judgeParams);
      let group = groups.get(key);
      if (!group) {
        group = { flow: { steps: [{ id: nextId(), kind: "branch", condition, then: [], otherwise: null }] }, actionDetails: {} };
        groups.set(key, group);
      }
      const branch = group.flow.steps[0];
      if (!branch || branch.kind !== "branch") throw new Error("规则条件无效");
      const rawJson = entry.actionParam.entity_json;
      if (rawJson !== undefined && typeof rawJson !== "string") throw new Error("行为参数格式无效");
      let entityJson = "";
      let savedParams: Record<string, unknown> = {};
      if (typeof rawJson === "string" && rawJson.trim()) {
        const parsed: unknown = JSON.parse(rawJson);
        if (!isRecord(parsed) && !Array.isArray(parsed)) throw new Error("行为参数格式无效");
        entityJson = rawJson;
        if (isRecord(parsed) && isRecord(parsed.params)) savedParams = parsed.params;
      }
      const api = entry.actionParam.action_api;
      const ontology = typeof entry.actionParam.ontology_identifier === "string" ? entry.actionParam.ontology_identifier : "";
      const option = options.find((item) => item.actionApi === api && (!ontology || item.ontologyUniqIdentifier === ontology));
      const action: RuleFlowThenAction = {
        id: nextId(),
        behaviorId: option?.id ?? "",
        behaviorName: option?.displayName ?? api,
        relatedObject: ontology,
        instanceIds: [],
        params: Object.entries(savedParams).map(([name, value]) => ({
          paramId: name,
          paramName: name,
          valueType: "string",
          value: { kind: "input", text: value === null ? "null" : typeof value === "object" ? JSON.stringify(value) : String(value) },
        })),
      };
      group.actionDetails[action.id] = {
        actionApi: api,
        ontologyIdentifier: ontology,
        entityJson,
        entityId: typeof entry.actionParam.entity_identifiler === "string" ? entry.actionParam.entity_identifiler : "",
      };
      const path = entry.condition === true ? (branch.otherwise ??= []) : branch.then;
      const last = path.at(-1);
      if (last?.kind === "actions") last.actions.push(action);
      else path.push({ id: nextId(), kind: "actions", actions: [action] });
    }
    return { ok: true, groups: [...groups.values()] };
  } catch (cause) {
    return { ok: false, error: cause instanceof SyntaxError ? "行为参数 JSON 格式无效" : cause instanceof Error ? cause.message : "规则详情解析失败" };
  }
}
