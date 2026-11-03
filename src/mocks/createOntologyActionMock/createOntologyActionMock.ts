import type { ApiResponse, CreateOntologyActionData } from "@/types";

/** 创建行为接口成功响应样例（与 createActionApi 文档一致）。 */
export const createOntologyActionMock: ApiResponse<CreateOntologyActionData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: null,
};
