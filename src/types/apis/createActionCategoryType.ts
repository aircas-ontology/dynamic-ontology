export interface CreateActionCategoryParams {
  spaceId: number;
  parentId: number;
  name: string;
}

export interface ActionCategoryNode {
  name: string;
  children?: ActionCategoryNode[];
  items?: ActionCategoryNode;
}
