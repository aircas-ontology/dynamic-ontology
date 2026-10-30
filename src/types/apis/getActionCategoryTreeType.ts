export interface GetActionCategoryTreeParams {
  spaceId: number;
}

export interface ActionCategoryVO {
  id?: number;
  name?: string;
  categoryId?: number;
  categoryName?: string;
  children?: ActionCategoryVO[];
  items?: ActionCategoryVO | ActionCategoryVO[];
}
