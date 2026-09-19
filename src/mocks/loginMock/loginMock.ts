import type { ApiResponse, LoginData } from "@/types";

/** 离线模拟登录令牌；登录服务不可达期间回退使用，后端恢复后真实令牌自动替代。 */
export const LOGIN_MOCK_TOKEN = "Bearer mock-login-token";

export const loginMock: ApiResponse<LoginData> = {
  code: 200,
  message: "登录成功",
  success: true,
  data: {},
};
