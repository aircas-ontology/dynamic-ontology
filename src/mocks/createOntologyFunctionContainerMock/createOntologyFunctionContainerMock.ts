import type { ApiResponse, CreateOntologyFunctionContainerData } from "@/types";

/** 创建容器算子成功样例。 */
export const createOntologyFunctionContainerMock: ApiResponse<CreateOntologyFunctionContainerData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: ["httpbin_GET_get", "httpbin_POST_post"],
};
