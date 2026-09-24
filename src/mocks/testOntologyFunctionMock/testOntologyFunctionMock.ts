import type { ApiResponse, TestOntologyFunctionData } from "@/types";

/** 算子函数测试成功样例（输出未知，data 暂为 null）。 */
export const testOntologyFunctionMock: ApiResponse<TestOntologyFunctionData> = {
  code: 200,
  message: "查询成功",
  success: true,
  data: null,
};
