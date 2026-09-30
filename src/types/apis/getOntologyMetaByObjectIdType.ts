/** 根据本体对象 id 查询简要信息的请求参数。 */
export interface GetOntologyMetaByObjectIdParams {
  objectId: number;
}

/** 根据本体对象 id 查询简要信息的响应 data。 */
export interface GetOntologyMetaByObjectIdData {
  id: number;
  displayName: string;
  spaceName: string;
  uniqueIdentifier: string;
}
