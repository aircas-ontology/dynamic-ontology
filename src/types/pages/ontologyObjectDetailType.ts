/** 本体对象详情页 Tab 标识。 */
export type OntologyObjectDetailTab = "object" | "attribute" | "relation" | "behavior";

/** 本体对象详情页路由名称联合类型。 */
export type OntologyObjectDetailRouteName =
  "OntologyObjectDetailObject" | "OntologyObjectDetailAttribute" | "OntologyObjectDetailRelation" | "OntologyObjectDetailBehavior";

/** 属性分类树节点。 */
export interface OntologyAttributeCategoryNode {
  id: string;
  label: string;
  count: number;
  isRoot?: boolean;
  children?: OntologyAttributeCategoryNode[];
}

/** 属性列表项。 */
export interface OntologyAttributeItem {
  uniqueIdentifier: string;
  ontologyUniqueIdentifier: string;
  displayName: string;
  apiName: string;
  dataType: string;
  categoryId: string;
  storageGroup: string;
  defaultValue: string;
  description: string;
  isPrimary: boolean;
  isNameKey: boolean;
}

/** 属性新增/编辑表单草稿。 */
export interface OntologyAttributeDraft {
  displayName: string;
  apiName: string;
  categoryId: string;
  dataType: string;
  storageGroup: string;
  defaultValue: string;
  description: string;
  isPrimary: boolean;
  isNameKey: boolean;
}

/** 存储分组下拉选项。 */
export interface OntologyAttributeStorageGroupOption {
  label: string;
  value: string;
}
