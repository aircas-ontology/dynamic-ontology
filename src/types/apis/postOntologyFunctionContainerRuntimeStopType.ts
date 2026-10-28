import type { OntologyFunctionContainerRuntimeItem } from "./getOntologyFunctionContainerRuntimeListType";

/** 停止容器运行实例的请求参数（query）。 */
export interface PostOntologyFunctionContainerRuntimeStopParams {
  /** 容器实例归组键。 */
  containerKey: string;
}

/** 停止容器运行实例的响应 data（更新后的实例）。 */
export type PostOntologyFunctionContainerRuntimeStopData = OntologyFunctionContainerRuntimeItem;
