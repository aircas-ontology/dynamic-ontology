import type {
  ApiResponse,
  CreateOntologyFunctionContainerData,
  CreateOntologyFunctionContainerParams,
  CreateOntologyFunctionData,
  CreateOntologyFunctionParams,
  DeleteOntologyFunctionData,
  DeleteOntologyFunctionParams,
  FunctionPublishData,
  FunctionPublishParams,
  FunctionUnpublishData,
  FunctionUnpublishParams,
  GetOntologyFunctionContainerRuntimeListData,
  GetOntologyFunctionContainerRuntimeListParams,
  GetOntologyFunctionDetailData,
  GetOntologyFunctionDetailParams,
  GetOntologyFunctionListData,
  GetOntologyFunctionListParams,
  GetOntologyFunctionVersionsData,
  GetOntologyFunctionVersionsParams,
  ParseOntologyFunctionParamsData,
  ParseOntologyFunctionParamsParams,
  PostOntologyFunctionContainerRuntimeStartData,
  PostOntologyFunctionContainerRuntimeStartParams,
  PostOntologyFunctionContainerRuntimeStopData,
  PostOntologyFunctionContainerRuntimeStopParams,
  ProbeOntologyFunctionContainerInterfacesData,
  ProbeOntologyFunctionContainerInterfacesParams,
  TestOntologyFunctionData,
  TestOntologyFunctionParams,
  UpdateOntologyFunctionData,
  UpdateOntologyFunctionParams,
  UploadOntologyFunctionContainerDocData,
  UploadOntologyFunctionContainerDocParams,
  UploadOntologyFunctionContainerImageData,
  UploadOntologyFunctionContainerImageParams,
} from "@/types";
import { request } from "@/utils/request";

/**
 * @description 创建对象空间下的函数算子（BASIC_QUERY / CUSTOMIZE / EXTERNAL）。
 *
 * 请求方式：POST `/ontology/function`
 *
 * @param params 创建参数。
 * @param params.functionApi 函数 API 名称。
 * @param params.version 版本号，格式 x.y.z。
 * @param params.displayName 函数显示名称。
 * @param params.description 函数说明。
 * @param params.type 函数模型：BASIC_QUERY、CUSTOMIZE、EXTERNAL 或 COMPOSITE。
 * @param params.ontologySpaceId 所属对象空间 id。
 * @param params.queryConfig 可选的基础查询配置（filters / aggFunc）。
 * @param params.apiConfig 可选的外部 API 配置（endpoint / method / authType / apiKeyHeader / apiKey / inputs / outputs）。
 * @param params.compositeConfig 可选的函数编排配置（仅 COMPOSITE）。
 * @returns 标准 API 响应；成功时 data 为 null。
 */
export function createOntologyFunctionInterface(params: CreateOntologyFunctionParams): Promise<ApiResponse<CreateOntologyFunctionData>> {
  return request<CreateOntologyFunctionData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function",
    method: "post",
    data: params,
  });
}

/**
 * @description 修改本体空间下的函数算子（BASIC_QUERY / CUSTOMIZE / EXTERNAL）。
 *
 * 请求方式：PUT `/ontology/function`
 *
 * @param params 修改参数。
 * @param params.functionApi 函数 API 名称。
 * @param params.version 版本号，格式 x.y.z。
 * @param params.displayName 函数显示名称。
 * @param params.description 函数说明。
 * @param params.type 函数模型（BASIC_QUERY、CUSTOMIZE 或 EXTERNAL）。
 * @param params.ontologySpaceId 所属本体空间 id。
 * @param params.language 可选脚本语言（仅 CUSTOMIZE）。
 * @param params.code 可选脚本源码（仅 CUSTOMIZE）。
 * @param params.parameters 可选脚本参数列表（仅 CUSTOMIZE）。
 * @param params.basedOnOldVersion 可选，外部 API 编辑与新建请求保持一致。
 * @param params.queryConfig 可选的基础查询配置（filters / aggFunc）。
 * @param params.apiConfig 可选的外部 API 配置（endpoint / method / authType / apiKeyHeader / apiKey / inputs / outputs）。
 * @returns 标准 API 响应；成功时 data 为 null。
 */
export function updateOntologyFunctionInterface(params: UpdateOntologyFunctionParams): Promise<ApiResponse<UpdateOntologyFunctionData>> {
  return request<UpdateOntologyFunctionData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function",
    method: "put",
    data: params,
  });
}

/**
 * @description 分页查询函数算子列表。
 *
 * 请求方式：GET `/ontology/function/list`
 *
 * @param params 查询参数。
 * @param params.ontologySpaceId 对象空间 id（必填）。
 * @param params.pageNum 可选页码，从 1 开始，默认 1。
 * @param params.pageSize 可选每页条数，默认 10。
 * @param params.displayName 可选函数名称（模糊搜索）。
 * @param params.type 可选函数类型（CUSTOMIZE / EXTERNAL / BASIC_QUERY / COMPOSITE）。
 * @param params.publishStatus 可选发布状态（0 未发布，1 已发布）。
 * @param params.startDate 可选创建开始日期（yyyy-MM-dd）。
 * @param params.endDate 可选创建结束日期（yyyy-MM-dd）。
 * @returns 标准 API 响应，包含函数列表分页数据。
 */
export function getOntologyFunctionListInterface(params: GetOntologyFunctionListParams): Promise<ApiResponse<GetOntologyFunctionListData>> {
  return request<GetOntologyFunctionListData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/list",
    method: "get",
    params,
  });
}

/**
 * @description 根据函数 API 名称查询函数详情。
 *
 * 请求方式：GET `/ontology/function/detail`
 *
 * @param params 查询参数。
 * @param params.functionApi 函数 API 名称。
 * @param params.version 版本号。
 * @returns 标准 API 响应，data 为函数详情。
 */
export function getOntologyFunctionDetailInterface(params: GetOntologyFunctionDetailParams): Promise<ApiResponse<GetOntologyFunctionDetailData>> {
  return request<GetOntologyFunctionDetailData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/detail",
    method: "get",
    params,
  });
}

/**
 * @description 根据函数 API 名称查询版本号列表。
 *
 * 请求方式：GET `/ontology/function/versions`（`functionApi` 以 query string 传递）。
 *
 * @param params 查询参数。
 * @param params.functionApi 函数 API 名称。
 * @returns 标准 API 响应，data 为版本号字符串数组。
 */
export function getOntologyFunctionVersionsInterface(params: GetOntologyFunctionVersionsParams): Promise<ApiResponse<GetOntologyFunctionVersionsData>> {
  return request<GetOntologyFunctionVersionsData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/versions",
    method: "get",
    params,
  });
}

/**
 * @description 按函数 API 名称和版本删除函数算子。
 *
 * 请求方式：DELETE `/ontology/function/delete`（`functionApi`、`version` 以 query 传递）。
 *
 * @param params 删除参数。
 * @param params.functionApi 函数 API 名称。
 * @param params.version 版本号，格式 x.y.z。
 * @returns 标准 API 响应；成功时 data 为 null。
 */
export function deleteOntologyFunctionInterface(params: DeleteOntologyFunctionParams): Promise<ApiResponse<DeleteOntologyFunctionData>> {
  return request<DeleteOntologyFunctionData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/delete",
    method: "delete",
    params,
  });
}

/**
 * @description 测试算子函数。
 *
 * 请求方式：POST `/ontology/function/test`
 *
 * @param params 测试参数。
 * @param params.functionApi 函数 API 名称。
 * @param params.ontologyIdentifier 对象唯一标识。
 * @param params.variableBindings 查询参数绑定对象。
 * @param params.pageNum 可选页码，默认 1。
 * @param params.pageSize 可选每页条数，默认 10。
 * @returns 标准 API 响应；成功时 data 暂为 null。
 */
export function testOntologyFunctionInterface(params: TestOntologyFunctionParams): Promise<ApiResponse<TestOntologyFunctionData>> {
  return request<TestOntologyFunctionData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/test",
    method: "post",
    data: params,
  });
}

/**
 * @description 解析脚本的输入/输出参数。
 *
 * 请求方式：POST `/ontology/function/parse_params`
 *
 * @param params 解析参数。
 * @param params.language 脚本语言：GROOVY / JAVA / PYTHON / TYPESCRIPT。
 * @param params.code 脚本代码。
 * @returns 标准 API 响应，data 含解析状态与参数列表。
 */
export function postParseOntologyFunctionParamsInterface(params: ParseOntologyFunctionParamsParams): Promise<ApiResponse<ParseOntologyFunctionParamsData>> {
  return request<ParseOntologyFunctionParamsData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/parse_params",
    method: "post",
    data: params,
  });
}

/**
 * @description 发布函数算子。
 *
 * 请求方式：POST `/ontology/function/publish`（`functionApi`、`version` 以 query string 传递）。
 *
 * @param params 发布参数（query）。
 * @param params.functionApi 函数 API 名称。
 * @param params.version 版本号，格式 x.y.z。
 * @returns 标准 API 响应；成功时 data 为 null。
 */
export function postOntologyFunctionPublishInterface(params: FunctionPublishParams): Promise<ApiResponse<FunctionPublishData>> {
  return request<FunctionPublishData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/publish",
    method: "post",
    params,
  });
}

/**
 * @description 下线已发布的函数算子。
 *
 * 请求方式：POST `/ontology/function/unpublish`（`functionApi`、`version` 以 query string 传递）。
 *
 * @param params 下线参数（query）。
 * @param params.functionApi 函数 API 名称。
 * @param params.version 版本号，格式 x.y.z。
 * @returns 标准 API 响应；成功时 data 为 null。
 */
export function postOntologyFunctionUnpublishInterface(params: FunctionUnpublishParams): Promise<ApiResponse<FunctionUnpublishData>> {
  return request<FunctionUnpublishData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/unpublish",
    method: "post",
    params,
  });
}

/**
 * @description 创建容器算子（按勾选接口派生多条 CONTAINER 函数）。
 *
 * 请求方式：POST `/ontology/function`。
 *
 * @param params 创建参数。
 * @returns 标准 API 响应；成功时 data 为派生后的算子 api 列表。
 */
export function postCreateOntologyFunctionContainerInterface(
  params: CreateOntologyFunctionContainerParams,
): Promise<ApiResponse<CreateOntologyFunctionContainerData>> {
  return request<CreateOntologyFunctionContainerData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function",
    method: "post",
    data: params,
  });
}

/**
 * @description 上传容器算子镜像包（tar/tar.gz），由服务端校验 ARM64 架构。
 *
 * 请求方式：POST `/ontology/function/container/upload_image`（multipart/form-data，字段名 `file`）。
 *
 * @param params 上传参数。
 * @param params.file 必填镜像包文件。
 * @returns 标准 API 响应；成功时 data 含 fileName、path、size、architecture、repoTags。
 */
export function postUploadOntologyFunctionContainerImageInterface(
  params: UploadOntologyFunctionContainerImageParams,
): Promise<ApiResponse<UploadOntologyFunctionContainerImageData>> {
  const formData = new FormData();
  formData.append("file", params.file);
  return request<UploadOntologyFunctionContainerImageData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/container/upload_image",
    method: "post",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/**
 * @description 上传容器算子接口文档（json/yaml/yml），返回文档信息与存储路径。
 *
 * 请求方式：POST `/ontology/function/container/upload_doc`（multipart/form-data，字段名 `file`）。
 *
 * @param params 上传参数。
 * @param params.file 必填接口文档文件。
 * @returns 标准 API 响应；成功时 data 含 fileName、path、format。
 */
export function postUploadOntologyFunctionContainerDocInterface(
  params: UploadOntologyFunctionContainerDocParams,
): Promise<ApiResponse<UploadOntologyFunctionContainerDocData>> {
  const formData = new FormData();
  formData.append("file", params.file);
  return request<UploadOntologyFunctionContainerDocData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/container/upload_doc",
    method: "post",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/**
 * @description 按上传文档存储路径探查容器算子接口列表（名称/请求方式/路径/描述/出入参）。
 *
 * 请求方式：POST `/ontology/function/container/probe_interfaces`。
 *
 * @param params 探查参数。
 * @param params.docPath 上传接口文档返回的存储路径。
 * @returns 标准 API 响应；成功时 data 为接口项数组。
 */
export function postProbeOntologyFunctionContainerInterfacesInterface(
  params: ProbeOntologyFunctionContainerInterfacesParams,
): Promise<ApiResponse<ProbeOntologyFunctionContainerInterfacesData>> {
  return request<ProbeOntologyFunctionContainerInterfacesData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/container/probe_interfaces",
    method: "post",
    data: params,
  });
}

/**
 * @description 列出容器运行实例（启停管理页数据源；按空间筛选）。
 *
 * 请求方式：GET `/ontology/function/container/runtime/list`（`spaceId` 以 query 传递）。
 *
 * @param params 查询参数。
 * @param params.spaceId 空间 id。
 * @returns 标准 API 响应；成功时 data 为容器运行实例数组。
 */
export function getOntologyFunctionContainerRuntimeListInterface(
  params: GetOntologyFunctionContainerRuntimeListParams,
): Promise<ApiResponse<GetOntologyFunctionContainerRuntimeListData>> {
  return request<GetOntologyFunctionContainerRuntimeListData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/container/runtime/list",
    method: "get",
    params,
  });
}

/**
 * @description 启动容器运行实例。
 *
 * 请求方式：POST `/ontology/function/container/runtime/start`（`containerKey` 以 query 传递）。
 *
 * @param params 启动参数（query）。
 * @param params.containerKey 容器实例归组键。
 * @returns 标准 API 响应；成功时 data 为更新后的运行实例。
 */
export function postOntologyFunctionContainerRuntimeStartInterface(
  params: PostOntologyFunctionContainerRuntimeStartParams,
): Promise<ApiResponse<PostOntologyFunctionContainerRuntimeStartData>> {
  return request<PostOntologyFunctionContainerRuntimeStartData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/container/runtime/start",
    method: "post",
    params,
  });
}

/**
 * @description 停止并移除容器运行实例。
 *
 * 请求方式：POST `/ontology/function/container/runtime/stop`（`containerKey` 以 query 传递）。
 *
 * @param params 停止参数（query）。
 * @param params.containerKey 容器实例归组键。
 * @returns 标准 API 响应；成功时 data 为更新后的运行实例。
 */
export function postOntologyFunctionContainerRuntimeStopInterface(
  params: PostOntologyFunctionContainerRuntimeStopParams,
): Promise<ApiResponse<PostOntologyFunctionContainerRuntimeStopData>> {
  return request<PostOntologyFunctionContainerRuntimeStopData>({
    url: DOMAIN_CONFIG.ONTOLOGYMANAGE_URL + "/ontology/function/container/runtime/stop",
    method: "post",
    params,
  });
}
