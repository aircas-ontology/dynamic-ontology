import type { GetOntologyFunctionDetailParamItem, TestOntologyFunctionParams } from "@/types";

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
 * @description 组装函数测试请求体；按 bindingKeys 顺序写入 variableBindings。
 * @param options 组装选项。
 * @param options.functionApi 函数 API 名称。
 * @param options.ontologyIdentifier 所选本体唯一标识。
 * @param options.bindingKeys 有序绑定键。
 * @param options.propertyBindings 键到属性 apiName 的映射。
 * @param options.pageNum 可选页码。
 * @param options.pageSize 可选每页条数。
 * @returns 测试接口请求参数。
 */
export function buildOntologyFunctionTestRequest(options: {
  functionApi: string;
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
    ontologyIdentifier: options.ontologyIdentifier.trim(),
    variableBindings,
    pageNum: options.pageNum ?? 1,
    pageSize: options.pageSize ?? 10,
  };
}
