import type { ApiResponse, GetOntologyOverviewCountData } from "@/types";

/** 本体概览统计成功响应样例。 */
export const getOntologyOverviewCountMock: ApiResponse<GetOntologyOverviewCountData> = {
  code: 0,
  message: "",
  success: true,
  data: {
    spaceCount: 0,
    ontologyCount: 0,
    groupCount: 0,
    actionSchedulingCount: 0,
    actionCount: 0,
    functionCount: 0,
    propertyCount: 0,
    linkCount: 0,
  },
};
