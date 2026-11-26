/** 查询多个对象公共字段的请求体。 */
export interface PostOntologyActionBasicFunctionCommonPropertiesParams {
  /** 对象空间 id；传入时会核对所选对象都属于该空间。 */
  ontologySpaceId?: number;
  /** 对象唯一标识列表；至少一个，单对象也允许。 */
  ontologyIdentifiers: string[];
}

/** 公共字段中的单个属性。 */
export interface PostOntologyActionBasicFunctionCommonProperty {
  /** 属性 apiName，配置时回传该值。 */
  apiName: string;
  /** 属性数据类型，如 String / Double / Timestamp。 */
  propertyType: string;
  /** 是否主键，按第一个对象取值。 */
  isPrimaryKey: boolean;
  /** 是否名称键，按第一个对象取值。 */
  isTitleKey: boolean;
  /** 各对象上该属性的展示名，与请求 ontologyIdentifiers 同序。 */
  displayNames: string[];
}

/** 查询多个对象公共字段的响应 data。 */
export interface PostOntologyActionBasicFunctionCommonPropertiesData {
  /** 参与取交集的对象 id，与请求顺序一致。 */
  ontologyIdentifiers: string[];
  /** 对象名称，与 ontologyIdentifiers 同序；名称为空时用对象 id 占位。 */
  ontologyNames: string[];
  /** 公共字段，按第一个对象的属性顺序排列。 */
  properties: PostOntologyActionBasicFunctionCommonProperty[];
}
