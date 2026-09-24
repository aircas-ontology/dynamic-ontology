import type { ApiResponse, UpdateOntologyFunctionData } from "@/types";

/** 修改函数算子成功响应样例（与契约输出样例一致，无业务 data）。 */
export const updateOntologyFunctionMock: ApiResponse<UpdateOntologyFunctionData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: null,
};
