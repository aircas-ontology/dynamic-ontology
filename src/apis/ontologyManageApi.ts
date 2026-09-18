import type {
  ApiResponse,
  CreateOntologyCategoryTreeParams,
  DeleteOntologyCategoryTreeParams,
  OntologyCategoryTreeData,
  OntologyCategoryTreeParams,
  OntologySpaceListData,
  UpdateOntologyCategoryNameParams,
} from "@/types";
import { request } from "@/utils/request";

/** 列表查询超时时间（毫秒）：远程不可达时快速失败，使页面回退到样例数据。 */
const ONTOLOGY_SPACE_LIST_TIMEOUT = 10000;

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
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/category/tree",
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
    // url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space",
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/space",
    method: "get",
    timeout: ONTOLOGY_SPACE_LIST_TIMEOUT,
  });
}

/**
 * @description 创建本体分类体系树。
 *
 * 请求方式：POST `/ontology/category/`
 *
 * @param payload 创建参数。
 * @param payload.spaceId 当前空间 id，数字。
 * @param payload.parentId 父级分类 id，数字，根分类为 0。
 * @param payload.name 主分类名称。
 * @returns 标准 API 响应；成功时 code 为 200，响应体不含 data。
 */
export function postCreateOntologyCategoryTreeInterface(payload: CreateOntologyCategoryTreeParams): Promise<ApiResponse<undefined>> {
  return request<undefined>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/category",
    method: "post",
    data: payload,
  });
}

/**
 * @description 删除本体分类体系树节点。
 *
 * 请求方式：DELETE `/ontology/category`
 *
 * @param payload 删除参数。
 * @param payload.spaceId 当前空间 id，数字。
 * @param payload.categoryId 要删除的分类 id，数字。
 * @returns 标准 API 响应；成功时 code 为 200，响应体不含 data。
 */
export function deleteOntologyCategoryTreeInterface(payload: DeleteOntologyCategoryTreeParams): Promise<ApiResponse<undefined>> {
  return request<undefined>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/category",
    method: "delete",
    data: payload,
  });
}

/**
 * @description 修改本体分类名称。
 *
 * 请求方式：PUT `/ontology/category`
 *
 * @param payload 修改参数。
 * @param payload.spaceId 当前空间 id，数字。
 * @param payload.categoryId 要修改的分类 id，数字。
 * @param payload.name 新的分类名称。
 * @returns 标准 API 响应；成功时 code 为 200，响应体不含 data。
 */
export function putUpdateOntologyCategoryNameInterface(payload: UpdateOntologyCategoryNameParams): Promise<ApiResponse<undefined>> {
  return request<undefined>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/category",
    method: "put",
    data: payload,
  });
}
