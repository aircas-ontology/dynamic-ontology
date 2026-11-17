/** 单实例全部关联关系查询参数。 */
export interface PostOntologyEntityLinksParams {
  /** 对象唯一标识；OpenAPI 未标记必填，详情页始终传入。 */
  ontologyUniqueIdentifier?: string;
  /** 原始实体主键；OpenAPI 未限制 JSON 类型。 */
  entityPrimaryKey: unknown;
}

/** 关联关系可见时间窗口。 */
export interface OntologyEntityLinkVisibilityWindow {
  /** OpenAPI 声明 date-time，但示例是毫秒时间戳字符串，前端保留原值。 */
  startTime?: string;
  endTime?: string;
}

/** 单实例查询返回的一条有向实体关系。 */
export interface OntologyEntityLinkItem {
  linkName?: string;
  linkType?: "COMPOSITION" | "RECONNAISSANCE" | "STRIKE" | "COORDINATION" | "OTHER" | "POSSESSION" | "ATTRIBUTION";
  ontologyFrom?: string;
  ontologyTo?: string;
  entityPrimaryKeyFrom?: unknown;
  entityPrimaryKeyTo?: unknown;
  entityNodeFrom?: string;
  displayNameFrom?: string;
  entityNodeTo?: string;
  displayNameTo?: string;
  startTime?: string;
  endTime?: string;
  visibilityWindows?: OntologyEntityLinkVisibilityWindow[];
  status?: "ENABLE" | "DISABLE" | "DELETE";
}

/** 标准响应中的关系数组；null 按空数据兼容。 */
export type PostOntologyEntityLinksData = OntologyEntityLinkItem[] | null;
