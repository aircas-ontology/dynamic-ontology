/** 画布中的对象属性。 */
export interface CanvasProperty {
  displayName: string;
  apiName: string;
  dataType?: string;
  /** 属性所属存储分组。 */
  storageGroup?: string;
  description?: string;
  isPrimaryKey?: boolean;
  isTitleKey?: boolean;
  defaultValue?: string;
}

/** 画布中的对象。 */
export interface CanvasOntology {
  displayName: string;
  apiName: string;
  description?: string;
  iconUrl?: string;
  properties?: CanvasProperty[];
}

/** 画布中的对象关系。 */
export interface CanvasLink {
  name: string;
  apiName?: string;
  description?: string;
  fromOntologyApiName: string;
  toOntologyApiName: string;
}

/** 画布保存或创建对象空间请求参数。 */
export interface CreateOntologySpaceWithCanvasContentParams {
  /** 已有对象空间 id；传入后直接向该空间写入画布内容。 */
  spaceId?: number;
  /** 新建对象空间时使用的显示名称。 */
  displayName?: string;
  /** 新建对象空间时使用的 API 名称。 */
  apiName?: string;
  description?: string;
  ontologies?: CanvasOntology[];
  links?: CanvasLink[];
}

/** 画布一键创建对象空间响应数据。 */
export interface CreateOntologySpaceWithCanvasContentData {
  spaceId?: number;
}
