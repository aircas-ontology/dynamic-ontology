import type { ApiResponse, LoginData } from "@/types";

export const loginMock: ApiResponse<LoginData> = {
  code: 200,
  message: "登录成功",
  success: true,
  data: {},
};
