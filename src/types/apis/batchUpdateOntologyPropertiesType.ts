/** 批量更新属性时使用的数据源信息。 */
export interface BatchUpdateOntologyPropertyDatasource {
  /** Schema 名称。 */
  schemaName: string;
  /** 数据源表名。 */
  datasourceId: string;
  /** 数据源列名。 */
  datasourceColumnName: string;
}

/** 批量更新中的单条属性信息。 */
export interface BatchUpdateOntologyPropertyItem {
  /** 属性唯一标识。 */
  uniqueIdentifier: string;
  /** 可选的属性数据源信息。 */
  datasource?: BatchUpdateOntologyPropertyDatasource;
  /** 属性名称。 */
  displayName: string;
  /** 数据类型。 */
  dataType: string;
  /** 是否为名称键。 */
  isTitleKey: boolean;
  /** 是否为主键。 */
  isPrimaryKey: boolean;
  /** 属性存储分组。 */
  storageGroup: string;
}

/** 批量更新本体属性的请求体。 */
export type BatchUpdateOntologyPropertiesParams = BatchUpdateOntologyPropertyItem[];

/** 批量更新本体属性的响应 data。 */
export type BatchUpdateOntologyPropertiesData = unknown;
