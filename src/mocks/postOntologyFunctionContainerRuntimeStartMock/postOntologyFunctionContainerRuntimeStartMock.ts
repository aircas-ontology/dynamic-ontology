import type { ApiResponse, PostOntologyFunctionContainerRuntimeStartData } from "@/types";

/** 启动容器运行实例成功样例。 */
export const postOntologyFunctionContainerRuntimeStartMock: ApiResponse<PostOntologyFunctionContainerRuntimeStartData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {
    containerKey: "e7b65c92b0a24e17bf42c7f0b8c5ed5b",
    ontologySpaceId: 1,
    displayName: "rongqi",
    containerName: "httpbin-ctr-18080",
    phase: "RUNNING",
    phaseLabel: "运行中",
    hostPort: 18080,
    containerPort: 8080,
    message: "容器已启动",
  },
};
