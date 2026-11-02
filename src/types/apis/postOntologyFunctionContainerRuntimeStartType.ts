import type { OntologyFunctionContainerRuntimeItem } from "./getOntologyFunctionContainerRuntimeListType";

/** 启动容器运行实例的请求参数（query）。 */
export interface PostOntologyFunctionContainerRuntimeStartParams {
  /** 容器实例归组键。 */
  containerKey: string;
}

/** 启动容器运行实例的响应 data（更新后的实例）。 */
export type PostOntologyFunctionContainerRuntimeStartData = OntologyFunctionContainerRuntimeItem;
