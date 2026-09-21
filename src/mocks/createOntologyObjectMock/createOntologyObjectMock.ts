import type { ApiResponse, CreateOntologyObjectData } from "@/types";

/** 创建本体对象成功响应样例。 */
export const createOntologyObjectMock: ApiResponse<CreateOntologyObjectData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {
    uniqueIdentifier: "ae6cca59ced9432189da4af315554957",
  },
};
