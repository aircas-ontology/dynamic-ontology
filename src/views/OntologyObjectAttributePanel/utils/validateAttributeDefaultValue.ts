/**
 * @description 校验可选默认值是否符合属性类型，整数检查存储范围，日期检查真实日历日期。
 * @param dataType 属性类型。
 * @param source 默认值文本。
 * @returns 错误文案；通过时为空字符串。
 */
export function validateAttributeDefaultValue(dataType: string, source: string): string {
  const value = source.trim();
  if (!value || dataType === "String") return "";
  const invalid = `默认值不符合 ${dataType} 类型`;
  const bounds: Record<string, [bigint, bigint]> = {
    Byte: [-128n, 127n],
    Short: [-32768n, 32767n],
    Int: [-2147483648n, 2147483647n],
    Long: [-9223372036854775808n, 9223372036854775807n],
  };
  if (bounds[dataType]) {
    if (!/^[+-]?\d+$/.test(value)) return invalid;
    const parsed = BigInt(value);
    const [min, max] = bounds[dataType];
    return parsed >= min && parsed <= max ? "" : invalid;
  }
  if (dataType === "Boolean") return /^(true|false)$/.test(value) ? "" : invalid;
  if (dataType === "Array") {
    try {
      return Array.isArray(JSON.parse(value)) ? "" : invalid;
    } catch {
      return invalid;
    }
  }
  if (dataType === "Date") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return invalid;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? "" : invalid;
  }
  if (dataType === "Timestamp") return /^[+-]?\d+$/.test(value) && Number.isSafeInteger(Number(value)) ? "" : invalid;
  if (["Float", "Double", "Decimal"].includes(dataType))
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value) &&
      Number.isFinite(Number(value)) &&
      (dataType !== "Float" || Math.abs(Number(value)) <= 3.4028234663852886e38)
      ? ""
      : invalid;
  return invalid;
}
