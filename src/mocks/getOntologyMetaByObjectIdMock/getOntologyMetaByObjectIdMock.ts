import type { ApiResponse, GetOntologyMetaByObjectIdData } from "@/types";

/** 根据本体对象 id 查询简要信息成功样例（与契约输出样例一致）。 */
export const getOntologyMetaByObjectIdMock: ApiResponse<GetOntologyMetaByObjectIdData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {
    id: 106,
    displayName: "飞机",
    spaceName: "测试-rwl",
    uniqueIdentifier: "246ef68e87524c33911b92af900700f9",
  },
};
