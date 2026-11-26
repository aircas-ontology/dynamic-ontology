import type {
  GetOntologyFunctionDetailParamItem,
  ParseOntologyFunctionParamItem,
  TestOntologyFunctionParameterItem,
  TestOntologyFunctionParams,
} from "@/types";

/** 脚本测试表单入参行（含类型展示与可选下级）。 */
export interface OntologyFunctionScriptTestInputRow {
  paramName: string;
  paramType: string;
  /** 叶子参数当前输入值。有下级或 listItems 时省略。 */
  paramValue?: string;
  /** 下级参数；LIST/ARRAY 有元素字段时同时作为元素模板。 */
  fields?: OntologyFunctionScriptTestInputRow[];
  /** LIST/ARRAY 多组元素；每组为一份元素字段树。 */
  listItems?: OntologyFunctionScriptTestInputRow[][];
}

/** 基础函数测试弹框参数绑定行（含类型与描述展示）。 */
export interface OntologyFunctionTestBindingRow {
  /** 参数名，对应 variableBindings 键。 */
  paramName: string;
  /** 参数类型。 */
  paramType: string;
  /** 参数描述。 */
  description: string;
}

/** 详情或解析参数树中用于生成测试入参的最小字段。 */
interface OntologyFunctionScriptTestParamSourceItem {
  paramName: string;
  paramType: string;
  category?: string;
  paramOrder?: number;
  fields?: OntologyFunctionScriptTestParamSourceItem[];
}

/**
 * @description 从详情 param 项读取展示用类型与描述。
 * @param item 详情参数项。
 * @returns 规范化后的类型与描述。
 */
function readOntologyFunctionTestBindingMeta(item: GetOntologyFunctionDetailParamItem): Pick<OntologyFunctionTestBindingRow, "paramType" | "description"> {
  const paramType = typeof item.paramType === "string" ? item.paramType.trim() : "";
  const description = typeof item.description === "string" ? item.description.trim() : "";
  return { paramType, description };
}

/**
 * @description 按详情 params 生成绑定行：AGGREGATION 置首，其余为 FILTER；附带 paramType / description。
 * @param params 详情接口 params。
 * @returns 有序绑定行列表。
 */
export function buildOntologyFunctionTestBindingRows(params: GetOntologyFunctionDetailParamItem[]): OntologyFunctionTestBindingRow[] {
  const aggregationRows: OntologyFunctionTestBindingRow[] = [];
  const filterRows: OntologyFunctionTestBindingRow[] = [];
  for (const item of params) {
    const paramName = typeof item.paramName === "string" ? item.paramName.trim() : "";
    if (!paramName) {
      continue;
    }
    const meta = readOntologyFunctionTestBindingMeta(item);
    const row: OntologyFunctionTestBindingRow = { paramName, ...meta };
    if (item.paramRole === "AGGREGATION") {
      aggregationRows.push(row);
      continue;
    }
    if (item.paramRole === "FILTER") {
      filterRows.push(row);
    }
  }
  return [...aggregationRows, ...filterRows];
}

/**
 * @description 按详情 params 生成 variableBindings 键：AGGREGATION 的 paramName 置首，其余为 FILTER 的 paramName。
 * @param params 详情接口 params。
 * @returns 有序键名列表。
 */
export function buildOntologyFunctionTestBindingKeys(params: GetOntologyFunctionDetailParamItem[]): string[] {
  return buildOntologyFunctionTestBindingRows(params).map((row) => row.paramName);
}

/**
 * @description 按详情 params 生成绑定键对应的 paramId（供 createAction mappingIns.functionParamId）。
 * @param params 详情接口 params。
 * @returns 参数名 → paramId；无有效 paramId 的键不写入。
 */
export function buildOntologyFunctionTestBindingParamIds(params: GetOntologyFunctionDetailParamItem[]): Record<string, number> {
  const ids: Record<string, number> = {};
  for (const item of params) {
    const name = typeof item.paramName === "string" ? item.paramName.trim() : "";
    if (!name) continue;
    if (item.paramRole !== "AGGREGATION" && item.paramRole !== "FILTER") continue;
    if (typeof item.paramId !== "number" || !Number.isInteger(item.paramId)) continue;
    ids[name] = item.paramId;
  }
  return ids;
}

/**
 * @description 判断参数类型是否为列表（含 `LIST`/`ARRAY` 及 `List<...>`/`Array<...>` 泛型）。
 * @param paramType 参数类型。
 * @returns 是否为列表类型。
 */
export function isOntologyFunctionScriptTestListType(paramType: string): boolean {
  const normalized = paramType.trim().toUpperCase();
  return normalized === "LIST" || normalized === "ARRAY" || normalized.startsWith("LIST<") || normalized.startsWith("ARRAY<");
}

/**
 * @description 判断参数类型是否为带泛型参数的列表（如 `List<Double>`、`Array<Point>`）。
 * @param paramType 参数类型。
 * @returns 是否为泛型列表。
 */
function isOntologyFunctionScriptTestGenericListType(paramType: string): boolean {
  const normalized = paramType.trim().toUpperCase();
  return normalized.startsWith("LIST<") || normalized.startsWith("ARRAY<");
}

/**
 * @description 从 `List<T>` / `Array<T>` 解析元素类型；无法解析时回退 STRING。
 * @param paramType 列表参数类型。
 * @returns 元素类型字符串。
 */
function readOntologyFunctionScriptTestListElementType(paramType: string): string {
  const matched = paramType.trim().match(/^(?:List|Array)\s*<\s*([\s\S]+)\s*>$/i);
  const elementType = matched?.[1]?.trim() ?? "";
  return elementType || "STRING";
}

/**
 * @description 为无 fields 的标量列表生成单叶子元素模板。
 * @param paramType 列表参数类型。
 * @returns 元素字段模板。
 */
function createOntologyFunctionScriptTestScalarListTemplate(paramType: string): OntologyFunctionScriptTestInputRow[] {
  return [{ paramName: "value", paramType: readOntologyFunctionScriptTestListElementType(paramType), paramValue: "" }];
}

/**
 * @description 深拷贝脚本测试入参行树（含 listItems）。
 * @param rows 入参行。
 * @returns 拷贝后的入参行。
 */
function cloneOntologyFunctionScriptTestRows(rows: OntologyFunctionScriptTestInputRow[]): OntologyFunctionScriptTestInputRow[] {
  return rows.map((row) => {
    const next: OntologyFunctionScriptTestInputRow = {
      paramName: row.paramName,
      paramType: row.paramType,
    };
    if (row.paramValue !== undefined) {
      next.paramValue = row.paramValue;
    }
    if (row.fields && row.fields.length > 0) {
      next.fields = cloneOntologyFunctionScriptTestRows(row.fields);
    }
    if (row.listItems) {
      next.listItems = row.listItems.map((item) => cloneOntologyFunctionScriptTestRows(item));
    }
    return next;
  });
}

/**
 * @description 按元素模板生成一组空值 LIST 元素字段。
 * @param template 元素字段模板。
 * @returns 空值元素字段树。
 */
function createEmptyOntologyFunctionScriptTestListItem(template: OntologyFunctionScriptTestInputRow[]): OntologyFunctionScriptTestInputRow[] {
  return cloneOntologyFunctionScriptTestRows(template).map((row) => {
    if (row.listItems && row.fields && row.fields.length > 0) {
      return { ...row, listItems: [createEmptyOntologyFunctionScriptTestListItem(row.fields)] };
    }
    if (row.fields && row.fields.length > 0) {
      return { ...row, fields: createEmptyOntologyFunctionScriptTestListItem(row.fields) };
    }
    return { paramName: row.paramName, paramType: row.paramType, paramValue: "" };
  });
}

/**
 * @description 从详情参数项生成脚本测试入参树。仅顶层保留 INPUT；每层按 paramOrder 排序。空 fields 视为叶子，paramValue 初始为空字符串；LIST/ARRAY 有元素字段时初始化一组 listItems。
 * @param items 详情参数项。
 * @param filterInput 为 true 时只保留 category 为 INPUT 的项。
 * @returns 脚本测试表单入参行。
 */
function mapDetailItemsToScriptTestRows(items: OntologyFunctionScriptTestParamSourceItem[], filterInput: boolean): OntologyFunctionScriptTestInputRow[] {
  const sortable: Array<OntologyFunctionScriptTestInputRow & { paramOrder: number }> = [];
  for (const item of items) {
    if (filterInput) {
      const category = typeof item.category === "string" ? item.category.trim().toUpperCase() : "";
      if (category !== "INPUT") {
        continue;
      }
    }
    const paramName = typeof item.paramName === "string" ? item.paramName.trim() : "";
    if (!paramName) {
      continue;
    }
    const paramType = typeof item.paramType === "string" ? item.paramType.trim() : "";
    const paramOrder = typeof item.paramOrder === "number" && Number.isFinite(item.paramOrder) ? item.paramOrder : Number.MAX_SAFE_INTEGER;
    const fields = mapDetailItemsToScriptTestRows(Array.isArray(item.fields) ? item.fields : [], false);
    if (isOntologyFunctionScriptTestListType(paramType) && fields.length > 0) {
      sortable.push({
        paramName,
        paramType,
        fields,
        listItems: [createEmptyOntologyFunctionScriptTestListItem(fields)],
        paramOrder,
      });
    } else if (isOntologyFunctionScriptTestGenericListType(paramType) && fields.length === 0) {
      const template = createOntologyFunctionScriptTestScalarListTemplate(paramType);
      sortable.push({
        paramName,
        paramType,
        fields: template,
        listItems: [createEmptyOntologyFunctionScriptTestListItem(template)],
        paramOrder,
      });
    } else if (fields.length > 0) {
      sortable.push({ paramName, paramType, fields, paramOrder });
    } else {
      sortable.push({ paramName, paramType, paramValue: "", paramOrder });
    }
  }
  sortable.sort((left, right) => {
    if (left.paramOrder !== right.paramOrder) {
      return left.paramOrder - right.paramOrder;
    }
    return left.paramName.localeCompare(right.paramName);
  });
  return sortable.map((row) => {
    if (row.listItems && row.fields && row.fields.length > 0) {
      return { paramName: row.paramName, paramType: row.paramType, fields: row.fields, listItems: row.listItems };
    }
    if (row.fields && row.fields.length > 0) {
      return { paramName: row.paramName, paramType: row.paramType, fields: row.fields };
    }
    return { paramName: row.paramName, paramType: row.paramType, paramValue: row.paramValue ?? "" };
  });
}

/**
 * @description 从详情 params 提取 INPUT 入参树，按 paramOrder 升序；叶子 paramValue 初始为空字符串。
 * @param params 详情接口 params。
 * @returns 脚本测试表单入参行。
 */
export function buildOntologyFunctionScriptTestInputRows(params: GetOntologyFunctionDetailParamItem[]): OntologyFunctionScriptTestInputRow[] {
  return mapDetailItemsToScriptTestRows(params, true);
}

/**
 * @description 将解析得到的参数树转为脚本测试入参行；顶层仅保留 INPUT，叶子 paramValue 初始为空字符串。
 * @param items 解析接口参数项（IDE 左侧或保存解析结果）。
 * @returns 脚本测试表单入参行。
 */
export function buildOntologyFunctionScriptTestInputRowsFromParsed(items: ParseOntologyFunctionParamItem[]): OntologyFunctionScriptTestInputRow[] {
  return mapDetailItemsToScriptTestRows(items, true);
}

/**
 * @description 按从根到叶子的序号路径写入叶子参数值，并返回新的入参树。遇到 LIST 的 listItems 时，下一段路径为元素下标。
 * @param rows 当前层入参行。
 * @param path 剩余序号路径。
 * @param paramValue 参数值。
 * @returns 更新后的入参行。
 */
export function writeOntologyFunctionScriptTestParamValue(
  rows: OntologyFunctionScriptTestInputRow[],
  path: number[],
  paramValue: string,
): OntologyFunctionScriptTestInputRow[] {
  const [index, ...rest] = path;
  if (index === undefined || !Number.isInteger(index) || index < 0 || index >= rows.length) {
    return rows;
  }
  const current = rows[index];
  if (!current) {
    return rows;
  }
  const next = [...rows];
  if (rest.length === 0) {
    next[index] = { ...current, paramValue };
    return next;
  }
  if (current.listItems) {
    const [itemIndex, ...itemRest] = rest;
    if (itemIndex === undefined || !Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= current.listItems.length) {
      return rows;
    }
    const itemRows = current.listItems[itemIndex] ?? [];
    const nextListItems = current.listItems.map((item, listIndex) =>
      listIndex === itemIndex ? writeOntologyFunctionScriptTestParamValue(itemRows, itemRest, paramValue) : item,
    );
    next[index] = { ...current, listItems: nextListItems };
    return next;
  }
  next[index] = { ...current, fields: writeOntologyFunctionScriptTestParamValue(current.fields ?? [], rest, paramValue) };
  return next;
}

/**
 * @description 在路径指向的 LIST 参数末尾追加一组空元素（按 fields 模板克隆）。
 * @param rows 当前层入参行。
 * @param path 指向 LIST 节点的序号路径。
 * @returns 更新后的入参行。
 */
export function addOntologyFunctionScriptTestListItem(rows: OntologyFunctionScriptTestInputRow[], path: number[]): OntologyFunctionScriptTestInputRow[] {
  const [index, ...rest] = path;
  if (index === undefined || !Number.isInteger(index) || index < 0 || index >= rows.length) {
    return rows;
  }
  const current = rows[index];
  if (!current) {
    return rows;
  }
  const next = [...rows];
  if (rest.length === 0) {
    if (!isOntologyFunctionScriptTestListType(current.paramType) || !current.fields || current.fields.length === 0) {
      return rows;
    }
    const template = current.fields;
    const listItems = [...(current.listItems ?? []), createEmptyOntologyFunctionScriptTestListItem(template)];
    next[index] = { ...current, fields: template, listItems };
    return next;
  }
  if (current.listItems) {
    const [itemIndex, ...itemRest] = rest;
    if (itemIndex === undefined || !Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= current.listItems.length) {
      return rows;
    }
    const itemRows = current.listItems[itemIndex] ?? [];
    const nextListItems = current.listItems.map((item, listIndex) =>
      listIndex === itemIndex ? addOntologyFunctionScriptTestListItem(itemRows, itemRest) : item,
    );
    next[index] = { ...current, listItems: nextListItems };
    return next;
  }
  next[index] = { ...current, fields: addOntologyFunctionScriptTestListItem(current.fields ?? [], rest) };
  return next;
}

/**
 * @description 删除路径指向的 LIST 参数中指定下标的元素组。
 * @param rows 当前层入参行。
 * @param path 指向 LIST 节点的序号路径。
 * @param itemIndex 要删除的元素下标。
 * @returns 更新后的入参行。
 */
export function removeOntologyFunctionScriptTestListItem(
  rows: OntologyFunctionScriptTestInputRow[],
  path: number[],
  itemIndex: number,
): OntologyFunctionScriptTestInputRow[] {
  const [index, ...rest] = path;
  if (index === undefined || !Number.isInteger(index) || index < 0 || index >= rows.length) {
    return rows;
  }
  const current = rows[index];
  if (!current) {
    return rows;
  }
  const next = [...rows];
  if (rest.length === 0) {
    if (!current.listItems || !Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= current.listItems.length) {
      return rows;
    }
    next[index] = { ...current, listItems: current.listItems.filter((_, listIndex) => listIndex !== itemIndex) };
    return next;
  }
  if (current.listItems) {
    const [nestedItemIndex, ...itemRest] = rest;
    if (nestedItemIndex === undefined || !Number.isInteger(nestedItemIndex) || nestedItemIndex < 0 || nestedItemIndex >= current.listItems.length) {
      return rows;
    }
    const itemRows = current.listItems[nestedItemIndex] ?? [];
    const nextListItems = current.listItems.map((item, listIndex) =>
      listIndex === nestedItemIndex ? removeOntologyFunctionScriptTestListItem(itemRows, itemRest, itemIndex) : item,
    );
    next[index] = { ...current, listItems: nextListItems };
    return next;
  }
  next[index] = { ...current, fields: removeOntologyFunctionScriptTestListItem(current.fields ?? [], rest, itemIndex) };
  return next;
}

/**
 * @description 按 paramType 将表单字符串转为测试请求标量值。
 * @param paramType 参数类型。
 * @param raw 表单原始字符串。
 * @returns 类型化值；无法转换时回落为原字符串。
 */
function coerceOntologyFunctionScriptTestScalarValue(paramType: string, raw: string): unknown {
  const normalized = paramType.trim().toUpperCase();
  const trimmed = raw.trim();
  if (normalized === "INTEGER" || normalized === "LONG" || normalized === "SHORT" || normalized === "BYTE") {
    if (!trimmed) return raw;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : raw;
  }
  if (normalized === "DOUBLE" || normalized === "FLOAT" || normalized === "NUMBER") {
    if (!trimmed) return raw;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : raw;
  }
  if (normalized === "BOOL" || normalized === "BOOLEAN") {
    const lower = trimmed.toLowerCase();
    if (lower === "true") return true;
    if (lower === "false") return false;
    return raw;
  }
  if (isOntologyFunctionScriptTestListType(normalized) && trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return raw;
    }
  }
  return raw;
}

/**
 * @description 将一组字段树展平为普通对象（LIST 为数组，OBJECT 为嵌套对象）。
 * @param rows 字段行。
 * @returns 普通对象。
 */
function mapScriptTestRowsToPlainObject(rows: OntologyFunctionScriptTestInputRow[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const row of rows) {
    const paramName = row.paramName.trim();
    if (!paramName) continue;
    result[paramName] = mapScriptTestRowToPlainValue(row);
  }
  return result;
}

/**
 * @description 将一组 LIST 元素字段转为普通值：单叶子组输出标量，多字段组输出对象。
 * @param item 一组元素字段。
 * @returns 普通 JSON 值。
 */
function mapScriptTestListItemToPlainValue(item: OntologyFunctionScriptTestInputRow[]): unknown {
  if (item.length === 1) {
    const only = item[0];
    if (only && !(only.fields && only.fields.length > 0) && !only.listItems) {
      return coerceOntologyFunctionScriptTestScalarValue(only.paramType, only.paramValue ?? "");
    }
  }
  return mapScriptTestRowsToPlainObject(item);
}

/**
 * @description 将单行测试入参转为普通 JSON 值。
 * @param row 入参行。
 * @returns 普通 JSON 值。
 */
function mapScriptTestRowToPlainValue(row: OntologyFunctionScriptTestInputRow): unknown {
  if (row.listItems) {
    return row.listItems.map((item) => mapScriptTestListItemToPlainValue(item));
  }
  if (row.fields && row.fields.length > 0) {
    return mapScriptTestRowsToPlainObject(row.fields);
  }
  return coerceOntologyFunctionScriptTestScalarValue(row.paramType, row.paramValue ?? "");
}

/**
 * @description 将脚本测试入参树转换为测试请求 parameters：带 paramType，标量/LIST/OBJECT 均写入 paramValue。
 * @param rows 表单入参行。
 * @returns 测试接口 parameters。
 */
function mapScriptTestRowsToParameters(rows: OntologyFunctionScriptTestInputRow[]): TestOntologyFunctionParameterItem[] {
  return rows.map((row) => {
    const paramName = row.paramName.trim();
    const paramType = row.paramType.trim();
    return {
      paramName,
      ...(paramType ? { paramType } : {}),
      paramValue: mapScriptTestRowToPlainValue(row),
    };
  });
}

/**
 * @description 组装基础函数测试请求体；按 bindingKeys 顺序写入 variableBindings，并带上 version。
 * @param options 组装选项。
 * @param options.functionApi 函数 API 名称。
 * @param options.version 函数版本号。
 * @param options.ontologySpaceId 对象空间 id。
 * @param options.ontologyIdentifier 所选本体唯一标识。
 * @param options.bindingKeys 有序绑定键。
 * @param options.propertyBindings 键到属性 apiName 的映射。
 * @param options.pageNum 可选页码。
 * @param options.pageSize 可选每页条数。
 * @returns 测试接口请求参数。
 */
export function buildOntologyFunctionTestRequest(options: {
  functionApi: string;
  version: string;
  ontologySpaceId: number;
  ontologyIdentifier: string;
  bindingKeys: string[];
  propertyBindings: Record<string, string>;
  pageNum?: number;
  pageSize?: number;
}): TestOntologyFunctionParams {
  const variableBindings: Record<string, string> = {};
  for (const key of options.bindingKeys) {
    const value = options.propertyBindings[key]?.trim() ?? "";
    if (value) {
      variableBindings[key] = value;
    }
  }
  return {
    functionApi: options.functionApi.trim(),
    version: options.version.trim(),
    ontologySpaceId: options.ontologySpaceId,
    ontologyIdentifier: options.ontologyIdentifier.trim(),
    variableBindings,
    pageNum: options.pageNum ?? 1,
    pageSize: options.pageSize ?? 10,
  };
}

/**
 * @description 组装脚本函数测试请求体：functionApi、version、ontologySpaceId 与 parameters。
 * @param options 组装选项。
 * @param options.functionApi 函数 API 名称。
 * @param options.version 函数版本号。
 * @param options.ontologySpaceId 对象空间 id。
 * @param options.rows 表单入参行。
 * @returns 测试接口请求参数。
 */
export function buildOntologyFunctionScriptTestRequest(options: {
  functionApi: string;
  version: string;
  ontologySpaceId: number;
  rows: OntologyFunctionScriptTestInputRow[];
}): TestOntologyFunctionParams {
  const parameters = mapScriptTestRowsToParameters(options.rows);
  return {
    functionApi: options.functionApi.trim(),
    version: options.version.trim(),
    ontologySpaceId: options.ontologySpaceId,
    parameters,
  };
}
