/**
 * @description 校验 API 名称是否以字母或下划线开头，且仅包含字母、数字和下划线。
 * @param value 待校验名称。
 * @returns 名称符合格式时返回 true。
 */
export function validateApiName(value: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value.trim());
}
