/**
 * @description 读取运行时 `DOMAIN_CONFIG.USE_MOCK`；为 true 时关系/行为等工作区走前端写死样例，不依赖 Mock HTTP 服务。
 * @returns 是否启用本地写死 Mock。
 */
export function isUseMockEnabled(): boolean {
  return DOMAIN_CONFIG.USE_MOCK === true;
}
