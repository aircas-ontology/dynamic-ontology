import type { AxiosResponse } from "axios";

import type { ApiResponse, LoginData, LoginParams } from "@/types";
import { saveLoginToken } from "../utils/authToken.ts";
import { requestTimeoutMs } from "../utils/constants.ts";
import { requestFull } from "../utils/request.ts";

/**
 * @description 从登录响应头提取 access-token 值，兼容 axios 对响应头键名的小写归一化与原始大小写。
 * @param headers axios 响应头集合。
 * @returns 去除首尾空白的 access-token 值；缺失或为非字符串时返回 null。
 */
export function extractAccessTokenHeader(headers: AxiosResponse<LoginData>["headers"]): string | null {
  const rawHeader = headers["access-token"] ?? headers["Access-Token"];
  const normalizedHeader = typeof rawHeader === "string" ? rawHeader.trim() : "";
  return normalizedHeader.length > 0 ? normalizedHeader : null;
}

/**
 * @description 持久化登录响应头中的令牌；响应头缺失令牌时快速失败，通常是后端未配置 Access-Control-Expose-Headers。
 * @param headers axios 响应头集合。
 */
export function persistLoginToken(headers: AxiosResponse<LoginData>["headers"]): void {
  const accessToken = extractAccessTokenHeader(headers);
  if (!accessToken) {
    throw new Error("登录响应缺少令牌，请联系管理员检查接口响应头配置。");
  }
  saveLoginToken(accessToken);
}

/**
 * @description 登录系统：提交用户名密码，从登录响应头提取并保存令牌，返回标准响应体。
 *
 * 请求方式：POST `DOMAIN_CONFIG.LOGIN_URL` + `/ontology/user/login`
 *
 * 10 秒超时，超时或传输失败由调用方决定是否回退模拟登录。
 *
 * @param params 登录参数。
 * @param {string} params.username - 用户名
 * @param {string} params.password - 密码
 * @returns 标准 API 响应，`code` 为 200 时表示登录通过。
 */
export function postLoginInterface(params: LoginParams): Promise<ApiResponse<LoginData>> {
  return requestFull<LoginData>({
    url: DOMAIN_CONFIG.LOGIN_URL + "/ontology/user/login",
    method: "post",
    timeout: requestTimeoutMs,
    data: params,
  }).then(({ data, headers }) => {
    persistLoginToken(headers);
    return data;
  });
}
