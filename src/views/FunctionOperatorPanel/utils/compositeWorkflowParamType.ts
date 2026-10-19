/**
 * @description 将详情/配置中的参数类型规范化为可比较的小写规范名。
 * @param rawType 原始类型字符串。
 * @returns 规范化类型；空输入返回空串。
 */
export function normalizeCompositeWorkflowParamType(rawType: string): string {
  const key = rawType.trim().toLowerCase();
  if (!key) {
    return "";
  }
  if (key === "string" || key === "str") {
    return "string";
  }
  if (key === "number" || key === "int" || key === "float" || key === "double" || key === "long") {
    return "number";
  }
  if (key === "boolean" || key === "bool") {
    return "boolean";
  }
  if (key === "object" || key === "json" || key === "map") {
    return "object";
  }
  if (key === "array" || key === "list") {
    return "array";
  }
  return key;
}

/**
 * @description 判断两个参数类型在规范化后是否兼容（P0：全等；任一方未知则视为可警告通过）。
 * @param upstreamType 上游输出类型。
 * @param downstreamType 下游入参类型。
 * @returns compatible 是否通过；unknown 是否因未知类型仅警告。
 */
export function compareCompositeWorkflowParamTypes(upstreamType: string, downstreamType: string): { compatible: boolean; unknown: boolean } {
  const left = normalizeCompositeWorkflowParamType(upstreamType);
  const right = normalizeCompositeWorkflowParamType(downstreamType);
  if (!left || !right) {
    return { compatible: true, unknown: true };
  }
  return { compatible: left === right, unknown: false };
}
