import type {
  ApiResponse,
  GetBehaviorSchedulingDetailData,
  GetBehaviorSchedulingDetailParams,
  CreateBehaviorScheduleParams,
  CreateOntologyActionData,
  CreateOntologyActionParams,
  DeleteOntologyActionData,
  DeleteOntologyActionParams,
  EditOntologyActionData,
  EditOntologyActionParams,
  GetOntologyActionInfoData,
  GetOntologyActionInfoParams,
  ListBehaviorSchedulingData,
  ListBehaviorSchedulingParams,
  ListOntologyActionData,
  ListOntologyActionParams,
  PublishOntologyActionData,
  PublishOntologyActionParams,
  TestOntologyActionData,
  TestOntologyActionParams,
  UnpublishOntologyActionData,
  UnpublishOntologyActionParams,
} from "@/types";
import { request } from "@/utils/request";

/** @description 查询行为调度详情。GET `/ontology/action/scheduling/detail`。 @param params 调度 id 和类型。 @returns 调度详情。 */
export function getBehaviorSchedulingDetailInterface(params: GetBehaviorSchedulingDetailParams): Promise<ApiResponse<GetBehaviorSchedulingDetailData>> {
  return request<GetBehaviorSchedulingDetailData>({ url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action/scheduling/detail", method: "get", params });
}

/**
 * @description 分页查询行为调度列表。GET `/ontology/action/scheduling/list`。
 * @param params 分页查询参数，仅 pageNum、pageSize，无空间筛选参数。
 * @returns 标准响应，data 包含调度 records、total、size、current，不包含执行配置详情。
 */
export function getListBehaviorSchedulingInterface(params: ListBehaviorSchedulingParams): Promise<ApiResponse<ListBehaviorSchedulingData>> {
  return request<ListBehaviorSchedulingData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action/scheduling/list",
    method: "get",
    params,
  });
}

/**
 * @description 使用统一对象管理服务保存周期行为调度。
 * 请求方式：POST `/ontology/action/scheduling`。
 * @param params 已校验的调度创建参数，task.entityJson 为完整行为参数 JSON 字符串。
 * @returns 标准响应；保存结果 data 尚未约定，调用方使用 code、success 和 message。
 */
export function postCreateBehaviorScheduleInterface(params: CreateBehaviorScheduleParams): Promise<ApiResponse<unknown>> {
  return request<unknown>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action/scheduling",
    method: "post",
    data: params,
  });
}

/**
 * @description 测试本体行为定义是否可用；草稿行为可测，会真实落库。
 *
 * 请求方式：POST `/ontology/action/test`
 *
 * @param params 测试请求体。
 * @param params.ontologySpaceId 对象空间 id。
 * @param params.actionApi 行为 api。
 * @param params.entityPrimaryKey 行为挂载侧实体主键。
 * @param params.dataPrimaryKey 分组表行主键；属性值修改/删除时使用。
 * @param params.linkEntityPrimaryKey 关系对端实体主键；实例关系行为时使用。
 * @param params.params 外部输入参数取值。
 * @returns 标准 API 响应；data 为测试结果或 null。
 */
export function postTestOntologyActionInterface(params: TestOntologyActionParams): Promise<ApiResponse<TestOntologyActionData>> {
  return request<TestOntologyActionData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action/test",
    method: "post",
    data: params,
  });
}

/**
 * @description 删除本体行为。
 *
 * 请求方式：DELETE `/ontology/action`
 *
 * @param params 删除行为查询参数。
 * @param params.ontologySpaceId 本体空间 id。
 * @param params.actionApi 行为 api。
 * @returns 标准 API 响应，成功时 data 为 null。
 */
export function deleteOntologyActionInterface(params: DeleteOntologyActionParams): Promise<ApiResponse<DeleteOntologyActionData>> {
  return request<DeleteOntologyActionData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action",
    method: "delete",
    params,
  });
}

/**
 * @description 创建本体行为。
 *
 * 请求方式：POST `/ontology/action`
 *
 * @param params 创建行为请求体。
 * @returns 标准 API 响应，成功时 data 为 null。
 */
export function postCreateOntologyActionInterface(params: CreateOntologyActionParams): Promise<ApiResponse<CreateOntologyActionData>> {
  return request<CreateOntologyActionData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action",
    method: "post",
    data: params,
  });
}

/**
 * @description 查询本体行为详情。
 *
 * 请求方式：GET `/ontology/action`
 *
 * @param params 查询参数，含 actionApi、ontologySpaceId。
 * @returns 标准 API 响应，data 为行为详情。
 */
export function getOntologyActionInfoInterface(params: GetOntologyActionInfoParams): Promise<ApiResponse<GetOntologyActionInfoData>> {
  return request<GetOntologyActionInfoData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action",
    method: "get",
    params,
  });
}

/**
 * @description 编辑本体行为；body 与创建一致，靠 actionApi 定位。
 *
 * 请求方式：PUT `/ontology/action`
 *
 * @param params 编辑行为请求体。
 * @returns 标准 API 响应，成功时 data 为 null。
 */
export function putEditOntologyActionInterface(params: EditOntologyActionParams): Promise<ApiResponse<EditOntologyActionData>> {
  return request<EditOntologyActionData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action",
    method: "put",
    data: params,
  });
}

/**
 * @description 分页查询本体行为列表。
 *
 * 请求方式：GET `/ontology/action/list`
 *
 * @param params 查询参数。
 * @returns 标准 API 响应，data 为分页行为列表。
 */
export function getListOntologyActionInterface(params: ListOntologyActionParams): Promise<ApiResponse<ListOntologyActionData>> {
  return request<ListOntologyActionData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action/list",
    method: "get",
    params,
  });
}

/**
 * @description 发布本体行为。
 *
 * 请求方式：PUT `/ontology/action/publish`
 *
 * @param params 发布行为查询参数。
 * @param params.ontologySpaceId 本体空间 id。
 * @param params.actionApi 行为 api。
 * @returns 标准 API 响应；成功时 data 为空数组。
 */
export function putPublishOntologyActionInterface(params: PublishOntologyActionParams): Promise<ApiResponse<PublishOntologyActionData>> {
  return request<PublishOntologyActionData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action/publish",
    method: "put",
    params,
  });
}

/**
 * @description 撤销发布本体行为。
 *
 * 请求方式：PUT `/ontology/action/unpublish`
 *
 * @param params 撤销发布查询参数。
 * @param params.ontologySpaceId 本体空间 id。
 * @param params.actionApi 行为 api。
 * @returns 标准 API 响应；成功时 data 为空数组。
 */
export function putUnpublishOntologyActionInterface(params: UnpublishOntologyActionParams): Promise<ApiResponse<UnpublishOntologyActionData>> {
  return request<UnpublishOntologyActionData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/action/unpublish",
    method: "put",
    params,
  });
}
