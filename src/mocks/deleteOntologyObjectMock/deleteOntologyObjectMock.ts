import type { ApiResponse, DeleteOntologyObjectData } from "@/types";

/** 删除本体对象成功响应样例。 */
export const deleteOntologyObjectMock: ApiResponse<DeleteOntologyObjectData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {},
};
