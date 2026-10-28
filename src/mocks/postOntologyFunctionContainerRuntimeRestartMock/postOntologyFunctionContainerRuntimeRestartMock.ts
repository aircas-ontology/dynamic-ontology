import type { ApiResponse, PostOntologyFunctionContainerRuntimeRestartData } from "@/types";

/** 重启容器运行实例成功样例。 */
export const postOntologyFunctionContainerRuntimeRestartMock: ApiResponse<PostOntologyFunctionContainerRuntimeRestartData> = {
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
    nodeIp: "172.16.18.58",
    nodePort: 37002,
    lastAction: "restart",
    lastActionAt: "2026-10-23T08:10:00.000+00:00",
    message: "容器已重启",
  },
};
