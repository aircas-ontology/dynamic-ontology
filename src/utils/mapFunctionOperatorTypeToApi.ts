import type { FunctionOperatorType } from "@/types";

/** 页面函数类型到列表/筛选接口 type 的映射。 */
const FUNCTION_OPERATOR_TYPE_TO_API: Partial<Record<FunctionOperatorType, string>> = {
  basic: "BASIC_QUERY",
  code: "CUSTOMIZE",
  composite: "COMPOSITE",
};

/** 列表接口 type 到页面函数类型的映射（与筛选下拉一致）。 */
const FUNCTION_OPERATOR_TYPE_FROM_API: Record<string, FunctionOperatorType> = {
  BASIC_QUERY: "basic",
  BASIC: "basic",
  CUSTOMIZE: "code",
  COMPOSITE: "composite",
};

/**
 * @description 将页面函数算子类型映射为列表接口 `type` 参数；无契约映射时返回 undefined。
 * @param type 页面函数类型。
 * @returns 接口类型字符串，或 undefined。
 */
export function mapFunctionOperatorTypeToApi(type: FunctionOperatorType | ""): string | undefined {
  if (!type) {
    return undefined;
  }
  return FUNCTION_OPERATOR_TYPE_TO_API[type];
}

/**
 * @description 将列表/详情接口 `type` 映射为页面函数类型；与筛选条件映射互逆。
 * @param apiType 接口类型字符串。
 * @returns 页面函数类型；无法识别时默认 basic。
 */
export function mapFunctionOperatorTypeFromApi(apiType: string | undefined): FunctionOperatorType {
  const key = typeof apiType === "string" ? apiType.trim() : "";
  if (!key) {
    return "basic";
  }
  return FUNCTION_OPERATOR_TYPE_FROM_API[key] ?? "basic";
}
