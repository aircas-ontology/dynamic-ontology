/**
 * @description 读取运行时 `DOMAIN_CONFIG.SHOW_STANDARD_CONTENT`。未配置或为 true 时展示标准相关内容，仅显式 false 时隐藏。
 * @param config 运行时域名配置，默认读取全局 DOMAIN_CONFIG。
 * @returns 是否展示韧性标准应用数、属性填充率与标准应用情况。
 */
export function isStandardContentVisible(config: Pick<DomainConfig, "SHOW_STANDARD_CONTENT"> = DOMAIN_CONFIG): boolean {
  return config.SHOW_STANDARD_CONTENT !== false;
}
