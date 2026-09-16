import type { ApiResponse, LoginData, LoginParams } from "@/types";
import { request } from "@/utils/request";

/**
 * 登录系统。
 *
 * 请求方式：POST `DOMAIN_CONFIG.LOGIN_URL` + `/ontology/user/login`
 *
 * @param params 登录参数，包含用户名和密码。
 * @returns 标准 API 响应，`code` 为 200 且 `message` 为“登录成功”时表示登录通过。
 */
export function postLoginInterface(
  params: LoginParams,
): Promise<ApiResponse<LoginData>> {
  return request<LoginData>({
    url: DOMAIN_CONFIG.LOGIN_URL + "/ontology/user/login",
    method: "post",
    data: params,
  });
}
