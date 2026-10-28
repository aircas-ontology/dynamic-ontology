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
        createTime: "2026-10-12T17:56:02.614+00:00",
        updateTime: "2026-09-24T03:35:18.692+00:00",
        publishStatus: 1,
        version: "1.0.0",
      },
      {
        functionApi: "addTwoNumbers",
        displayName: "两数相加",
        description: "测试用：返回 a+b",
        type: "CUSTOMIZE",
        createTime: "2026-10-12T17:56:02.614+00:00",
        updateTime: "2026-09-24T03:35:18.692+00:00",
        publishStatus: 0,
        version: "0.1.0",
      },
    ],
    total: 2,
    size: 10,
    current: 1,
    pages: 1,
  },
};
