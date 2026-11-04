export interface GetActionCategoryTreeParams {
  spaceId: number;
}

/** 行为分类树节点上挂载的行为摘要。 */
export interface ActionCategoryActionInfo {
  ontologyUniqIdentifier?: string;
  actionApi: string;
  description?: string;
  displayName: string;
}

export interface ActionCategoryVO {
  id?: number;
  name?: string;
  categoryId?: number;
  categoryName?: string;
  children?: ActionCategoryVO[];
  /** 历史兼容：偶发作为子分类容器。 */
  items?: ActionCategoryVO | ActionCategoryVO[];
  /** 当前分类下的行为列表。 */
  actionInfos?: ActionCategoryActionInfo[];
}
