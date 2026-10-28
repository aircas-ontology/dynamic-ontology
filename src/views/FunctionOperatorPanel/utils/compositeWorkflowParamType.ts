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
  if (key === "number" || key === "int" || key === "integer" || key === "float" || key === "double" || key === "long") {
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
 * @description 判断两个参数类型在规范化后是否兼容。
 * <p>与后端 {@code CompositeValidator.typeEquals} 对齐：任一侧为 object 表示"不限定具体类型"，
 * 按通配处理，否则 item/done 这类默认 object 的出口会被判成不兼容、绑定静默降级成空手填值。</p>
 * @param upstreamType 上游输出类型。
 * @param downstreamType 下游入参类型。
 * @returns compatible 是否通过；unknown 是否因未知或通配类型仅警告。
 */
export function compareCompositeWorkflowParamTypes(upstreamType: string, downstreamType: string): { compatible: boolean; unknown: boolean } {
  const left = normalizeCompositeWorkflowParamType(upstreamType);
  const right = normalizeCompositeWorkflowParamType(downstreamType);
  if (!left || !right) {
    return { compatible: true, unknown: true };
  }
  if (left === "object" || right === "object") {
    return { compatible: true, unknown: true };
  }
  return { compatible: left === right, unknown: false };
}
