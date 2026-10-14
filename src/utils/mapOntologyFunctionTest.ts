import type { GetOntologyFunctionDetailParamItem, TestOntologyFunctionParameterItem, TestOntologyFunctionParams } from "@/types";

/** 脚本测试表单入参行（含类型展示）。 */
export interface OntologyFunctionScriptTestInputRow {
  paramName: string;
  paramType: string;
  paramValue: string;
}

/**
 * @description 按详情 params 生成 variableBindings 键：AGGREGATION 的 paramName 置首，其余为 FILTER 的 paramName。
 * @param params 详情接口 params。
 * @returns 有序键名列表。
 */
export function buildOntologyFunctionTestBindingKeys(params: GetOntologyFunctionDetailParamItem[]): string[] {
  const aggregationKeys: string[] = [];
  const filterKeys: string[] = [];
  for (const item of params) {
    const name = typeof item.paramName === "string" ? item.paramName.trim() : "";
    if (!name) {
      continue;
    }
    if (item.paramRole === "AGGREGATION") {
      aggregationKeys.push(name);
      continue;
    }
    if (item.paramRole === "FILTER") {
      filterKeys.push(name);
    }
  }
  return [...aggregationKeys, ...filterKeys];
}

/**
 * @description 从详情 params 提取 INPUT 入参行，按 paramOrder 升序；paramValue 初始为空字符串。
 * @param params 详情接口 params。
 * @returns 脚本测试表单入参行。
 */
export function buildOntologyFunctionScriptTestInputRows(params: GetOntologyFunctionDetailParamItem[]): OntologyFunctionScriptTestInputRow[] {
  const sortable: Array<OntologyFunctionScriptTestInputRow & { paramOrder: number }> = [];
  for (const item of params) {
    const category = typeof item.category === "string" ? item.category.trim().toUpperCase() : "";
    if (category !== "INPUT") {
      continue;
    }
    const paramName = typeof item.paramName === "string" ? item.paramName.trim() : "";
    if (!paramName) {
      continue;
    }
    const paramType = typeof item.paramType === "string" ? item.paramType.trim() : "";
    const paramOrder = typeof item.paramOrder === "number" && Number.isFinite(item.paramOrder) ? item.paramOrder : Number.MAX_SAFE_INTEGER;
    sortable.push({ paramName, paramType, paramValue: "", paramOrder });
  }
  sortable.sort((left, right) => {
    if (left.paramOrder !== right.paramOrder) {
      return left.paramOrder - right.paramOrder;
    }
    return left.paramName.localeCompare(right.paramName);
  });
  return sortable.map(({ paramName, paramType, paramValue }) => ({ paramName, paramType, paramValue }));
}

/**
 * @description 组装基础函数测试请求体；按 bindingKeys 顺序写入 variableBindings，并带上 version。
 * @param options 组装选项。
 * @param options.functionApi 函数 API 名称。
 * @param options.version 函数版本号。
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
    ontologyIdentifier: options.ontologyIdentifier.trim(),
    variableBindings,
    pageNum: options.pageNum ?? 1,
    pageSize: options.pageSize ?? 10,
  };
}

/**
 * @description 组装脚本函数测试请求体：functionApi、version 与 parameters。
 * @param options 组装选项。
 * @param options.functionApi 函数 API 名称。
 * @param options.version 函数版本号。
 * @param options.rows 表单入参行。
 * @returns 测试接口请求参数。
 */
export function buildOntologyFunctionScriptTestRequest(options: {
  functionApi: string;
  version: string;
  rows: OntologyFunctionScriptTestInputRow[];
}): TestOntologyFunctionParams {
  const parameters: TestOntologyFunctionParameterItem[] = options.rows.map((row) => ({
    paramName: row.paramName.trim(),
    paramValue: row.paramValue,
  }));
  return {
    functionApi: options.functionApi.trim(),
    version: options.version.trim(),
    parameters,
  };
}
