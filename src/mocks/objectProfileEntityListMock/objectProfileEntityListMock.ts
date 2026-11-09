import type { OntologyEntityInfo } from "@/types";

/** 实体画像列表本地写死样例（USE_MOCK / 内网无实体接口时使用）。 */
const OBJECT_PROFILE_ENTITY_LIST_SEED: OntologyEntityInfo[] = [
  {
    id: 1001,
    entityPrimaryKey: "entity-1001",
    ontologyUniqueIdentifier: "ontology-aircraft",
    properties: {
      舰船名称: "卡尔尼号",
      英文名称: "USS Carney",
      舷线号: "DDG-64",
      在役状态: "服役中",
      所属国家: "美国",
      舰船级别: "阿利·伯克级",
      具体型号: "DDG-51 Flight II",
      满载排水量: "9200",
      舰员总数: "323",
      单一标识符: "USN-DDG-64",
    },
  },
  {
    id: 1002,
    entityPrimaryKey: "entity-1002",
    ontologyUniqueIdentifier: "ontology-aircraft",
    properties: {
      舰船名称: "温斯顿·丘吉尔号",
      英文名称: "USS Winston S. Churchill",
      舷线号: "DDG-81",
      在役状态: "建造中",
      所属国家: "美国",
      舰船级别: "阿利·伯克级",
      具体型号: "DDG-51 Flight IIA",
      满载排水量: "9200",
      舰员总数: "323",
      单一标识符: "USN-DDG-81",
    },
  },
  {
    id: 1003,
    entityPrimaryKey: "entity-1003",
    ontologyUniqueIdentifier: "ontology-aircraft",
    properties: {
      舰船名称: "杰克·H·卢卡斯号",
      英文名称: "USS Jack H. Lucas",
      舷线号: "DDG-125",
      在役状态: "已立项",
      所属国家: "美国",
      舰船级别: "阿利·伯克级",
      具体型号: "DDG-51 Flight III",
      满载排水量: "9700",
      舰员总数: "330",
      单一标识符: "USN-DDG-125",
    },
  },
];

/**
 * @description 返回实体列表本地样例副本。
 * @returns 实体记录数组。
 */
export function createObjectProfileEntityListMockRecords(): OntologyEntityInfo[] {
  return structuredClone(OBJECT_PROFILE_ENTITY_LIST_SEED);
}
