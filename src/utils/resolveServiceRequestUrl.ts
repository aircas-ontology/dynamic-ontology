/** 服务请求 URL 改写所读取的运行时开关。 */
export interface ServiceRequestUrlConfig {
  /** 为 true 时将登录与本体管理请求改写到 Mock 主机。 */
  USE_MOCK?: boolean;
  /** Mock HTTP 服务地址。 */
  MOCK_SERVER_URL?: string;
  /** 真实登录服务 origin 或完整基址。 */
  LOGIN_URL?: string;
  /** 真实本体管理服务 origin 或完整基址。 */
  ONTOLOGYMANAGE_URL?: string;
}

/**
 * @description 解析可比较的 HTTP origin；相对路径或非法地址返回空字符串。
 * @param value 待解析地址。
 * @returns origin；无法解析时为空字符串。
 */
function readHttpOrigin(value: string | undefined): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "";
  }

  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

/**
 * @description 在 USE_MOCK 打开且 Mock 地址完整时，把登录与本体管理请求改写到 Mock 主机，保留 path、query 和 hash。
 * @param url 原始请求地址。
 * @param config 运行时开关与真实服务基址。
 * @returns 改写后的地址；开关关闭、配置不完整或非目标主机时返回原地址。
 */
export function resolveServiceRequestUrl(url: string, config: ServiceRequestUrlConfig): string {
  if (!config.USE_MOCK || typeof url !== "string" || url.length === 0) {
    return url;
  }

  const mockOrigin = readHttpOrigin(config.MOCK_SERVER_URL);
  if (!mockOrigin) {
    return url;
  }

  let requestUrl: URL;
  try {
    requestUrl = new URL(url);
  } catch {
    return url;
  }

  const rewriteOrigins = new Set([readHttpOrigin(config.LOGIN_URL), readHttpOrigin(config.ONTOLOGYMANAGE_URL)].filter((origin) => origin.length > 0));
  if (!rewriteOrigins.has(requestUrl.origin)) {
    return url;
  }

  return `${mockOrigin}${requestUrl.pathname}${requestUrl.search}${requestUrl.hash}`;
}
