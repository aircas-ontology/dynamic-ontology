import type { ApiResponse, UpdateOntologyObjectData } from "@/types";

/** 修改本体对象成功响应样例。 */
export const updateOntologyObjectMock: ApiResponse<UpdateOntologyObjectData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {},
};
