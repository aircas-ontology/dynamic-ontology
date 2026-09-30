/** 批量导入创建本体对象的请求参数。 */
export interface ImportOntologiesParams {
  /** 导入文件，必填。文档类型为 string / binary，未提供字段说明。 */
  file: File;
}

/** 批量导入创建本体对象的响应 data。在线 schema 为空，未声明具体字段。 */
export type ImportOntologiesData = Record<string, unknown>;
