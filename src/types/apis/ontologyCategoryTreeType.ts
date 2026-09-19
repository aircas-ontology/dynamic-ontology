/** 查询本体分类体系树请求参数。 */
export interface OntologyCategoryTreeParams {
  spaceId: string;
}

/** 分类节点下挂载的本体元信息（契约样例字段）。 */
export interface OntologyCategoryMetaInfo {
  uniqueIdentifier: string;
  createTime: string;
  updateTime: string;
  latestQueryTime: string;
  displayName: string;
  description: string;
  apiName: string;
  metaGroupId: number[];
  spaceId: number;
  ontologyCategoryId: number;
  entityCount: number;
  relationCount: number;
  propertyCount: number;
  actionCount: number;
  icon?: string;
  parentOntologyUniqueIdentifier?: string;
  parentOntologyDisplayName?: string;
}

/** 本体分类体系树节点；叶子可仅含 categoryId。 */
export interface OntologyCategoryTreeNode {
  categoryId: number;
  name?: string;
  ontologyMetaInfos?: OntologyCategoryMetaInfo[];
  children?: OntologyCategoryTreeNode[];
}

/** 查询本体分类体系树响应 data：单根分类节点。 */
export type OntologyCategoryTreeData = OntologyCategoryTreeNode;

/** 创建本体分类体系树请求体。spaceId 与 parentId 均为数字，根分类 parentId 固定为 0。 */
export interface CreateOntologyCategoryTreeParams {
  spaceId: number;
  parentId: number;
  name: string;
}

/** 删除本体分类体系树请求体。spaceId 与 categoryId 均为数字。 */
export interface DeleteOntologyCategoryTreeParams {
  spaceId: number;
  categoryId: number;
}

/** 修改本体分类名称请求体。spaceId 与 categoryId 为数字，name 为新名称。 */
export interface UpdateOntologyCategoryNameParams {
  spaceId: number;
  categoryId: number;
  name: string;
}
