/** 导出接口文档（HTML）的查询参数。 */
export interface ExportApiDocParams {
  /** 对象空间 id，必填。 */
  spaceId: number;
}

/** 导出接口文档的文件响应。契约按 HTML 文件流处理，不假定 JSON 包装。 */
export interface ExportApiDocFile {
  /** 响应体文件内容。 */
  blob: Blob;
  /** Content-Disposition 原文；响应头缺失时为空字符串。 */
  contentDisposition: string;
  /** Content-Type 原文；响应头缺失时为空字符串。 */
  contentType: string;
}
