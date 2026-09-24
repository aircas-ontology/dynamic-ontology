/** 查询函数列表请求参数。 */
export interface GetOntologyFunctionListParams {
  pageNum?: number;
  pageSize?: number;
}

/** 查询函数列表单条记录。 */
export interface GetOntologyFunctionListItem {
  functionApi: string;
  displayName: string;
  description: string;
  type: string;
}

/** 查询函数列表分页数据。 */
export interface GetOntologyFunctionListData {
  records: GetOntologyFunctionListItem[];
  total: number;
  size: number;
  current: number;
  pages: number;
}
