/** 查询函数列表请求参数。 */
export interface GetOntologyFunctionListParams {
  /** 页码，从 1 开始，默认 1。 */
  pageNum?: number;
  /** 每页条数，默认 10。 */
  pageSize?: number;
  /** 对象空间 id（必填）。 */
  ontologySpaceId: number;
  /** 函数名称（模糊搜索）。 */
  displayName?: string;
  /** 函数类型：CUSTOMIZE / EXTERNAL / BASIC_QUERY / COMPOSITE。 */
  type?: string;
  /** 发布状态：0 未发布，1 已发布。 */
  publishStatus?: number;
  /** 创建开始日期，格式 yyyy-MM-dd。 */
  startDate?: string;
  /** 创建结束日期，格式 yyyy-MM-dd。 */
  endDate?: string;
}

/** 查询函数列表单条记录。 */
export interface GetOntologyFunctionListItem {
  functionApi: string;
  displayName: string;
  description: string;
  type: string;
  /** 更新时间（ISO 字符串）。 */
  updateTime: string;
  /** 发布状态：0 未发布，1 已发布。 */
  publishStatus: number;
  /** 版本号，格式 x.y.z。 */
  version: string;
}

/** 查询函数列表分页数据。 */
export interface GetOntologyFunctionListData {
  records: GetOntologyFunctionListItem[];
  total: number;
  size: number;
  current: number;
  pages: number;
}
