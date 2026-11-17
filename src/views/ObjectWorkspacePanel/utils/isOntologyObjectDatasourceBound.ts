/** 用于判定对象是否已关联数据源的属性片段。 */
export interface OntologyDatasourceBindProperty {
  datasourceId?: string | null;
}

/**
 * @description 根据属性详情判断对象是否已关联数据源。
 * @param properties 对象属性详情列表。
 * @returns 任一条属性存在非空 datasourceId 时返回 true。
 */
export function isOntologyObjectDatasourceBound(properties: readonly OntologyDatasourceBindProperty[]): boolean {
  return properties.some((property) => typeof property.datasourceId === "string" && property.datasourceId.trim().length > 0);
}
