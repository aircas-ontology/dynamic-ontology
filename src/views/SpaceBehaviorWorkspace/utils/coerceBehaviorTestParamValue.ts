/** 测试参数值转换成功结果。 */
export interface CoerceBehaviorTestParamValueSuccess {
  ok: true;
  value: string | number | boolean;
}

/** 测试参数值转换失败结果。 */
export interface CoerceBehaviorTestParamValueFailure {
  ok: false;
  error: string;
}

/** 测试参数值转换结果。 */
export type CoerceBehaviorTestParamValueResult = CoerceBehaviorTestParamValueSuccess | CoerceBehaviorTestParamValueFailure;

/**
 * @description 按属性类型将测试输入文案转换为后端 params 取值。
 * @param rawValue 输入框原始文案。
 * @param propertyType 属性类型（如 Double、Int、String）。
 * @param displayLabel 用于错误提示的展示名。
 * @returns 转换成功值或失败原因。
 */
export function coerceBehaviorTestParamValue(rawValue: string, propertyType: string, displayLabel: string): CoerceBehaviorTestParamValueResult {
  const label = displayLabel.trim() || "参数";
  const text = rawValue.trim();
  const normalizedType = propertyType.trim().toUpperCase();

  if (normalizedType === "BOOL" || normalizedType === "BOOLEAN") {
    const lower = text.toLowerCase();
    if (lower === "true" || lower === "1") return { ok: true, value: true };
    if (lower === "false" || lower === "0") return { ok: true, value: false };
    if (!text) return { ok: false, error: `「${label}」请输入布尔值（true/false）` };
    return { ok: false, error: `「${label}」不是有效的布尔值` };
  }

  if (normalizedType === "INT" || normalizedType === "INTEGER" || normalizedType === "LONG" || normalizedType === "SHORT" || normalizedType === "BYTE") {
    if (!text) return { ok: false, error: `「${label}」请输入整数` };
    if (!/^[+-]?\d+$/.test(text)) return { ok: false, error: `「${label}」不是有效的整数` };
    const parsed = Number(text);
    if (!Number.isSafeInteger(parsed)) return { ok: false, error: `「${label}」不是有效的整数` };
    return { ok: true, value: parsed };
  }

  if (normalizedType === "DOUBLE" || normalizedType === "FLOAT" || normalizedType === "NUMBER" || normalizedType === "DECIMAL") {
    if (!text) return { ok: false, error: `「${label}」请输入数值` };
    const parsed = Number(text);
    if (!Number.isFinite(parsed)) return { ok: false, error: `「${label}」不是有效的数值` };
    return { ok: true, value: parsed };
  }

  return { ok: true, value: text };
}
