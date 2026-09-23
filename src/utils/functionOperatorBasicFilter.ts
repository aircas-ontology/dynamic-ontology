import type {
  BasicFilterCondition,
  BasicFilterDocument,
  BasicFilterLogic,
  BasicFilterNode,
  BasicFilterOp,
  BasicFilterValue,
  BasicFilterValueType,
  CreateOntologyFunctionAggFunc,
  CreateOntologyFunctionFilterCondition,
  CreateOntologyFunctionFilterDataType,
  CreateOntologyFunctionFilterNode,
  CreateOntologyFunctionFilters,
  CreateOntologyFunctionQueryConfig,
} from "@/types";

const OP_SET = new Set<string>(["EQ", "NEQ", "GT", "GTE", "LT", "LTE", "CONTAINS", "IS_NULL", "IS_NOT_NULL", "BETWEEN"]);
const VALUE_TYPE_SET = new Set<string>(["string", "number", "boolean"]);

/**
 * @description 创建空的基础过滤条件。
 * @returns 默认 EQ 条件。
 */
export function createEmptyBasicFilterCondition(): BasicFilterCondition {
  return {
    op: "EQ",
    propertyApiName: "",
    valueType: "string",
    value: "",
  };
}

/**
 * @description 创建空的基础过滤文档（根组）。
 * @returns 含一条空 FILTER 子节点的文档。
 */
export function createEmptyBasicFilterDocument(): BasicFilterDocument {
  return {
    logic: "AND",
    children: [
      {
        type: "FILTER",
        filter: createEmptyBasicFilterCondition(),
      },
    ],
  };
}

/**
 * @description 创建空的嵌套过滤组节点。
 * @returns GROUP 节点。
 */
export function createEmptyBasicFilterGroup(): BasicFilterNode {
  return {
    type: "GROUP",
    group: {
      logic: "OR",
      children: [
        {
          type: "FILTER",
          filter: createEmptyBasicFilterCondition(),
        },
      ],
    },
  };
}

/**
 * @description 创建空的 FILTER 节点。
 * @returns FILTER 节点。
 */
export function createEmptyBasicFilterNode(): BasicFilterNode {
  return {
    type: "FILTER",
    filter: createEmptyBasicFilterCondition(),
  };
}

function isLogic(value: unknown): value is BasicFilterLogic {
  return value === "AND" || value === "OR";
}

function isOp(value: unknown): value is BasicFilterOp {
  return typeof value === "string" && OP_SET.has(value);
}

function isValueType(value: unknown): value is BasicFilterValueType {
  return typeof value === "string" && VALUE_TYPE_SET.has(value);
}

function isPrimitiveValue(value: unknown): value is BasicFilterValue {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function defaultValueForType(valueType: BasicFilterValueType): BasicFilterValue {
  if (valueType === "number") return 0;
  if (valueType === "boolean") return false;
  return "";
}

function coerceValue(value: unknown, valueType: BasicFilterValueType): BasicFilterValue {
  if (valueType === "boolean") {
    if (typeof value === "boolean") return value;
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return false;
  }
  if (valueType === "number") {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return value === undefined || value === null ? "" : String(value);
}

function normalizeCondition(raw: unknown): BasicFilterCondition {
  if (typeof raw !== "object" || raw === null) return createEmptyBasicFilterCondition();
  const record = raw as Record<string, unknown>;
  const op = isOp(record.op) ? record.op : "EQ";
  const propertyApiName = typeof record.propertyApiName === "string" ? record.propertyApiName : "";
  const valueType = isValueType(record.valueType) ? record.valueType : "string";
  const condition: BasicFilterCondition = { op, propertyApiName, valueType };
  if (op === "BETWEEN") {
    const values = Array.isArray(record.values) ? record.values.map((item) => coerceValue(item, valueType)).slice(0, 2) : [];
    condition.values = [values[0] ?? defaultValueForType(valueType), values[1] ?? defaultValueForType(valueType)];
  } else if (op !== "IS_NULL" && op !== "IS_NOT_NULL") {
    condition.value = isPrimitiveValue(record.value) || record.value !== undefined ? coerceValue(record.value, valueType) : defaultValueForType(valueType);
  }
  return condition;
}

function normalizeNode(raw: unknown): BasicFilterNode | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  if (record.type === "GROUP" || record.group) {
    return {
      type: "GROUP",
      group: normalizeGroup(record.group),
    };
  }
  if (record.type === "FILTER" || record.filter) {
    return {
      type: "FILTER",
      filter: normalizeCondition(record.filter),
    };
  }
  return null;
}

function normalizeGroup(raw: unknown): BasicFilterDocument {
  if (typeof raw !== "object" || raw === null) return createEmptyBasicFilterDocument();
  const record = raw as Record<string, unknown>;
  const childrenRaw = Array.isArray(record.children) ? record.children : [];
  const children = childrenRaw.map((item) => normalizeNode(item)).filter((item): item is BasicFilterNode => item !== null);
  return {
    logic: isLogic(record.logic) ? record.logic : "AND",
    children: children.length ? children : [createEmptyBasicFilterNode()],
  };
}

/**
 * @description 解析基础函数 parameterConfig 字符串；支持完整 JSON 或仅 children 片段。
 * @param raw 原始配置文本。
 * @returns 规范化后的过滤文档。
 */
export function parseBasicFilterConfig(raw: string): BasicFilterDocument {
  const text = raw.trim();
  if (!text) return createEmptyBasicFilterDocument();
  try {
    const parsed: unknown = JSON.parse(text.startsWith("{") ? text : `{${text}}`);
    if (typeof parsed !== "object" || parsed === null) return createEmptyBasicFilterDocument();
    const record = parsed as Record<string, unknown>;
    if (record.logic !== undefined || Array.isArray(record.children)) {
      return normalizeGroup(record);
    }
    if (record.filter || record.type === "FILTER") {
      const node = normalizeNode(record);
      return {
        logic: "AND",
        children: node ? [node] : [createEmptyBasicFilterNode()],
      };
    }
    return createEmptyBasicFilterDocument();
  } catch {
    return createEmptyBasicFilterDocument();
  }
}

function serializeCondition(condition: BasicFilterCondition): BasicFilterCondition {
  const next: BasicFilterCondition = {
    op: condition.op,
    propertyApiName: condition.propertyApiName.trim(),
    valueType: condition.valueType || "string",
  };
  if (condition.op === "BETWEEN") {
    const values = condition.values ?? [defaultValueForType(next.valueType), defaultValueForType(next.valueType)];
    next.values = [coerceValue(values[0], next.valueType), coerceValue(values[1], next.valueType)];
  } else if (condition.op !== "IS_NULL" && condition.op !== "IS_NOT_NULL") {
    next.value = coerceValue(condition.value, next.valueType);
  }
  return next;
}

function serializeNode(node: BasicFilterNode): BasicFilterNode {
  if (node.type === "GROUP") {
    return {
      type: "GROUP",
      group: serializeGroup(node.group ?? { logic: "OR", children: [] }),
    };
  }
  return {
    type: "FILTER",
    filter: serializeCondition(node.filter ?? createEmptyBasicFilterCondition()),
  };
}

function serializeGroup(group: BasicFilterDocument): BasicFilterDocument {
  return {
    logic: group.logic,
    children: group.children.map(serializeNode),
  };
}

/**
 * @description 将基础过滤文档序列化为 parameterConfig 字符串。
 * @param doc 过滤文档。
 * @returns 带换行的 JSON 文本。
 */
export function stringifyBasicFilterConfig(doc: BasicFilterDocument): string {
  return `${JSON.stringify(serializeGroup(doc), null, 2)}\n`;
}

/**
 * @description 判断运算符是否需要单值入参。
 * @param op 运算符。
 * @returns 是否需要 value。
 */
export function opNeedsValue(op: BasicFilterOp): boolean {
  return op !== "IS_NULL" && op !== "IS_NOT_NULL";
}

/**
 * @description 判断运算符是否需要区间入参。
 * @param op 运算符。
 * @returns 是否需要 values。
 */
export function opNeedsRange(op: BasicFilterOp): boolean {
  return op === "BETWEEN";
}

/**
 * @description 将表单 valueType 映射为创建接口 dataType。
 * @param valueType 表单值类型。
 * @returns 接口 dataType。
 */
function mapValueTypeToDataType(valueType: BasicFilterValueType): CreateOntologyFunctionFilterDataType {
  if (valueType === "number") {
    return "NUMBER";
  }
  if (valueType === "boolean") {
    return "BOOLEAN";
  }
  return "STRING";
}

/**
 * @description 将单条过滤条件转为创建接口 filter 结构。
 * @param condition 表单过滤条件。
 * @returns 接口过滤条件。
 */
function mapConditionToApiFilter(condition: BasicFilterCondition): CreateOntologyFunctionFilterCondition {
  const next: CreateOntologyFunctionFilterCondition = {
    propertyApiName: condition.propertyApiName.trim(),
    op: condition.op,
    dataType: mapValueTypeToDataType(condition.valueType || "string"),
  };
  if (condition.op === "BETWEEN") {
    next.values = [...(condition.values ?? [])];
  } else if (condition.op !== "IS_NULL" && condition.op !== "IS_NOT_NULL") {
    next.value = condition.value;
  }
  return next;
}

/**
 * @description 将过滤节点转为创建接口节点。
 * @param node 表单节点。
 * @returns 接口节点。
 */
function mapNodeToApiFilter(node: BasicFilterNode): CreateOntologyFunctionFilterNode {
  if (node.type === "GROUP") {
    return {
      type: "GROUP",
      group: mapGroupToApiFilters(node.group ?? { logic: "OR", children: [] }),
    };
  }
  return {
    type: "FILTER",
    filter: mapConditionToApiFilter(node.filter ?? createEmptyBasicFilterCondition()),
  };
}

/**
 * @description 将过滤文档转为创建接口 filters。
 * @param group 表单过滤组。
 * @returns 接口 filters。
 */
function mapGroupToApiFilters(group: BasicFilterDocument): CreateOntologyFunctionFilters {
  return {
    logic: group.logic,
    children: group.children.map(mapNodeToApiFilter),
  };
}

/**
 * @description 由参数配置文档构建创建接口 queryConfig；未选聚合类型时不带 aggFunc。
 * @param doc 基础过滤文档。
 * @param aggFunc 可选聚合类型；空字符串表示不传。
 * @returns queryConfig 对象。
 */
export function buildOntologyFunctionQueryConfig(doc: BasicFilterDocument, aggFunc: CreateOntologyFunctionAggFunc | ""): CreateOntologyFunctionQueryConfig {
  const queryConfig: CreateOntologyFunctionQueryConfig = {
    filters: mapGroupToApiFilters(doc),
  };
  if (aggFunc) {
    queryConfig.aggFunc = aggFunc;
  }
  return queryConfig;
}
