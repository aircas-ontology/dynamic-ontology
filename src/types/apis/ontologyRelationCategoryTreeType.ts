/** 查询空间关系分类体系树请求参数。 */
export interface OntologyRelationCategoryTreeParams {
  spaceId: string;
}

/** 关系分类节点下挂载的关系链接（契约样例字段）。 */
export interface OntologyRelationCategoryLink {
  uniqueIdentifier: string;
  name: string;
  type: string;
  categoryId: number;
  ontologyUniqueIdentifierFrom: string;
  ontologyNameFrom: string;
  ontologyUniqueIdentifierTo: string;
  ontologyNameTo: string;
  ontologyIconFrom?: string;
  apiName?: string;
  description?: string;
}

/** 关系分类体系树节点；叶子可仅含 categoryId。 */
export interface OntologyRelationCategoryTreeNode {
  categoryId: number;
  name?: string;
  links?: OntologyRelationCategoryLink[];
  children?: OntologyRelationCategoryTreeNode[];
}

/** 查询空间关系分类体系树响应 data：单根分类节点。 */
export type OntologyRelationCategoryTreeData = OntologyRelationCategoryTreeNode;

/** 创建空间关系分类体系树请求体。spaceId 与 parentId 均为数字，根分类 parentId 固定为 0。 */
export interface CreateOntologyRelationCategoryTreeParams {
  spaceId: number;
  parentId: number;
  name: string;
}

/** 修改空间关系分类名称请求体。spaceId 与 categoryId 为数字，name 为新名称。 */
export interface UpdateOntologyRelationCategoryNameParams {
  spaceId: number;
  categoryId: number;
  name: string;
}

/** 删除空间关系分类请求体。spaceId 与 categoryId 均为数字。 */
export interface DeleteOntologyRelationCategoryTreeParams {
  spaceId: number;
  categoryId: number;
}
