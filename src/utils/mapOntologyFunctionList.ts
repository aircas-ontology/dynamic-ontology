import type { FunctionOperator, GetOntologyFunctionListItem } from "@/types";

/**
 * @description 将函数列表接口记录映射为页面 FunctionOperator；契约未返回字段置空。
 * @param item 列表记录。
 * @param spaceId 当前空间 id（列表契约暂无空间字段，仅用于页面态）。
 * @returns 页面算子模型。
 */
export function mapOntologyFunctionListItem(item: GetOntologyFunctionListItem, spaceId: number): FunctionOperator {
  const apiModelType = typeof item.type === "string" ? item.type : "";
  return {
    id: item.functionApi || "",
    spaceId,
    name: item.displayName || "",
    functionApi: item.functionApi || "",
    description: item.description || "",
    type: "basic",
    apiModelType,
    protocol: "",
    version: "",
    createdBy: "",
    updatedAt: "",
    status: "",
    category: "",
    inputParameters: [],
    outputParameters: [],
    timeout: 0,
    retryCount: 0,
    retryInterval: 0,
    definition: { kind: "basic", parameterConfig: "" },
    dependencies: [],
    testStatus: "untested",
    testedAt: "",
    versions: [],
  };
}
