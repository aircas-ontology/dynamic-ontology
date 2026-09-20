import type { ApiResponse, GetOntologyObjectArrTypeTreeData } from "@/types";

/** 本体对象属性分类树查询成功响应样例。 */
export const getOntologyObjectArrTypeTreeMock: ApiResponse<GetOntologyObjectArrTypeTreeData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {
    categoryId: 6,
    name: "全部",
    children: [
      {
        categoryId: 7,
        name: "qwe123",
      },
    ],
  },
};
