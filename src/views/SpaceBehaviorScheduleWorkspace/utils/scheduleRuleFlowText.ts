import type {
  RuleCompareOperator,
  RuleCompositeCondition,
  RuleConditionNode,
  RuleExprOperator,
  RuleExprTerm,
  RuleFlowBranchStep,
  RuleFlowStep,
  RuleFlowSwitchCase,
  RuleFlowSwitchStep,
  RuleFlowThenAction,
  RuleFunctionArgKind,
  RuleFunctionName,
  RuleLeafCondition,
  RuleValueNode,
  RuleVariableCatalogObject,
  RuleVariableObjectKind,
  ScheduleRuleFlowDocument,
} from "@/types";
import {
  createActionsStep,
  createBranchStep,
  createEmptyCompositeCondition,
  createEmptyLeafCondition,
  createEmptyLiteral,
  createEmptyThenAction,
  createRuleNodeId,
} from "./scheduleRuleFlowFactory.ts";

const COMPARE_SYMBOL: Record<RuleCompareOperator, string> = {
  eq: "==",
  neq: "!=",
  gt: ">",
  lt: "<",
  gte: ">=",
  lte: "<=",
  contains: "contains",
  notContains: "notContains",
  prefixContains: "prefixContains",
};

const SYMBOL_TO_COMPARE: Record<string, RuleCompareOperator> = {
  "==": "eq",
  "!=": "neq",
  ">": "gt",
  "<": "lt",
  ">=": "gte",
  "<=": "lte",
  contains: "contains",
  notContains: "notContains",
  prefixContains: "prefixContains",
};

const FUNCTION_NAMES = new Set(["max", "min", "avg", "dateYmd", "dateMd", "dateHm", "formatDate"]);
const EXPR_OPERATORS = new Set(["add", "sub", "mul", "div", "gt", "lt", "gte", "lte", "neq", "and", "assign"]);

/** 规则文本解析结果。 */
export type ScheduleRuleFlowParseResult = { ok: true; doc: ScheduleRuleFlowDocument } | { ok: false; message: string };

/**
 * @description 判断值是否为普通对象。
 * @param value 待判断值。
 * @returns 是否为对象记录。
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * @description 把未知 JSON 规整为规则值节点。
 * @param value JSON 值。
 * @returns 规则值。
 */
function coerceValueNode(value: unknown): RuleValueNode {
  if (!isRecord(value) || typeof value.kind !== "string") return createEmptyLiteral();
  if (value.kind === "input") {
    return { kind: "input", text: typeof value.text === "string" ? value.text : "" };
  }
  if (value.kind === "variable") {
    const objectKind: RuleVariableObjectKind = value.objectKind === "collection" ? "collection" : "object";
    const instanceIds = Array.isArray(value.instanceIds) ? value.instanceIds.filter((item): item is string => typeof item === "string") : [];
    return {
      kind: "variable",
      objectId: typeof value.objectId === "string" ? value.objectId : "",
      objectName: typeof value.objectName === "string" ? value.objectName : "",
      objectKind,
      propertyId: typeof value.propertyId === "string" ? value.propertyId : "",
      propertyName: typeof value.propertyName === "string" ? value.propertyName : "",
      instanceIds,
    };
  }
  if (value.kind === "function") {
    const fn = value.fn;
    const argKind: RuleFunctionArgKind = value.argKind === "collection" ? "collection" : "object";
    if (typeof fn !== "string" || !isRuleFunctionName(fn)) return createEmptyLiteral();
    return { kind: "function", fn, argKind, arg: coerceValueNode(value.arg) };
  }
  if (value.kind === "expression") {
    return { kind: "expression", terms: coerceExprTerms(value.terms) };
  }
  return createEmptyLiteral();
}

/**
 * @description 判断字符串是否为规则函数名。
 * @param value 待判断值。
 * @returns 是否为规则函数名。
 */
function isRuleFunctionName(value: string): value is RuleFunctionName {
  return FUNCTION_NAMES.has(value);
}

/**
 * @description 判断字符串是否为表达式运算符。
 * @param value 待判断值。
 * @returns 是否为表达式运算符。
 */
function isRuleExprOperator(value: string): value is RuleExprOperator {
  return EXPR_OPERATORS.has(value);
}

/**
 * @description 规整表达式项。
 * @param value JSON 值。
 * @returns 表达式项。
 */
function coerceExprTerms(value: unknown): RuleExprTerm[] {
  if (!Array.isArray(value)) return [];
  const terms: RuleExprTerm[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== "string") continue;
    if (item.type === "value") {
      terms.push({ id: item.id, type: "value", value: coerceValueNode(item.value) });
      continue;
    }
    if (item.type === "operator" && typeof item.op === "string" && isRuleExprOperator(item.op)) {
      terms.push({ id: item.id, type: "operator", op: item.op });
      continue;
    }
    if (item.type === "group") {
      terms.push({ id: item.id, type: "group", terms: coerceExprTerms(item.terms) });
    }
  }
  return terms;
}

/**
 * @description 生成缩进空格。
 * @param level 缩进层级。
 * @returns 空格。
 */
function indent(level: number): string {
  return "  ".repeat(level);
}

/**
 * @description 把字面量转成带引号文本。
 * @param text 原始文本。
 * @returns 转义后的文本。
 */
function escapeLiteral(text: string): string {
  return `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * @description 序列化规则值。
 * @param value 规则值。
 * @returns DSL 片段。
 */
function serializeValue(value: RuleValueNode): string {
  if (value.kind === "input") return escapeLiteral(value.text);
  if (value.kind === "variable") {
    const ids = value.instanceIds ?? [];
    if (ids.length) return `JSON ${JSON.stringify(value)}`;
    if (!value.objectName || !value.propertyName) return 'VAR ""';
    return `VAR ${value.objectName}.${value.propertyName}`;
  }
  return `JSON ${JSON.stringify(value)}`;
}

/**
 * @description 序列化条件树。
 * @param node 条件节点。
 * @param level 缩进层级。
 * @returns DSL 行。
 */
function serializeCondition(node: RuleConditionNode, level: number): string[] {
  const pad = indent(level);
  if (node.type === "composite") {
    const logic = node.logic === "and" ? "AND" : "OR";
    const lines = [`${pad}${logic}`];
    if (!node.children.length) {
      lines.push(`${indent(level + 1)}(empty)`);
      return lines;
    }
    node.children.forEach((child) => {
      lines.push(...serializeCondition(child, level + 1));
    });
    return lines;
  }
  return [`${pad}${serializeValue(node.left)} ${COMPARE_SYMBOL[node.operator]} ${serializeValue(node.right)}`];
}

/**
 * @description 序列化执行行为。
 * @param action 行为。
 * @param level 缩进层级。
 * @returns DSL 行。
 */
function serializeActionLines(action: RuleFlowThenAction, level: number): string[] {
  const lines = [`${indent(level)}DO ${escapeLiteral(action.behaviorName.trim())}`];
  const related = action.relatedObject.trim();
  if (related) lines.push(`${indent(level + 1)}OBJECT ${escapeLiteral(related)}`);
  const ids = action.instanceIds ?? [];
  if (related || ids.length) {
    lines.push(ids.length ? `${indent(level + 1)}INSTANCES ${ids.map((id) => escapeLiteral(id)).join(",")}` : `${indent(level + 1)}INSTANCES ALL`);
  }
  action.params.forEach((param) => {
    lines.push(`${indent(level + 1)}WITH ${param.paramName} = ${serializeValue(param.value)}`);
  });
  return lines;
}

/**
 * @description 序列化 IF / ELSE IF 链。
 * @param branch 条件分支。
 * @param level 缩进层级。
 * @param first 是否为 IF 起点。
 * @returns DSL 行。
 */
function serializeBranchChain(branch: RuleFlowBranchStep, level: number, first: boolean): string[] {
  const lines: string[] = [
    `${indent(level)}${first ? "IF" : "ELSE IF"}`,
    ...serializeCondition(branch.condition, level + 1),
    `${indent(level)}THEN`,
    ...serializeSteps(branch.then, level + 1),
  ];
  if (branch.otherwise && branch.otherwise.length) {
    const [next, ...rest] = branch.otherwise;
    if (next && next.kind === "branch" && rest.length === 0) {
      lines.push(...serializeBranchChain(next, level, false));
    } else {
      lines.push(`${indent(level)}ELSE`, ...serializeSteps(branch.otherwise, level + 1));
    }
  }
  return lines;
}

/**
 * @description 序列化 Switch 步骤。
 * @param step Switch 步骤。
 * @param level 缩进层级。
 * @returns DSL 行。
 */
function serializeSwitchStep(step: RuleFlowSwitchStep, level: number): string[] {
  const lines: string[] = [`${indent(level)}SWITCH ${serializeValue(step.switchOn)}`];
  step.cases.forEach((item) => {
    lines.push(`${indent(level)}CASE ${serializeValue(item.value)}`, ...serializeSteps(item.steps, level + 1));
  });
  if (step.defaultSteps && step.defaultSteps.length) {
    lines.push(`${indent(level)}DEFAULT`, ...serializeSteps(step.defaultSteps, level + 1));
  }
  return lines;
}

/**
 * @description 序列化步骤列表。
 * @param steps 步骤。
 * @param level 缩进层级。
 * @returns DSL 行。
 */
function serializeSteps(steps: RuleFlowStep[], level: number): string[] {
  const lines: string[] = [];
  steps.forEach((step) => {
    if (step.kind === "actions") {
      step.actions.forEach((action) => lines.push(...serializeActionLines(action, level)));
      return;
    }
    if (step.kind === "switch") {
      lines.push(...serializeSwitchStep(step, level));
      return;
    }
    lines.push(...serializeBranchChain(step, level, true));
  });
  return lines;
}

/**
 * @description 把画布文档序列化为规则代码文本。
 * @param doc 规则流文档。
 * @returns DSL 文本。
 */
export function serializeScheduleRuleFlow(doc: ScheduleRuleFlowDocument): string {
  return `${serializeSteps(doc.steps, 0).join("\n").trimEnd()}\n`;
}

/**
 * @description 去掉字面量两侧引号。
 * @param raw 原始片段。
 * @returns 文本。
 */
function unquote(raw: string): string {
  const text = raw.trim();
  if (text.startsWith('"') && text.endsWith('"') && text.length >= 2) {
    return text.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  return text;
}

/**
 * @description 在变量目录中解析对象.键引用。
 * @param catalog 变量目录。
 * @param objectName 变量名。
 * @param propertyName 键名。
 * @returns 变量值节点。
 */
function findVariable(catalog: RuleVariableCatalogObject[], objectName: string, propertyName: string): RuleValueNode {
  for (const object of catalog) {
    if (object.name !== objectName) continue;
    const property = object.properties.find((item) => item.name === propertyName);
    if (!property) continue;
    return {
      kind: "variable",
      objectId: object.id,
      objectName: object.name,
      objectKind: object.kind,
      propertyId: property.id,
      propertyName: property.name,
      instanceIds: [],
    };
  }
  return {
    kind: "variable",
    objectId: "",
    objectName,
    objectKind: "object",
    propertyId: "",
    propertyName,
    instanceIds: [],
  };
}

/**
 * @description 解析值 token。
 * @param token DSL 片段。
 * @param catalog 变量目录。
 * @returns 规则值。
 */
function parseValueToken(token: string, catalog: RuleVariableCatalogObject[]): RuleValueNode {
  const text = token.trim();
  if (text.startsWith("JSON ")) {
    try {
      return coerceValueNode(JSON.parse(text.slice(5)));
    } catch {
      return createEmptyLiteral();
    }
  }
  if (text.startsWith("VAR ")) {
    const ref = text.slice(4).trim().replace(/^"|"$/g, "");
    const [objectName = "", propertyName = ""] = ref.split(".");
    return findVariable(catalog, objectName, propertyName);
  }
  return { kind: "input", text: unquote(text) };
}

/**
 * @description 拆分叶子比较行。
 * @param line 条件行。
 * @returns 左右值与运算符。
 */
function splitLeafLine(line: string): { left: string; op: string; right: string } | null {
  const operators = ["prefixContains", "notContains", "contains", ">=", "<=", "==", "!=", ">", "<"];
  for (const op of operators) {
    const idx = line.indexOf(` ${op} `);
    if (idx >= 0) {
      return { left: line.slice(0, idx).trim(), op, right: line.slice(idx + op.length + 2).trim() };
    }
  }
  return null;
}

/** DSL 解析游标。 */
interface ParseState {
  lines: string[];
  index: number;
}

/**
 * @description 查看当前行。
 * @param state 解析状态。
 * @returns 当前行。
 */
function peek(state: ParseState): string | null {
  return state.index < state.lines.length ? state.lines[state.index]! : null;
}

/**
 * @description 消费当前行。
 * @param state 解析状态。
 * @returns 当前行。
 */
function next(state: ParseState): string | null {
  if (state.index >= state.lines.length) return null;
  const line = state.lines[state.index]!;
  state.index += 1;
  return line;
}

/**
 * @description 计算行首空格数。
 * @param line 源码行。
 * @returns 缩进空格数。
 */
function lineIndent(line: string): number {
  return line.match(/^ */)?.[0]?.length ?? 0;
}

/**
 * @description 解析条件块。
 * @param state 解析状态。
 * @param catalog 变量目录。
 * @param baseIndent 父级缩进。
 * @returns 组合条件。
 */
function parseConditionBlock(state: ParseState, catalog: RuleVariableCatalogObject[], baseIndent: number): RuleCompositeCondition {
  const root = createEmptyCompositeCondition(false);
  const first = peek(state);
  if (!first) return root;
  const trimmed = first.trim();
  if (trimmed === "AND" || trimmed === "OR") {
    next(state);
    root.logic = trimmed === "AND" ? "and" : "or";
    while (true) {
      const line = peek(state);
      if (!line) break;
      const indentCount = lineIndent(line);
      if (indentCount <= baseIndent) break;
      const childTrim = line.trim();
      if (childTrim === "AND" || childTrim === "OR") {
        root.children.push(parseConditionBlock(state, catalog, indentCount));
        continue;
      }
      next(state);
      if (childTrim === "(empty)") continue;
      const leafParts = splitLeafLine(childTrim);
      if (!leafParts) continue;
      const compare = SYMBOL_TO_COMPARE[leafParts.op];
      if (!compare) continue;
      const leaf: RuleLeafCondition = {
        id: createRuleNodeId("leaf"),
        type: "leaf",
        left: parseValueToken(leafParts.left, catalog),
        operator: compare,
        right: parseValueToken(leafParts.right, catalog),
      };
      root.children.push(leaf);
    }
    if (!root.children.length) root.children.push(createEmptyLeafCondition());
    return root;
  }
  next(state);
  const leafParts = splitLeafLine(trimmed);
  if (leafParts) {
    const compare = SYMBOL_TO_COMPARE[leafParts.op] || "eq";
    root.children.push({
      id: createRuleNodeId("leaf"),
      type: "leaf",
      left: parseValueToken(leafParts.left, catalog),
      operator: compare,
      right: parseValueToken(leafParts.right, catalog),
    });
  } else {
    root.children.push(createEmptyLeafCondition());
  }
  return root;
}

/**
 * @description 解析带引号的实例列表。
 * @param raw 原始片段。
 * @returns 实例标识。
 */
function parseQuotedCsv(raw: string): string[] {
  const result: string[] = [];
  const pattern = /"((?:\\.|[^"\\])*)"/g;
  let match = pattern.exec(raw);
  while (match) {
    result.push(match[1]!.replace(/\\"/g, '"').replace(/\\\\/g, "\\"));
    match = pattern.exec(raw);
  }
  return result;
}

/**
 * @description 解析连续 DO 行为。
 * @param state 解析状态。
 * @param catalog 变量目录。
 * @param stopIndent 停止缩进。
 * @returns 行为列表。
 */
function parseThenActions(state: ParseState, catalog: RuleVariableCatalogObject[], stopIndent: number): RuleFlowThenAction[] {
  const actions: RuleFlowThenAction[] = [];
  while (true) {
    const line = peek(state);
    if (!line || lineIndent(line) <= stopIndent) break;
    const trimmed = line.trim();
    if (!trimmed.startsWith("DO ")) break;
    next(state);
    const action = createEmptyThenAction();
    action.behaviorName = unquote(trimmed.slice(3).trim());
    while (true) {
      const metaLine = peek(state);
      if (!metaLine || lineIndent(metaLine) <= stopIndent) break;
      const metaTrim = metaLine.trim();
      if (metaTrim.startsWith("OBJECT ")) {
        next(state);
        action.relatedObject = unquote(metaTrim.slice(7).trim());
        continue;
      }
      if (metaTrim.startsWith("INSTANCES ")) {
        next(state);
        const raw = metaTrim.slice(10).trim();
        action.instanceIds = raw === "ALL" || raw === "*" ? [] : parseQuotedCsv(raw);
        continue;
      }
      break;
    }
    while (true) {
      const withLine = peek(state);
      if (!withLine || lineIndent(withLine) <= stopIndent) break;
      const withTrim = withLine.trim();
      if (!withTrim.startsWith("WITH ")) break;
      next(state);
      const eqIdx = withTrim.indexOf(" = ");
      if (eqIdx < 0) continue;
      action.params.push({
        paramId: withTrim.slice(5, eqIdx).trim(),
        paramName: withTrim.slice(5, eqIdx).trim(),
        valueType: "string",
        value: parseValueToken(withTrim.slice(eqIdx + 3).trim(), catalog),
      });
    }
    actions.push(action);
  }
  return actions;
}

/** IF 链中的一段。 */
interface ChainItem {
  condition: RuleCompositeCondition | null;
  body: RuleFlowStep[];
}

/**
 * @description 解析缩进语句列表。
 * @param state 解析状态。
 * @param catalog 变量目录。
 * @param parentIndent 父级缩进。
 * @returns 步骤。
 */
function parseStatementList(state: ParseState, catalog: RuleVariableCatalogObject[], parentIndent: number): RuleFlowStep[] {
  const steps: RuleFlowStep[] = [];
  while (true) {
    const line = peek(state);
    if (!line) break;
    const ind = lineIndent(line);
    if (ind <= parentIndent) break;
    const trimmed = line.trim();
    if (trimmed === "IF") {
      steps.push(parseIfChain(state, catalog, ind));
      continue;
    }
    if (trimmed.startsWith("SWITCH ")) {
      steps.push(parseSwitchBlock(state, catalog, ind));
      continue;
    }
    if (trimmed.startsWith("DO ")) {
      const actions = parseThenActions(state, catalog, ind - 1);
      steps.push(createActionsStep(actions.length ? actions : [createEmptyThenAction()]));
      continue;
    }
    break;
  }
  return steps;
}

/**
 * @description 把 IF 链折叠成嵌套分支。
 * @param chain IF / ELSE IF 段。
 * @param otherwise ELSE 路径。
 * @returns 步骤或空。
 */
function buildChainBranch(chain: ChainItem[], otherwise: RuleFlowStep[] | null): RuleFlowStep[] | null {
  let linked: RuleFlowStep[] | null = otherwise;
  for (let i = chain.length - 1; i >= 0; i -= 1) {
    const item = chain[i]!;
    if (!item.condition) {
      linked = item.body;
      continue;
    }
    linked = [
      {
        kind: "branch",
        id: createRuleNodeId("branch"),
        condition: item.condition,
        then: item.body,
        otherwise: linked,
      },
    ];
  }
  return linked;
}

/**
 * @description 解析 IF / ELSE IF / ELSE 链。
 * @param state 解析状态。
 * @param catalog 变量目录。
 * @param chainIndent 链缩进。
 * @returns 条件分支。
 */
function parseIfChain(state: ParseState, catalog: RuleVariableCatalogObject[], chainIndent: number): RuleFlowBranchStep {
  const chain: ChainItem[] = [];
  let elseBody: RuleFlowStep[] | null = null;
  while (true) {
    const header = (next(state) || "").trim();
    if (header === "ELSE") {
      elseBody = parseStatementList(state, catalog, chainIndent);
      break;
    }
    if (header !== "IF" && header !== "ELSE IF") {
      throw new Error(`无法识别分支关键字：${header}`);
    }
    const condition = parseConditionBlock(state, catalog, chainIndent);
    const thenLine = (next(state) || "").trim();
    if (thenLine !== "THEN") throw new Error(`${header} 后缺少 THEN`);
    const body = parseStatementList(state, catalog, chainIndent);
    const following = peek(state);
    chain.push({ condition, body });
    if (!following || lineIndent(following) < chainIndent) break;
    const nextTrimmed = following.trim();
    if (lineIndent(following) === chainIndent && (nextTrimmed === "ELSE IF" || nextTrimmed === "ELSE")) continue;
    break;
  }
  const linked = buildChainBranch(chain, elseBody);
  if (linked && linked[0]?.kind === "branch" && linked.length === 1) return linked[0];
  return createBranchStep(createEmptyCompositeCondition(true), linked ?? []);
}

/**
 * @description 解析 Switch 块。
 * @param state 解析状态。
 * @param catalog 变量目录。
 * @param blockIndent Switch 缩进。
 * @returns Switch 步骤。
 */
function parseSwitchBlock(state: ParseState, catalog: RuleVariableCatalogObject[], blockIndent: number): RuleFlowSwitchStep {
  const header = next(state);
  const switchOn = parseValueToken((header?.trim() ?? "").slice("SWITCH ".length).trim(), catalog);
  const cases: RuleFlowSwitchCase[] = [];
  let defaultSteps: RuleFlowStep[] | null = null;
  while (true) {
    const line = peek(state);
    if (!line) break;
    const ind = lineIndent(line);
    const trimmed = line.trim();
    if (ind < blockIndent || ind !== blockIndent) break;
    if (trimmed.startsWith("CASE ")) {
      next(state);
      const caseSteps = parseStatementList(state, catalog, blockIndent);
      cases.push({
        id: createRuleNodeId("case"),
        label: `case ${cases.length + 1}`,
        value: parseValueToken(trimmed.slice("CASE ".length).trim(), catalog),
        steps: caseSteps.length ? caseSteps : [createActionsStep()],
      });
      continue;
    }
    if (trimmed === "DEFAULT") {
      next(state);
      defaultSteps = parseStatementList(state, catalog, blockIndent);
      if (!defaultSteps.length) defaultSteps = null;
      break;
    }
    break;
  }
  return { kind: "switch", id: createRuleNodeId("switch"), switchOn, cases, defaultSteps };
}

/**
 * @description 把规则代码解析为画布文档。
 * @param source 规则文本。
 * @param catalog 自定义变量目录。
 * @returns 解析成功文档或失败原因。
 */
export function parseScheduleRuleFlow(source: string, catalog: RuleVariableCatalogObject[]): ScheduleRuleFlowParseResult {
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.replace(/\t/g, "  "))
    .filter((line) => line.trim().length > 0);
  if (!lines.length) return { ok: false, message: "代码为空" };
  try {
    const state: ParseState = { lines, index: 0 };
    const steps = parseStatementList(state, catalog, -1);
    if (state.index < lines.length) {
      return { ok: false, message: `存在无法解析的代码行：${lines[state.index]?.trim()}` };
    }
    return { ok: true, doc: { steps } };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "规则代码解析失败" };
  }
}
