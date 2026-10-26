import type { ProbeOntologyFunctionContainerInterfaceItem } from "./probeOntologyFunctionContainerInterfacesType";
import type { UploadOntologyFunctionContainerDocData } from "./uploadOntologyFunctionContainerDocType";
import type { UploadOntologyFunctionContainerImageData } from "./uploadOntologyFunctionContainerImageType";

/** 创建容器算子的函数模型；契约恒为 CONTAINER。 */
export type CreateOntologyFunctionContainerType = "CONTAINER";

/** 创建容器算子请求体中的 containerConfig。 */
export interface CreateOntologyFunctionContainerConfig {
  /** 上传镜像接口返回的镜像信息。 */
  image: UploadOntologyFunctionContainerImageData;
  /** 上传接口文档返回的文档信息。 */
  interfaceDoc?: UploadOntologyFunctionContainerDocData;
  /** 完整 docker run 启动命令（须含显式端口映射）。 */
  runCommand: string;
  /** 探查并勾选的接口列表（非空）。 */
  selectedInterfaces: ProbeOntologyFunctionContainerInterfaceItem[];
}

/** 创建容器算子的请求参数。 */
export interface CreateOntologyFunctionContainerParams {
  /** 算子基础 api；真实 api 由服务端按勾选接口派生。 */
  functionApi: string;
  /** 版本号；容器算子恒为 1.0.0。 */
  version: string;
  /** 名称公共前缀。 */
  displayName: string;
  /** 描述公共前缀。 */
  description?: string;
  /** 函数模型；容器算子恒为 CONTAINER。 */
  type: CreateOntologyFunctionContainerType;
  /** 所属本体空间 id。 */
  ontologySpaceId?: number;
  /** 容器算子配置（镜像、文档、启动命令、勾选接口）。 */
  containerConfig: CreateOntologyFunctionContainerConfig;
  /** 限流配置模板 ID；不传则使用默认模板，创建后不可修改。 */
  rateLimitTemplateId?: number;
}

/** 创建容器算子成功后的响应 data：派生后的算子 api 列表。 */
export type CreateOntologyFunctionContainerData = string[];
