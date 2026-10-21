/** 探查容器算子接口文档的请求参数。 */
export interface ProbeOntologyFunctionContainerInterfacesParams {
  /** 上传接口文档返回的存储路径。 */
  docPath: string;
}

/** 探查得到的单个接口入参或出参字段。 */
export interface ProbeOntologyFunctionContainerInterfaceParameter {
  /** 参数名。 */
  name: string;
  /** 参数位置（如 query / body）。 */
  in: string;
  /** 是否必填。 */
  required: boolean;
  /** 参数类型。 */
  type: string;
  /** 参数说明。 */
  description: string;
}

/** 探查得到的单个接口项。 */
export interface ProbeOntologyFunctionContainerInterfaceItem {
  /** 接口名称。 */
  name: string;
  /** 接口标识（如 GET /get）。 */
  api: string;
  /** 请求方式。 */
  method: string;
  /** 请求路径。 */
  path: string;
  /** 接口说明。 */
  description: string;
  /** 入参列表。 */
  inputParameters: ProbeOntologyFunctionContainerInterfaceParameter[];
  /** 出参列表。 */
  outputParameters: ProbeOntologyFunctionContainerInterfaceParameter[];
}

/** 探查容器算子接口文档的响应 data。 */
export type ProbeOntologyFunctionContainerInterfacesData = ProbeOntologyFunctionContainerInterfaceItem[];
