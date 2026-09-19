import type { OntologySpaceItem, OntologySpaceListData, OntologySpaceListItem } from "@/types";

/** 将列表接口单条记录映射为页面本体空间模型。 */
export function mapOntologySpaceListItem(item: OntologySpaceListItem): OntologySpaceItem {
  return {
    id: String(item.spaceId),
    apiName: item.apiName,
    displayName: item.displayName,
    description: item.description,
    iconUrl: item.iconUrl,
    category: "",
    metrics: {
      ontology: item.ontologyCount,
      behavior: item.actionCount,
      relation: item.linkCount,
      rule: item.propertyCount,
      source: 0,
    },
    createdTime: "",
    updatedTime: "",
    isSubspace: false,
    parentSpaceDisplayName: "",
  };
}

/** 将列表接口 data 数组映射为页面本体空间数组。 */
export function mapOntologySpaceList(items: OntologySpaceListData): OntologySpaceItem[] {
  return items.map(mapOntologySpaceListItem);
}
