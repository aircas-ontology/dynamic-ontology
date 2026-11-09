/** 实体浏览菜单默认进入的对象空间 id。 */
export const ENTITY_BROWSING_DEFAULT_SPACE_ID = "23";

/**
 * 「阿利·伯克级驱逐舰」完整画像对象 id（含基本信息 / 实体统计）。
 * 来源：GET /ontology/meta/inheritance_tree?spaceId=23
 */
export const ENTITY_BROWSING_FULL_PROFILE_OBJECT_ID = "8b4889e087134b67beeb7ac5ff9b29c8";

/**
 * 「052D型驱逐舰」精简画像对象 id（仅实体列表 / 标准应用情况）。
 * 来源：GET /ontology/meta/inheritance_tree?spaceId=23（内网样例第二项）
 */
export const ENTITY_BROWSING_LITE_PROFILE_OBJECT_ID = "49c11f470fa542e7ac216bcfa380f3c1";

/** 实体列表详情操作嵌入的来源系统固定页面地址。 */
export const ENTITY_BROWSING_ENTITY_DETAIL_URL = "http://192.168.53.102:10606/#/layout/entity/ship/f7c3879a-6c62-40e0-8fa0-e9bb856eff61?embed=1";
/**
 * @description 判断对象是否走精简画像（仅实体列表 + 标准应用情况）。
 * @param objectId 对象 uniqueIdentifier。
 */
export function isEntityBrowsingLiteProfileObjectId(objectId: string): boolean {
  return objectId.trim() === ENTITY_BROWSING_LITE_PROFILE_OBJECT_ID;
}
