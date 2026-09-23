/** 导出本体空间的查询参数。 */
export interface ExportOntologySpaceParams {
  /** 本体空间 id，必填。 */
  spaceId: number;
}

/** 导出接口的文件响应。在线文档未声明 JSON 结构，成功结果按文件字节读取。 */
export interface ExportOntologySpaceFile {
  /** 响应体文件内容。 */
  blob: Blob;
  /** Content-Disposition 原文；响应头缺失时为空字符串。 */
  contentDisposition: string;
  /** Content-Type 原文；响应头缺失时为空字符串。 */
  contentType: string;
}
