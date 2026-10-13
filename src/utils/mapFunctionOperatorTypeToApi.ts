import type { FunctionOperatorType } from "@/types";

/** 页面函数类型到列表/筛选接口 type 的映射。 */
const FUNCTION_OPERATOR_TYPE_TO_API: Partial<Record<FunctionOperatorType, string>> = {
  basic: "BASIC_QUERY",
  code: "CUSTOMIZE",
  composite: "COMPOSITE",
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
