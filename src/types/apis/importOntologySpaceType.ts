/** 导入创建本体空间的请求参数。 */
export interface ImportOntologySpaceParams {
  /** 导入文件，必填。文档类型为 string / binary，未提供字段说明。 */
  file: File;
}

/** 导入创建本体空间的响应 data。元素含义文档未说明。 */
export type ImportOntologySpaceData = string[];
