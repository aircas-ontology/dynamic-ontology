/** 导出单个本体的查询参数。 */
export interface ExportOntologyParams {
  /** 本体唯一标识，必填。文档未提供字段说明。 */
  uniqueIdentifier: string;
}

/** 导出接口的文件响应。在线文档未声明 JSON 结构，成功结果按文件字节读取。 */
export interface ExportOntologyFile {
  /** 响应体文件内容。 */
  blob: Blob;
  /** Content-Disposition 原文；响应头缺失时为空字符串。 */
  contentDisposition: string;
  /** Content-Type 原文；响应头缺失时为空字符串。 */
  contentType: string;
}
