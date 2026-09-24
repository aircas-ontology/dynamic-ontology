import type { ApiResponse, DeleteOntologyFunctionData } from "@/types";

/** 删除函数算子成功响应样例（与契约输出样例一致，无业务 data）。 */
export const deleteOntologyFunctionMock: ApiResponse<DeleteOntologyFunctionData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: null,
};
