/** 上传容器算子接口文档的请求参数。 */
export interface UploadOntologyFunctionContainerDocParams {
  /** 接口文档文件（.json / .yaml / .yml）。 */
  file: File;
}

/** 上传容器算子接口文档成功后的响应 data。 */
export interface UploadOntologyFunctionContainerDocData {
  /** 原始文件名。 */
  fileName: string;
  /** 服务端存储路径，供探查接口使用。 */
  path: string;
  /** 文档格式标识（如 openapi3）。 */
  format: string;
}
