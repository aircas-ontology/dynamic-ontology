/** 修改行为分类请求参数。 */
export interface UpdateActionCategoryParams {
  /** 本体空间 id。 */
  spaceId: number;
  /** 行为分类 id。 */
  categoryId: number;
  /** 行为分类名称。 */
  name: string;
  /** 父节点 id；不传表示不修改父节点；根下为 0。 */
  parentId?: number;
}
