import type { ApiResponse, GetOntologyEntityRowDetailData } from "@/types";

/** 实体属性行详情接口成功响应样例（最小可展示 VO）。 */
export const getOntologyEntityRowDetailMock: ApiResponse<GetOntologyEntityRowDetailData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {
    primaryKey: "1",
    ontologyUniqueIdentifier: "ea512d439cd34c6ebbcde6b692261ab5",
    propertyGroups: [
      {
        storageGroup: "engine",
        groupDataList: [
          {
            dataPrimaryKey: "100",
            props: [
              {
                propertyUniqIdentifier: "e0791fc07cbe4a85b2c9f974b88954a3",
                propertyApiName: "e_thrust",
                propertyDisplayName: "加力推力",
                propertyValue: 1,
                categoryId: 1,
                metadata: null,
              },
              {
                propertyUniqIdentifier: "e0791fc07cbe4a85b2c9f974b88954a4",
                propertyApiName: "e_count",
                propertyDisplayName: "装机数量",
                propertyValue: 2,
                categoryId: 1,
                metadata: null,
              },
            ],
          },
        ],
      },
    ],
  },
};
