import type { ApiResponse, TestOntologyActionData } from "@/types";

/** 行为测试接口成功响应样例（与 testActionApi 文档完整样例一致）。 */
export const testOntologyActionMock: ApiResponse<TestOntologyActionData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: null,
};
