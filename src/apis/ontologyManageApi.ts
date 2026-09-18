import type {
  ApiResponse,
  CreateOntologySpaceData,
  CreateOntologySpaceParams,
  DeleteOntologySpaceData,
  DeleteOntologySpaceParams,
  OntologyCategoryTreeData,
  OntologyCategoryTreeParams,
  OntologySpaceListData,
  UpdateOntologySpaceData,
  UpdateOntologySpaceParams,
} from "@/types";
import { request } from "@/utils/request";

/** 列表查询超时时间（毫秒）：远程不可达时快速失败，使页面回退到样例数据。 */
const ONTOLOGY_SPACE_LIST_TIMEOUT = 10000;

/** 空间创建超时时间（毫秒）：远程不可达时快速失败，使调用方提示失败信息。 */
const CREATE_ONTOLOGY_SPACE_TIMEOUT = 10000;

/** 空间编辑超时时间（毫秒）：远程不可达时快速失败，使调用方提示失败信息。 */
const UPDATE_ONTOLOGY_SPACE_TIMEOUT = 10000;

/** 空间删除超时时间（毫秒）：远程不可达时快速失败，使调用方提示失败信息。 */
const DELETE_ONTOLOGY_SPACE_TIMEOUT = 10000;

/**
 * @description 创建本体空间。
 *
 * 请求方式：POST `/ontology/space`
 *
 * @param params 创建空间参数。
 * @param params.apiName 空间API名称。
 * @param params.displayName 空间名称。
 * @param params.icon 空间图标url。
 * @param params.description 空间描述。
 * @returns 标准 API 响应，data 为新创建空间 id。
 */
export function createOntologySpaceInterface(params: CreateOntologySpaceParams): Promise<ApiResponse<CreateOntologySpaceData>> {
  return request<CreateOntologySpaceData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space",
    method: "post",
    data: params,
    timeout: CREATE_ONTOLOGY_SPACE_TIMEOUT,
  });
}

/**
 * @description 删除本体空间。
 *
 * 请求方式：DELETE `/ontology/space/{spaceId}`
 *
 * @param params 删除空间参数。
 * @param params.spaceId 空间ID。
 * @returns 标准 API 响应，data 为空对象。
 */
export function deleteOntologySpaceInterface(params: DeleteOntologySpaceParams): Promise<ApiResponse<DeleteOntologySpaceData>> {
  return request<DeleteOntologySpaceData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space/" + params.spaceId,
    method: "delete",
    timeout: DELETE_ONTOLOGY_SPACE_TIMEOUT,
  });
}

/**
 * @description 编辑本体空间。
 *
 * 请求方式：PUT `/ontology/space`
 *
 * @param params 编辑空间参数。
 * @param params.spaceId 空间ID。
 * @param params.displayName 空间名称。
 * @param params.icon 空间图标url。
 * @param params.description 空间描述。
 * @returns 标准 API 响应，data 为空对象。
 */
export function updateOntologySpaceInterface(params: UpdateOntologySpaceParams): Promise<ApiResponse<UpdateOntologySpaceData>> {
  return request<UpdateOntologySpaceData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space",
    method: "put",
    data: params,
    timeout: UPDATE_ONTOLOGY_SPACE_TIMEOUT,
  });
}

/**
 * @description 查询本体分类体系树。
 *
 * 请求方式：GET `/ontology`
 *
 * @param params 查询参数。
 * @param params.spaceId 必填空间 id。
 * @returns 标准 API 响应，data 为分类体系单根节点。
 */
export function getOntologyCategoryTreeInterface(params: OntologyCategoryTreeParams): Promise<ApiResponse<OntologyCategoryTreeData>> {
  return request<OntologyCategoryTreeData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology",
    method: "get",
    params,
  });
}

/**
 * @description 查询本体空间列表。
 *
 * 请求方式：GET `/ontology/space`
 *
 * 无入参；10 秒超时，超时或失败由调用方回退样例数据。
 * @returns 标准 API 响应，data 为本体空间数组。
 */
export function getOntologySpaceListInterface(): Promise<ApiResponse<OntologySpaceListData>> {
  return request<OntologySpaceListData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space",
    method: "get",
    timeout: ONTOLOGY_SPACE_LIST_TIMEOUT,
  });
}
