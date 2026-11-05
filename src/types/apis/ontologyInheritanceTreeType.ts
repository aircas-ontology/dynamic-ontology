/** 空间对象继承树查询参数。 */
export interface GetOntologyInheritanceTreeParams {
  spaceId: string;
}

/** 对象继承树节点。 */
export interface OntologyInheritanceTreeNode {
  uniqueIdentifier: string;
  displayName: string;
  parentUniqueIdentifier?: string;
  childNodes?: OntologyInheritanceTreeNode[];
}
