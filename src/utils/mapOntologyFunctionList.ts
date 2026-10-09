import dayjs from "dayjs";

import type { FunctionOperator, GetOntologyFunctionListItem } from "@/types";

/**
 * @description 将列表 updateTime 格式化为页面展示用更新时间；非法值回落为空串。
 * @param updateTime 接口 ISO 时间字符串。
 * @returns `YYYY-MM-DD HH:mm:ss` 或空串。
 */
function formatOntologyFunctionUpdateTime(updateTime: string | undefined): string {
  const raw = typeof updateTime === "string" ? updateTime.trim() : "";
  if (!raw) {
    return "";
  }
  const parsed = dayjs(raw);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : "";
}

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
    updatedAt: formatOntologyFunctionUpdateTime(item.updateTime),
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
