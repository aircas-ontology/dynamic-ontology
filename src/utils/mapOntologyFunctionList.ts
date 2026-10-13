import dayjs from "dayjs";

import type { FunctionOperator, FunctionOperatorDefinition, FunctionOperatorStatus, GetOntologyFunctionListItem } from "@/types";
import { mapFunctionOperatorTypeFromApi } from "./mapFunctionOperatorTypeToApi.ts";

/**
 * @description 按页面函数类型生成列表占位 definition。
 * @param type 页面函数类型。
 * @returns definition。
 */
function createListDefinition(type: FunctionOperator["type"]): FunctionOperatorDefinition {
  if (type === "basic") {
    return { kind: "basic", parameterConfig: "" };
  }
  return { kind: type };
}

/**
 * @description 将列表 createTime / updateTime 格式化为页面展示时间；非法值回落为空串。
 * @param timeValue 接口 ISO 时间字符串。
 * @returns `YYYY-MM-DD HH:mm:ss` 或空串。
 */
function formatOntologyFunctionListTime(timeValue: string | undefined): string {
  const raw = typeof timeValue === "string" ? timeValue.trim() : "";
  if (!raw) {
    return "";
  }
  const parsed = dayjs(raw);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : "";
}

/**
 * @description 将列表 publishStatus 映射为页面状态；仅识别 0 未发布与 1 已发布。
 * @param publishStatus 接口发布状态码。
 * @returns 页面状态，无法识别时为空串。
 */
function mapOntologyFunctionPublishStatus(publishStatus: number | undefined): FunctionOperatorStatus {
  if (publishStatus === 1) {
    return "published";
  }
  if (publishStatus === 0) {
    return "draft";
  }
  return "";
}

/**
 * @description 将函数列表接口记录映射为页面 FunctionOperator；契约未返回字段置空。
 * @param item 列表记录。
 * @param spaceId 当前空间 id（列表契约暂无空间字段，仅用于页面态）。
 * @returns 页面算子模型。
 */
export function mapOntologyFunctionListItem(item: GetOntologyFunctionListItem, spaceId: number): FunctionOperator {
  const apiModelType = typeof item.type === "string" ? item.type : "";
  const type = mapFunctionOperatorTypeFromApi(apiModelType);
  const version = typeof item.version === "string" ? item.version.trim() : "";
  return {
    id: item.functionApi || "",
    spaceId,
    name: item.displayName || "",
    functionApi: item.functionApi || "",
    description: item.description || "",
    type,
    apiModelType,
    protocol: "",
    version,
    createdBy: "",
    createdAt: formatOntologyFunctionListTime(item.createTime),
    updatedAt: formatOntologyFunctionListTime(item.updateTime),
    status: mapOntologyFunctionPublishStatus(item.publishStatus),
    category: "",
    inputParameters: [],
    outputParameters: [],
    timeout: 0,
    retryCount: 0,
    retryInterval: 0,
    definition: createListDefinition(type),
    dependencies: [],
    testStatus: "untested",
    testedAt: "",
    versions: [],
  };
}
