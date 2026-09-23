import type { ApiResponse, GetOntologyMetaStatisticData } from "@/types";

/** 本体对象资源统计成功响应样例。 */
export const getOntologyMetaStatisticMock: ApiResponse<GetOntologyMetaStatisticData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {
    uniqueIdentifier: "d3e1b0c27f29452eb7cadd1f51eac535",
    entityCount: 16,
    propertyCount: 9,
    relationCount: 4,
    actionCount: 2,
  },
};
