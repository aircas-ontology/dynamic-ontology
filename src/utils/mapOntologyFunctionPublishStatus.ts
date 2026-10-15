import type { FunctionOperatorStatus } from "@/types";

/**
 * @description 将接口 publishStatus 映射为页面状态；仅识别 0 未发布与 1 已发布。
 * @param publishStatus 接口发布状态码。
 * @returns 页面状态，无法识别时为空串。
 */
export function mapOntologyFunctionPublishStatus(publishStatus: number | undefined): FunctionOperatorStatus {
  if (publishStatus === 1) {
    return "published";
  }
  if (publishStatus === 0) {
    return "draft";
  }
  return "";
}
