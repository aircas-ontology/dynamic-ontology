/** 行为列表查询参数。 */
export interface ListOntologyActionParams {
  /** 本体空间 id（必填）。 */
  ontologySpaceId: number;
  /** 行为分类 id；不传则查全空间。 */
  categoryId?: number;
  /** 关键词：行为名称、算子 api、描述。 */
  keyword?: string;
  /** 状态：1 启用，0 失效。 */
  status?: number;
  /** 页码，默认 1。 */
  pageNum?: number;
  /** 每页条数，默认 10。 */
  pageSize?: number;
}

/** 行为列表单条记录。 */
export interface ListOntologyActionRecord {
  id: number;
  actionApi: string;
  displayName: string;
  description: string;
  ontologyUniqIdentifier: string;
  categoryId: number;
  /** 1 启用，0 失效。 */
  status: number;
  /** 更新时间；缺失时列表展示为 `-`。 */
  updateTime?: string | null;
  actionKind: string;
  subjectType: string;
  operation: string;
  storageGroup: string;
  functionApi: string | null;
  functionDescription: string | null;
  outputMode: string | null;
}

/** 行为列表分页数据。 */
export interface ListOntologyActionData {
  records: ListOntologyActionRecord[];
  total: number;
  size: number;
  current: number;
  pages: number;
}
