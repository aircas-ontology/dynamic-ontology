import type { ApiResponse, GetOntologyFunctionListData } from "@/types";

/** 查询函数列表成功响应样例（与契约输出样例一致）。 */
export const getOntologyFunctionListMock: ApiResponse<GetOntologyFunctionListData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {
    records: [
      {
        functionApi: "test",
        displayName: "测试函数",
        description: "测试函数说明",
        type: "BASIC_QUERY",
        updateTime: "2026-09-24T03:35:18.692+00:00",
      },
      {
        functionApi: "addTwoNumbers",
        displayName: "两数相加",
        description: "测试用：返回 a+b",
        type: "CUSTOMIZE",
        updateTime: "2026-09-24T03:35:18.692+00:00",
      },
    ],
    total: 2,
    size: 10,
    current: 1,
    pages: 1,
  },
};
