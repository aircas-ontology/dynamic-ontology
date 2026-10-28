import type { ApiResponse, UploadOntologyFunctionContainerDocData } from "@/types";

/** 上传容器算子接口文档成功样例。 */
export const uploadOntologyFunctionContainerDocMock: ApiResponse<UploadOntologyFunctionContainerDocData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {
    fileName: "httpbin.json",
    path: "/app/interface-docs/2beea9a6-4fc6-496e-a005-e8b9697b68c1-httpbin.json",
    format: "openapi3",
  },
};
