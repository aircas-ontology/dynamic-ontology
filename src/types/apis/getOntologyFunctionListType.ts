/** 查询函数列表请求参数。 */
export interface GetOntologyFunctionListParams {
  /** 页码，从 1 开始，默认 1。 */
  pageNum?: number;
  /** 每页条数，默认 10。 */
  pageSize?: number;
  /** 本体空间 id（必填）。 */
  ontologySpaceId: number;
}

/** 查询函数列表单条记录。 */
export interface GetOntologyFunctionListItem {
  functionApi: string;
  displayName: string;
  description: string;
  type: string;
  /** 更新时间（ISO 字符串）。 */
  updateTime: string;
}

/** 查询函数列表分页数据。 */
export interface GetOntologyFunctionListData {
  records: GetOntologyFunctionListItem[];
  total: number;
  size: number;
  current: number;
  pages: number;
}
