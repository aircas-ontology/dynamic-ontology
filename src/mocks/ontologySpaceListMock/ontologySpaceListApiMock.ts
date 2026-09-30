import type { ApiResponse, OntologySpaceListData } from "@/types";

/** 本体空间列表接口成功响应样例（对齐契约正文）。 */
export const ontologySpaceListApiMock: ApiResponse<OntologySpaceListData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: [
    {
      iconUrl: "",
      displayName: "xxx战场",
      apiName: "space_a",
      description: "这是空间描述",
      spaceId: 1,
      ontologyCount: 2,
      actionCount: 0,
      propertyCount: 7,
      linkCount: 0,
      createTime: "2026-09-21 10:47:32",
      updateTime: "2026-09-21 10:47:32",
    },
  ],
};
