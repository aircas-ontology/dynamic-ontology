import type { ApiResponse, GetOntologyFunctionContainerRuntimeListData } from "@/types";

/** 列出容器运行实例成功样例。 */
export const getOntologyFunctionContainerRuntimeListMock: ApiResponse<GetOntologyFunctionContainerRuntimeListData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: [
    {
      containerKey: "e7b65c92b0a24e17bf42c7f0b8c5ed5b",
      ontologySpaceId: 1,
      displayName: "rongqi",
      containerName: "httpbin-ctr-18080",
      phase: "CREATED",
      phaseLabel: "已创建",
      hostPort: 18080,
      containerPort: 8080,
      message: "容器算子已创建，尚未启动",
    },
  ],
};
