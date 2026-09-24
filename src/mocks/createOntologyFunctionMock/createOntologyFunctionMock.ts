import type { ApiResponse, CreateOntologyFunctionData } from "@/types";

/** 创建函数算子成功响应样例（与契约输出样例一致，无业务 data）。 */
export const createOntologyFunctionMock: ApiResponse<CreateOntologyFunctionData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: null,
};
