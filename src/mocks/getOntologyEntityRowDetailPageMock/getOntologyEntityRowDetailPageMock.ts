import type { ApiResponse, GetOntologyEntityRowDetailPageData } from "@/types";

/** 实体属性行分页接口成功响应样例（对齐真实字段）。 */
export const getOntologyEntityRowDetailPageMock: ApiResponse<GetOntologyEntityRowDetailPageData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {
    records: [
      {
        dataPrimaryKey: 101,
        props: [
          {
            propertyUniqIdentifier: "e0791fc07cbe4a85b2c9f974b88954a3",
            propertyApiName: "weapon_name",
            propertyDisplayName: "武器名称",
            propertyValue: "AIM-9X",
            categoryId: 709,
          },
        ],
      },
    ],
    total: 1,
    size: 10,
    current: 1,
    pages: 1,
  },
};
