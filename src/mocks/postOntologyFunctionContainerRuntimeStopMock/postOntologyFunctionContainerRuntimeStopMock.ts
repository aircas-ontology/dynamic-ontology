import type { ApiResponse, PostOntologyFunctionContainerRuntimeStopData } from "@/types";

/** 停止容器运行实例成功样例。 */
export const postOntologyFunctionContainerRuntimeStopMock: ApiResponse<PostOntologyFunctionContainerRuntimeStopData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: {
    containerKey: "e7b65c92b0a24e17bf42c7f0b8c5ed5b",
    ontologySpaceId: 1,
    displayName: "rongqi",
    containerName: "httpbin-ctr-18080",
    phase: "STOPPED",
    phaseLabel: "已停止",
    hostPort: 18080,
    containerPort: 8080,
    nodeIp: "172.16.18.58",
    nodePort: 37002,
    lastAction: "stop",
    lastActionAt: "2026-10-23T08:00:00.000+00:00",
    message: "容器已停止并移除",
  },
};
