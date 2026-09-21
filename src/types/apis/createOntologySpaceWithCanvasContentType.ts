/** 画布中的本体对象属性。 */
export interface CanvasProperty {
  displayName: string;
  apiName: string;
  dataType?: string;
  description?: string;
  isPrimaryKey?: boolean;
  isTitleKey?: boolean;
  defaultValue?: string;
}

/** 画布中的本体对象。 */
export interface CanvasOntology {
  displayName: string;
  apiName: string;
  description?: string;
  iconUrl?: string;
  properties?: CanvasProperty[];
}

/** 画布中的本体对象关系。 */
export interface CanvasLink {
  name: string;
  apiName?: string;
  description?: string;
  fromOntologyApiName: string;
  toOntologyApiName: string;
}

/** 画布一键创建本体空间请求参数。 */
export interface CreateOntologySpaceWithCanvasContentParams {
  displayName: string;
  apiName: string;
  iconUrl?: string;
  description?: string;
  ontologies?: CanvasOntology[];
  links?: CanvasLink[];
}

/** 画布一键创建本体空间响应数据。 */
export interface CreateOntologySpaceWithCanvasContentData {
  spaceId?: number;
}
