/** 容器运行实例状态枚举。 */
export type OntologyFunctionContainerRuntimePhase = "CREATED" | "RUNNING" | "STOPPING" | "STOPPED" | "RESTARTING" | "FAILED";

/** 列出容器运行实例的请求参数。 */
export interface GetOntologyFunctionContainerRuntimeListParams {
  /** 空间 id；为空则列全部（契约字段仍为必填整型，页面传当前空间）。 */
  spaceId: number;
}

/** 单个容器算子运行实例。 */
export interface OntologyFunctionContainerRuntimeItem {
  /** 容器实例归组键（启停操作使用）。 */
  containerKey: string;
  /** 所属本体空间 id。 */
  ontologySpaceId: number;
  /** 容器算子展示名。 */
  displayName: string;
  /** docker 容器名。 */
  containerName: string;
  /** 运行状态枚举名。 */
  phase: OntologyFunctionContainerRuntimePhase;
  /** 运行状态中文标签。 */
  phaseLabel: string;
  /** 宿主映射端口。 */
  hostPort: number;
  /** 容器端口。 */
  containerPort: number;
  /** 容器宿主机 IP。 */
  nodeIp: string;
  /** 容器宿主机端口。 */
  nodePort: number;
  /** docker 容器 id；部分环境可能未返回。 */
  containerId?: string;
  /** 最近操作名（如 start / stop）。 */
  lastAction?: string;
  /** 最近操作时间（ISO 字符串）。 */
  lastActionAt?: string;
  /** 状态描述或失败原因。 */
  message: string;
}

/** 列出容器运行实例的响应 data。 */
export type GetOntologyFunctionContainerRuntimeListData = OntologyFunctionContainerRuntimeItem[];
