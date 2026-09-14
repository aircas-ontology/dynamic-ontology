export interface ExampleParams {
  /** 可选的示例数据名称查询关键词。 */
  keyword?: string;
  /** 当前页码，从 1 开始。 */
  page: number;
  /** 每页返回的数据条数。 */
  pageSize: number;
}

export interface ExampleItem {
  /** 示例数据的唯一标识。 */
  id: string;
  /** 示例数据名称。 */
  name: string;
}

export interface ExampleData {
  /** 当前页的示例数据列表。 */
  items: ExampleItem[];
  /** 符合查询条件的示例数据总数。 */
  total: number;
}
