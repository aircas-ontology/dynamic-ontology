import type { ApiResponse, LoginData, LoginParams } from "@/types";
import { postLoginInterface } from "@/apis";

/**
 * @description 登录页提交命令：请求真实登录接口并返回标准响应；传输失败或业务失败由调用方提示，不回退 Mock。
 * @returns 提交登录命令，入参为用户名密码，返回标准登录响应。
 */
export function useLoginCommand() {
  /**
   * @description 提交登录请求。
   * @param params 用户名与密码。
   * @returns 登录接口标准响应。
   */
  async function submitLogin(params: LoginParams): Promise<ApiResponse<LoginData>> {
    return postLoginInterface(params);
  }

  return { submitLogin };
}
