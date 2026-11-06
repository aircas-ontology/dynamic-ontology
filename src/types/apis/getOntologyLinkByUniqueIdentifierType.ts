/** 根据 link 唯一标识查询关系请求参数。 */
export interface GetOntologyLinkByUniqueIdentifierParams {
  /** 关系唯一标识。 */
  uniqueIdentifier: string;
}

/** 根据 link 唯一标识查询关系业务数据。 */
export interface GetOntologyLinkByUniqueIdentifierData {
  /** link 唯一标识。 */
  uniqueIdentifier: string;
  /** link 名称。 */
  name: string;
  /** 开始对象 unique identifier。 */
  ontologyUniqueIdentifierFrom: string;
  /** 开始对象名称。 */
  ontologyNameFrom: string;
  /** 结束对象 unique identifier。 */
  ontologyUniqueIdentifierTo: string;
  /** 结束对象名称。 */
  ontologyNameTo: string;
  /** 关系分类 id。 */
  categoryId: number;
  /** 关系 api 名称。 */
  apiName: string;
  /** 关系备注 / 描述。 */
  description: string;
}
