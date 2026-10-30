import type {
  ApiResponse,
  GetOntologyEntitiesData,
  GetOntologyEntitiesParams,
  GetOntologyPropertyByOntologyIdData,
  GetOntologyPropertyByOntologyIdParams,
  OntologyCategoryMetaInfo,
  OntologyCategoryTreeData,
  OntologyEntityInfo,
  OntologyPropertyInfo,
  OntologyRelationCategoryLink,
  OntologyRelationCategoryTreeData,
  OntologyRelationCategoryTreeParams,
} from "@/types";

/** 创建主题演示模式的固定时间戳，保证 Mock 数据可重复。 */
const GUIDE_MOCK_TIME = "2026-01-01 00:00:00";

/** 演示分类的水面舰艇分类 id，对象元信息与分类节点共用。 */
const GUIDE_SHIP_CATEGORY_ID = 3002;

/** 每个演示对象的演示实例数量，用于分页与对象统计。 */
const GUIDE_INSTANCE_COUNT = 12;

/** 创建主题演示模式的单个对象定义。 */
export interface SubspaceCreateGuideObject {
  /** 对象唯一标识。 */
  id: string;
  /** 对象 API 名称。 */
  apiName: string;
  /** 对象显示名称。 */
  displayName: string;
  /** 对象描述。 */
  description: string;
}

/** 创建主题演示模式的成套对象；分类树、实例、属性与关系全部围绕该集合构造。 */
export const GUIDE_SUBSPACE_CREATE_OBJECTS: readonly SubspaceCreateGuideObject[] = [
  { id: "ontology-platform", apiName: "platform", displayName: "平台", description: "演示用的海上平台对象" },
  { id: "ontology-aircraft-carrier", apiName: "aircraft_carrier", displayName: "航空母舰", description: "演示用的航空母舰对象" },
  { id: "ontology-destroyer", apiName: "destroyer", displayName: "驱逐舰", description: "演示用的驱逐舰对象" },
  { id: "ontology-frigate", apiName: "frigate", displayName: "护卫舰", description: "演示用的护卫舰对象" },
];

/** 演示对象唯一标识集合，供页面校验与关系筛选使用。 */
export const GUIDE_SUBSPACE_CREATE_OBJECT_IDS: readonly string[] = GUIDE_SUBSPACE_CREATE_OBJECTS.map((object) => object.id);

/**
 * @description 构造演示对象的分类树元信息。
 * @param object 演示对象。
 * @returns 分类树对象元信息。
 */
function createGuideCategoryMetaInfo(object: SubspaceCreateGuideObject): OntologyCategoryMetaInfo {
  return {
    uniqueIdentifier: object.id,
    displayName: object.displayName,
    apiName: object.apiName,
    description: object.description,
    createTime: GUIDE_MOCK_TIME,
    updateTime: GUIDE_MOCK_TIME,
    latestQueryTime: GUIDE_MOCK_TIME,
    metaGroupId: [],
    spaceId: 0,
    ontologyCategoryId: GUIDE_SHIP_CATEGORY_ID,
    entityCount: GUIDE_INSTANCE_COUNT,
    relationCount: 2,
    propertyCount: 4,
    actionCount: 0,
  };
}

/** 创建主题演示模式的分类体系树：全部 → 舰船 → 水面舰艇，对象挂载在水面舰艇分类下。 */
export const GUIDE_ONTOLOGY_CATEGORY_TREE_DATA: OntologyCategoryTreeData = {
  categoryId: 3000,
  name: "全部",
  children: [
    {
      categoryId: 3001,
      name: "舰船",
      children: [
        {
          categoryId: GUIDE_SHIP_CATEGORY_ID,
          name: "水面舰艇",
          ontologyMetaInfos: GUIDE_SUBSPACE_CREATE_OBJECTS.map(createGuideCategoryMetaInfo),
        },
      ],
    },
  ],
};

/**
 * @description 构造单个演示对象的实例记录。
 * @param object 演示对象。
 * @returns 该对象的演示实例记录。
 */
function createGuideEntities(object: SubspaceCreateGuideObject): OntologyEntityInfo[] {
  return Array.from({ length: GUIDE_INSTANCE_COUNT }, (_, index) => ({
    entityPrimaryKey: `${object.id}-entity-${index + 1}`,
    ontologyUniqueIdentifier: object.id,
    properties: { name: `${object.displayName}实例${index + 1}` },
  }));
}

/** 演示实例记录：按对象唯一标识索引，供实例查询按对象返回。 */
const GUIDE_ENTITY_RECORDS_BY_OBJECT_ID: ReadonlyMap<string, OntologyEntityInfo[]> = new Map(
  GUIDE_SUBSPACE_CREATE_OBJECTS.map((object) => [object.id, createGuideEntities(object)]),
);

/**
 * @description 构造单个演示对象的属性列表，首条为主键属性。
 * @param object 演示对象。
 * @returns 该对象的演示属性列表。
 */
function createGuideProperties(object: SubspaceCreateGuideObject): OntologyPropertyInfo[] {
  return [
    {
      uniqueIdentifier: `${object.id}-property-id`,
      ontologyUniqueIdentifier: object.id,
      displayName: "编号",
      apiName: "code",
      propertyType: "String",
      description: `${object.displayName}主键编号`,
      isPrimaryKey: true,
      isTitleKey: true,
    },
    {
      uniqueIdentifier: `${object.id}-property-name`,
      ontologyUniqueIdentifier: object.id,
      displayName: "名称",
      apiName: "name",
      propertyType: "String",
      description: `${object.displayName}名称`,
    },
    {
      uniqueIdentifier: `${object.id}-property-tonnage`,
      ontologyUniqueIdentifier: object.id,
      displayName: "排水量",
      apiName: "tonnage",
      propertyType: "Double",
      description: `${object.displayName}排水量`,
    },
    {
      uniqueIdentifier: `${object.id}-property-status`,
      ontologyUniqueIdentifier: object.id,
      displayName: "在役状态",
      apiName: "service_status",
      propertyType: "String",
      description: `${object.displayName}在役状态`,
    },
  ];
}

/** 演示属性列表：按对象唯一标识索引，供属性查询按对象返回。 */
const GUIDE_PROPERTY_LIST_BY_OBJECT_ID: ReadonlyMap<string, OntologyPropertyInfo[]> = new Map(
  GUIDE_SUBSPACE_CREATE_OBJECTS.map((object) => [object.id, createGuideProperties(object)]),
);

/**
 * @description 构造演示关系链接，起止端点均落在演示对象集合内。
 * @returns 演示关系链接列表。
 */
function createGuideRelationLinks(): OntologyRelationCategoryLink[] {
  const objectIdByKey = new Map(GUIDE_SUBSPACE_CREATE_OBJECTS.map((object) => [object.apiName, object.id]));
  const displayNameByKey = new Map(GUIDE_SUBSPACE_CREATE_OBJECTS.map((object) => [object.apiName, object.displayName]));
  const definitions = [
    { uniqueIdentifier: "guide-link-embark", name: "搭载", type: "composition", from: "platform", to: "aircraft_carrier" },
    { uniqueIdentifier: "guide-link-escort", name: "护航", type: "association", from: "aircraft_carrier", to: "destroyer" },
    { uniqueIdentifier: "guide-link-formation", name: "同编队", type: "association", from: "destroyer", to: "frigate" },
    { uniqueIdentifier: "guide-link-attach", name: "隶属", type: "aggregation", from: "frigate", to: "platform" },
    { uniqueIdentifier: "guide-link-support", name: "补给", type: "association", from: "aircraft_carrier", to: "frigate" },
  ];
  return definitions.flatMap((definition) => {
    const sourceId = objectIdByKey.get(definition.from);
    const targetId = objectIdByKey.get(definition.to);
    if (!sourceId || !targetId) return [];
    return [
      {
        uniqueIdentifier: definition.uniqueIdentifier,
        name: definition.name,
        type: definition.type,
        categoryId: 4001,
        ontologyUniqueIdentifierFrom: sourceId,
        ontologyNameFrom: displayNameByKey.get(definition.from) ?? definition.from,
        ontologyUniqueIdentifierTo: targetId,
        ontologyNameTo: displayNameByKey.get(definition.to) ?? definition.to,
        apiName: definition.uniqueIdentifier,
        description: `${definition.name}演示关系`,
      },
    ];
  });
}

/** 演示关系链接列表。 */
const GUIDE_RELATION_LINKS: readonly OntologyRelationCategoryLink[] = createGuideRelationLinks();

/**
 * @description 查询演示模式下的对象实例分页数据。
 * @param params 实例查询参数，包含对象唯一标识、页码与每页条数。
 * @returns 演示实例分页响应。
 */
export function queryGuideOntologyEntities(params: GetOntologyEntitiesParams): ApiResponse<GetOntologyEntitiesData> {
  const records = GUIDE_ENTITY_RECORDS_BY_OBJECT_ID.get(params.ontologyUniqueIdentifier) ?? [];
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 10;
  const pageNum = params.pageNum && params.pageNum > 0 ? params.pageNum : 1;
  const start = (pageNum - 1) * pageSize;
  return {
    code: 200,
    success: true,
    message: "请求成功",
    data: {
      records: records.slice(start, start + pageSize),
      total: records.length,
      size: pageSize,
      current: pageNum,
      pages: Math.max(1, Math.ceil(records.length / pageSize)),
    },
  };
}

/**
 * @description 查询演示模式下的对象属性列表。
 * @param params 属性查询参数，包含对象唯一标识。
 * @returns 演示属性列表响应。
 */
export function queryGuideOntologyProperties(params: GetOntologyPropertyByOntologyIdParams): ApiResponse<GetOntologyPropertyByOntologyIdData> {
  return {
    code: 200,
    success: true,
    message: "请求成功",
    data: [...(GUIDE_PROPERTY_LIST_BY_OBJECT_ID.get(params.ontologyUniqueIdentifier) ?? [])],
  };
}

/**
 * @description 查询演示模式下的关系分类树；按源对象过滤时仅返回该对象作为起点的关系。
 * @param params 关系分类树查询参数，包含空间 id 与可选的源对象唯一标识。
 * @returns 演示关系分类树响应。
 */
export function queryGuideOntologyRelationTree(params: OntologyRelationCategoryTreeParams): ApiResponse<OntologyRelationCategoryTreeData> {
  const sourceId = params.ontologyUniqueIdentifierFrom?.trim();
  const links = sourceId ? GUIDE_RELATION_LINKS.filter((link) => link.ontologyUniqueIdentifierFrom === sourceId) : [...GUIDE_RELATION_LINKS];
  return {
    code: 200,
    success: true,
    message: "请求成功",
    data: { categoryId: 4000, name: "全部关系", children: [{ categoryId: 4001, name: "作战关系", links: [...links] }] },
  };
}
