import type { ApiResponse, LoginData, LoginParams } from "@/types";
import { postLoginInterface } from "@/apis";
import { LOGIN_MOCK_TOKEN, loginMock } from "@/mocks/loginMock/loginMock";
import { saveLoginToken } from "@/utils/authToken";

/**
 * @description 登录页提交命令：优先请求真实登录接口；仅在传输失败（网络不可达、超时、HTTP 错误）时临时回退模拟登录，
 * 写入离线模拟令牌并返回成功响应，保证服务中断期间可进入系统。业务拒绝（HTTP 正常但 code 非 200）不回退，由调用方按错误消息提示。
 * @returns 提交登录命令，入参为用户名密码，返回标准登录响应。
 */
export function useLoginCommand() {
  async function submitLogin(params: LoginParams): Promise<ApiResponse<LoginData>> {
    try {
      return await postLoginInterface(params);
    } catch {
      saveLoginToken(LOGIN_MOCK_TOKEN);
      return structuredClone(loginMock);
    }
  }

  return { submitLogin };
}
