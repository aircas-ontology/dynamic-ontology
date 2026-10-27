import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";

import {
  createOntologyFunctionInterface,
  deleteOntologyFunctionInterface,
  getOntologyCategoryTreeInterface,
  getOntologyFunctionDetailInterface,
  getOntologyFunctionListInterface,
  getOntologyFunctionVersionsInterface,
  getOntologyPropertyByOntologyIdInterface,
  postCreateOntologyFunctionContainerInterface,
  postOntologyFunctionPublishInterface,
  postOntologyFunctionUnpublishInterface,
  testOntologyFunctionInterface,
  updateOntologyFunctionInterface,
} from "@/apis";
import type {
  CreateOntologyFunctionContainerParams,
  CreateOntologyFunctionParams,
  FunctionOperator,
  FunctionOperatorDraft,
  FunctionOperatorQuery,
  FunctionOperatorStatus,
  FunctionOperatorType,
  FunctionOperatorViewMode,
  GetOntologyFunctionListParams,
  SpaceRelationObjectOption,
  TestOntologyFunctionParams,
} from "@/types";
import { buildOntologyFunctionQueryConfig, parseBasicFilterConfig } from "@/utils/functionOperatorBasicFilter";
import { mapOntologyFunctionDetailToDraft, mapOntologyFunctionDetailToOperator } from "@/utils/mapOntologyFunctionDetail";
import { mapScriptLanguageFromApi } from "@/utils/mapFunctionOperatorScriptLanguage";
import { mapFunctionOperatorTypeToApi } from "@/utils/mapFunctionOperatorTypeToApi";
import { mapOntologyFunctionListItem } from "@/utils/mapOntologyFunctionList";
import {
  buildOntologyFunctionScriptTestInputRows,
  buildOntologyFunctionScriptTestRequest,
  buildOntologyFunctionTestBindingKeys,
  buildOntologyFunctionTestRequest,
  writeOntologyFunctionScriptTestParamValue,
  type OntologyFunctionScriptTestInputRow,
} from "@/utils/mapOntologyFunctionTest";

import { mapOntologyObjectsToRelationOptions } from "@/utils/mapOntologyObjectsToRelationOptions";

/**
 * @description 将页面筛选条件映射为列表接口查询参数；空值与无契约类型不传。
 * @param input 页面筛选与分页上下文。
 * @returns 列表接口请求参数片段（不含 ontologySpaceId / 分页时可被调用方合并）。
 */
function buildOntologyFunctionListQueryParams(input: {
  keyword: string;
  type: FunctionOperatorType | "";
  status: FunctionOperatorStatus | "";
  updatedRange: [string, string] | null;
}): Pick<GetOntologyFunctionListParams, "displayName" | "type" | "publishStatus" | "startDate" | "endDate"> {
  const params: Pick<GetOntologyFunctionListParams, "displayName" | "type" | "publishStatus" | "startDate" | "endDate"> = {};
  const displayName = input.keyword.trim();
  if (displayName) {
    params.displayName = displayName;
  }
  if (input.type) {
    const apiType = mapFunctionOperatorTypeToApi(input.type);
    if (apiType) {
      params.type = apiType;
    }
  }
  if (input.status === "draft") {
    params.publishStatus = 0;
  } else if (input.status === "published") {
    params.publishStatus = 1;
  }
  if (input.updatedRange?.[0]) {
    params.startDate = input.updatedRange[0];
  }
  if (input.updatedRange?.[1]) {
    params.endDate = input.updatedRange[1];
  }
  return params;
}

/**
 * @description 空间函数算子工作区：列表筛选、创建/修改/删除、发布/下线与测试。
 * @returns 工作区状态与操作方法。
 */
export function useFunctionOperatorWorkspace() {
  const route = useRoute();
  const spaceId = computed(() => {
    const raw = route.params.spaceId;
    const value = Array.isArray(raw) ? raw[0] : raw;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  });

  const operators = ref<FunctionOperator[]>([]);
  const total = ref(0);
  const page = ref(1);
  const pageSize = ref(8);
  const loading = ref(false);
  const errorMessage = ref("");
  const actionLoading = ref(false);
  const viewMode = ref<FunctionOperatorViewMode>("card");
  const sortValue = ref("updatedAt-desc");
  const updatedRange = ref<[string, string] | null>(null);
  const filters = reactive<{
    keyword: string;
    type: FunctionOperatorType | "";
    creator: string;
    status: FunctionOperatorStatus | "";
  }>({ keyword: "", type: "", creator: "", status: "" });

  const selectedOperator = ref<FunctionOperator | null>(null);
  const detailVisible = ref(false);
  const detailLoading = ref(false);
  /** 详情抽屉可选版本列表。 */
  const detailVersions = ref<string[]>([]);
  /** 详情抽屉当前选中版本。 */
  const detailVersion = ref("");
  /** 详情抽屉版本列表加载中。 */
  const detailVersionsLoading = ref(false);
  /** 打开详情时的列表行，切换版本时用作映射回退。 */
  const detailListOperator = ref<FunctionOperator | null>(null);
  let detailGeneration = 0;
  const editingOperator = ref<FunctionOperator | null>(null);
  const formDraft = ref<FunctionOperatorDraft | null>(null);
  const formVisible = ref(false);
  const testVisible = ref(false);
  const testingOperator = ref<FunctionOperator | null>(null);
  const testInput = ref("{}");
  const testOutput = ref("");
  const testing = ref(false);
  const testDetailLoading = ref(false);
  const testObjectLoading = ref(false);
  const testPropertyLoading = ref(false);
  const testBindingKeys = ref<string[]>([]);
  const testObjectOptions = ref<SpaceRelationObjectOption[]>([]);
  const testPropertyOptions = ref<SpaceRelationObjectOption[]>([]);
  const testSelectedOntologyId = ref("");
  const testPropertyBindings = reactive<Record<string, string>>({});
  const scriptTestVisible = ref(false);
  const scriptTestingOperator = ref<FunctionOperator | null>(null);
  const scriptTestInputRows = ref<OntologyFunctionScriptTestInputRow[]>([]);
  const scriptTestOutput = ref("");
  const scriptTesting = ref(false);
  const scriptTestDetailLoading = ref(false);
  let scriptTestGeneration = 0;
  const deleteVisible = ref(false);
  const deleteSubmitting = ref(false);
  const deleteError = ref("");
  const deletingOperator = ref<FunctionOperator | null>(null);
  let disposed = false;
  let generation = 0;

  const creatorOptions = computed(() => {
    const names = new Set(operators.value.map((item) => item.createdBy).filter(Boolean));
    return [...names].sort((a, b) => a.localeCompare(b, "zh-CN"));
  });

  /**
   * @description 加载函数算子列表（分页与筛选走后端；当前页仅保留本地排序）。
   */
  async function loadOperators(): Promise<void> {
    if (!spaceId.value) {
      operators.value = [];
      total.value = 0;
      errorMessage.value = "无效的空间标识";
      return;
    }
    const requestId = ++generation;
    loading.value = true;
    errorMessage.value = "";
    try {
      const response = await getOntologyFunctionListInterface({
        pageNum: page.value,
        pageSize: pageSize.value,
        ontologySpaceId: spaceId.value,
        ...buildOntologyFunctionListQueryParams({
          keyword: filters.keyword,
          type: filters.type,
          status: filters.status,
          updatedRange: updatedRange.value,
        }),
      });
      if (disposed || requestId !== generation) {
        return;
      }
      if (response.code !== 200 || !response.data) {
        throw new Error(response.message || "函数算子加载失败");
      }
      const records = response.data.records.map((item) => mapOntologyFunctionListItem(item, spaceId.value));
      const [sortBy, sortOrder] = sortValue.value.split("-") as [FunctionOperatorQuery["sortBy"], FunctionOperatorQuery["sortOrder"]];
      const factor = sortOrder === "asc" ? 1 : -1;
      records.sort((left, right) => {
        if (sortBy === "name") {
          return left.name.localeCompare(right.name, "zh-CN") * factor;
        }
        return left.updatedAt.localeCompare(right.updatedAt) * factor;
      });
      operators.value = records;
      total.value = response.data.total;
      if (selectedOperator.value) {
        selectedOperator.value = operators.value.find((item) => item.id === selectedOperator.value?.id) ?? selectedOperator.value;
      }
    } catch (error) {
      if (disposed || requestId !== generation) {
        return;
      }
      errorMessage.value = error instanceof Error ? error.message : "函数算子加载失败";
    } finally {
      if (!disposed && requestId === generation) {
        loading.value = false;
      }
    }
  }

  /**
   * @description 重置筛选条件并重新查询。
   */
  function resetFilters(): void {
    filters.keyword = "";
    filters.type = "";
    filters.creator = "";
    filters.status = "";
    updatedRange.value = null;
    page.value = 1;
    void loadOperators();
  }

  /**
   * @description 应用筛选并回到第一页。
   */
  function applyFilters(): void {
    page.value = 1;
    void loadOperators();
  }

  /**
   * @description 清空详情抽屉的版本选择与列表行缓存。
   */
  function resetDetailVersionState(): void {
    detailGeneration += 1;
    detailVersions.value = [];
    detailVersion.value = "";
    detailVersionsLoading.value = false;
    detailListOperator.value = null;
  }

  /**
   * @description 合并版本列表：保证当前版本在选项中。
   * @param versions 接口返回版本。
   * @param currentVersion 当前选中版本。
   * @returns 去重后的版本列表。
   */
  function mergeDetailVersionOptions(versions: string[], currentVersion: string): string[] {
    const normalized = versions.map((item) => item.trim()).filter(Boolean);
    if (currentVersion && !normalized.includes(currentVersion)) {
      return [currentVersion, ...normalized];
    }
    return normalized;
  }

  /**
   * @description 打开详情抽屉：展示列表行，拉取版本列表与当前版本详情。
   * @param operator 目标算子。
   */
  async function openDetail(operator: FunctionOperator): Promise<void> {
    const functionApi = operator.functionApi.trim();
    const version = operator.version.trim();
    if (!functionApi) {
      ElMessage.error("缺少函数 API 名称，无法查看详情");
      return;
    }
    if (!version) {
      ElMessage.error("缺少函数版本，无法查看详情");
      return;
    }
    const requestId = ++detailGeneration;
    detailListOperator.value = operator;
    selectedOperator.value = operator;
    detailVersion.value = version;
    detailVersions.value = [version];
    detailVisible.value = true;
    detailLoading.value = true;
    detailVersionsLoading.value = true;
    try {
      const [versionsResult, detailResult] = await Promise.allSettled([
        getOntologyFunctionVersionsInterface({ functionApi }),
        getOntologyFunctionDetailInterface({ functionApi, version }),
      ]);
      if (requestId !== detailGeneration) {
        return;
      }
      if (versionsResult.status === "fulfilled") {
        const versionsResponse = versionsResult.value;
        if (versionsResponse.code === 200 && Array.isArray(versionsResponse.data)) {
          detailVersions.value = mergeDetailVersionOptions(
            versionsResponse.data.filter((item) => typeof item === "string"),
            version,
          );
        } else {
          ElMessage.error(typeof versionsResponse.message === "string" && versionsResponse.message.trim() ? versionsResponse.message : "函数版本列表加载失败");
        }
      } else {
        ElMessage.error(
          versionsResult.reason instanceof Error && versionsResult.reason.message.trim() ? versionsResult.reason.message : "函数版本列表加载失败",
        );
      }
      if (detailResult.status === "fulfilled") {
        const detailResponse = detailResult.value;
        if (detailResponse.code !== 200 || !detailResponse.data) {
          throw new Error(typeof detailResponse.message === "string" && detailResponse.message.trim() ? detailResponse.message : "函数详情查询失败");
        }
        selectedOperator.value = mapOntologyFunctionDetailToOperator(detailResponse.data, operator);
        const resolvedVersion = selectedOperator.value.version.trim() || version;
        detailVersion.value = resolvedVersion;
        detailVersions.value = mergeDetailVersionOptions(detailVersions.value, resolvedVersion);
      } else {
        throw detailResult.reason instanceof Error ? detailResult.reason : new Error("函数详情查询失败");
      }
    } catch (error) {
      if (requestId !== detailGeneration) {
        return;
      }
      ElMessage.error(error instanceof Error && error.message.trim() ? error.message : "函数详情查询失败");
    } finally {
      if (requestId === detailGeneration) {
        detailLoading.value = false;
        detailVersionsLoading.value = false;
      }
    }
  }

  /**
   * @description 切换详情抽屉版本并重新拉取该版本详情。
   * @param version 目标版本号。
   */
  async function changeDetailVersion(version: string): Promise<void> {
    const nextVersion = typeof version === "string" ? version.trim() : "";
    const listOperator = detailListOperator.value;
    const functionApi = listOperator?.functionApi.trim() || selectedOperator.value?.functionApi.trim() || "";
    if (!functionApi || !nextVersion) {
      return;
    }
    if (nextVersion === detailVersion.value.trim() && !detailLoading.value) {
      return;
    }
    const requestId = ++detailGeneration;
    detailVersion.value = nextVersion;
    detailLoading.value = true;
    try {
      const response = await getOntologyFunctionDetailInterface({ functionApi, version: nextVersion });
      if (requestId !== detailGeneration) {
        return;
      }
      if (response.code !== 200 || !response.data) {
        throw new Error(typeof response.message === "string" && response.message.trim() ? response.message : "函数详情查询失败");
      }
      selectedOperator.value = mapOntologyFunctionDetailToOperator(response.data, listOperator);
      const resolvedVersion = selectedOperator.value.version.trim() || nextVersion;
      detailVersion.value = resolvedVersion;
      detailVersions.value = mergeDetailVersionOptions(detailVersions.value, resolvedVersion);
    } catch (error) {
      if (requestId !== detailGeneration) {
        return;
      }
      ElMessage.error(error instanceof Error && error.message.trim() ? error.message : "函数详情查询失败");
    } finally {
      if (requestId === detailGeneration) {
        detailLoading.value = false;
      }
    }
  }

  /**
   * @description 打开新建弹框。
   */
  function openCreate(): void {
    editingOperator.value = null;
    formDraft.value = null;
    formVisible.value = true;
  }

  /**
   * @description 打开编辑弹框：已发布函数直接拒绝；其余先打开表单，再按 functionApi 与 version 拉取详情回填；详情失败保留列表行数据并提示。
   * @param operator 目标算子。
   */
  async function openEdit(operator: FunctionOperator): Promise<void> {
    if (operator.status === "published") {
      ElMessage.warning("已发布函数不可编辑");
      return;
    }
    const functionApi = operator.functionApi.trim();
    const version = operator.version.trim();
    if (!functionApi) {
      ElMessage.error("缺少函数 API 名称，无法编辑");
      return;
    }
    if (!version) {
      ElMessage.error("缺少函数版本，无法编辑");
      return;
    }
    editingOperator.value = operator;
    formDraft.value = null;
    formVisible.value = true;
    if (actionLoading.value) {
      return;
    }
    actionLoading.value = true;
    try {
      const response = await getOntologyFunctionDetailInterface({ functionApi, version });
      const message = typeof response.message === "string" ? response.message.trim() : "";
      if (response.code !== 200 || !response.data) {
        throw new Error(message || "函数详情查询失败");
      }
      formDraft.value = mapOntologyFunctionDetailToDraft(response.data, spaceId.value || operator.spaceId, operator.version);
    } catch (error) {
      formDraft.value = null;
      ElMessage.error(error instanceof Error && error.message.trim() ? error.message : "函数详情查询失败，已使用列表数据打开");
    } finally {
      actionLoading.value = false;
    }
  }

  /**
   * @description 由脚本创建/修改请求体组装编辑态算子，供创建成功后置灰上一步表单并走后续 PUT。
   * @param params 保存请求体。
   * @returns 编辑态 FunctionOperator。
   */
  function buildScriptOperatorFromSaveParams(params: CreateOntologyFunctionParams): FunctionOperator {
    const language = mapScriptLanguageFromApi(params.language);
    const code = typeof params.code === "string" ? params.code : "";
    return {
      id: params.functionApi.trim(),
      spaceId: params.ontologySpaceId,
      name: params.displayName.trim(),
      functionApi: params.functionApi.trim(),
      type: "code",
      apiModelType: "CUSTOMIZE",
      protocol: "HTTP",
      version: params.version.trim(),
      description: params.description.trim(),
      createdBy: "",
      createdAt: "",
      updatedAt: "",
      status: "draft",
      category: "",
      inputParameters: [],
      outputParameters: [],
      timeout: 0,
      retryCount: 0,
      retryInterval: 0,
      definition: { kind: "code", language, code },
      dependencies: [],
      testStatus: "untested",
      testedAt: "",
      versions: [],
    };
  }

  /**
   * @description 由脚本保存请求体组装表单草稿，避免创建成功后回填冲掉 IDE 中的代码。
   * @param params 保存请求体。
   * @returns 表单草稿。
   */
  function buildScriptDraftFromSaveParams(params: CreateOntologyFunctionParams): FunctionOperatorDraft {
    const operator = buildScriptOperatorFromSaveParams(params);
    return {
      id: operator.id,
      spaceId: operator.spaceId,
      name: operator.name,
      functionApi: operator.functionApi,
      type: operator.type,
      apiModelType: operator.apiModelType,
      protocol: operator.protocol,
      version: operator.version,
      description: operator.description,
      createdBy: operator.createdBy,
      createdAt: operator.createdAt,
      status: operator.status,
      category: operator.category,
      inputParameters: [],
      outputParameters: [],
      timeout: operator.timeout,
      retryCount: operator.retryCount,
      retryInterval: operator.retryInterval,
      definition: { ...operator.definition },
      dependencies: [],
      testStatus: operator.testStatus,
      testedAt: operator.testedAt,
    };
  }

  /**
   * @description 保存脚本函数（CUSTOMIZE）；无 editingOperator 走创建 POST，有则走修改 PUT。创建与编辑成功后均保留弹框并刷新编辑态。
   * @param params 创建/修改请求体（同形）。
   */
  async function saveScriptOperator(params: CreateOntologyFunctionParams): Promise<void> {
    if (actionLoading.value) {
      return;
    }
    if (params.type !== "CUSTOMIZE") {
      ElMessage.warning("仅支持保存脚本函数");
      return;
    }
    actionLoading.value = true;
    try {
      if (editingOperator.value) {
        const { basedOnOldVersion: _basedOnOldVersion, rateLimitTemplateId: _rateLimitTemplateId, ...updateParams } = params;
        const response = await updateOntologyFunctionInterface(updateParams);
        if (response.code !== 200) {
          throw new Error(response.message || "脚本函数保存失败");
        }
        ElMessage.success("脚本函数已更新");
      } else {
        const response = await createOntologyFunctionInterface(params);
        if (response.code !== 200) {
          throw new Error(response.message || "脚本函数创建失败");
        }
        ElMessage.success("脚本函数草稿已保存");
      }
      const nextOperator = buildScriptOperatorFromSaveParams(params);
      editingOperator.value = nextOperator;
      formDraft.value = buildScriptDraftFromSaveParams(params);
      await loadOperators();
    } catch (error) {
      ElMessage.error(error instanceof Error && error.message.trim() ? error.message : "脚本函数保存失败");
    } finally {
      actionLoading.value = false;
    }
  }

  /**
   * @description 保存外部 API 函数（EXTERNAL）；无 editingOperator 走创建 POST，有则走修改 PUT，请求体与新建一致。
   * @param params 创建或修改请求体。
   */
  async function saveExternalApiOperator(params: CreateOntologyFunctionParams): Promise<void> {
    if (actionLoading.value) {
      return;
    }
    if (params.type !== "EXTERNAL") {
      ElMessage.warning("仅支持保存外部 API 函数");
      return;
    }
    actionLoading.value = true;
    try {
      if (editingOperator.value) {
        const { rateLimitTemplateId: _rateLimitTemplateId, ...updateParams } = params;
        const response = await updateOntologyFunctionInterface(updateParams);
        if (response.code !== 200) {
          throw new Error(response.message || "外部 API 函数保存失败");
        }
        ElMessage.success("外部 API 函数已更新");
      } else {
        const response = await createOntologyFunctionInterface(params);
        if (response.code !== 200) {
          throw new Error(response.message || "外部 API 函数创建失败");
        }
        ElMessage.success("外部 API 函数草稿已保存");
      }
      formVisible.value = false;
      formDraft.value = null;
      editingOperator.value = null;
      await loadOperators();
    } catch (error) {
      ElMessage.error(error instanceof Error && error.message.trim() ? error.message : "外部 API 函数保存失败");
    } finally {
      actionLoading.value = false;
    }
  }

  /**
   * @description 新建容器算子：调用容器创建接口，成功后关闭表单并刷新列表。
   * @param params 容器算子创建请求参数。
   */
  async function saveContainerOperator(params: CreateOntologyFunctionContainerParams): Promise<void> {
    if (actionLoading.value) {
      return;
    }
    actionLoading.value = true;
    try {
      const response = await postCreateOntologyFunctionContainerInterface(params);
      if (response.code !== 200) {
        throw new Error(response.message || "容器算子创建失败");
      }
      ElMessage.success("容器算子草稿已保存");
      formVisible.value = false;
      formDraft.value = null;
      editingOperator.value = null;
      await loadOperators();
    } catch (error) {
      ElMessage.error(error instanceof Error && error.message.trim() ? error.message : "容器算子保存失败");
    } finally {
      actionLoading.value = false;
    }
  }

  /**
   * @description 保存函数编排（COMPOSITE）；无 editingOperator 走创建 POST，有则走修改 PUT。
   * @param params COMPOSITE 创建/修改请求参数。
   */
  async function saveCompositeOperator(params: CreateOntologyFunctionParams): Promise<void> {
    if (actionLoading.value) {
      return;
    }
    if (params.type !== "COMPOSITE") {
      ElMessage.warning("仅支持保存函数编排");
      return;
    }
    actionLoading.value = true;
    try {
      if (editingOperator.value) {
        const { basedOnOldVersion: _basedOnOldVersion, rateLimitTemplateId: _rateLimitTemplateId, ...updateParams } = params;
        const response = await updateOntologyFunctionInterface(updateParams);
        if (response.code !== 200) {
          throw new Error(response.message || "函数编排保存失败");
        }
        ElMessage.success("函数编排已更新");
      } else {
        const response = await createOntologyFunctionInterface(params);
        if (response.code !== 200) {
          throw new Error(response.message || "函数编排创建失败");
        }
        ElMessage.success("函数编排草稿已保存");
      }
      formVisible.value = false;
      formDraft.value = null;
      editingOperator.value = null;
      await loadOperators();
    } catch (error) {
      ElMessage.error(error instanceof Error && error.message.trim() ? error.message : "函数编排保存失败");
    } finally {
      actionLoading.value = false;
    }
  }

  /**
   * @description 保存新建或编辑草稿；无 editingOperator 走创建 POST，有则走修改 PUT。
   * @param draft 表单草稿。
   */
  async function saveOperator(draft: FunctionOperatorDraft): Promise<void> {
    if (actionLoading.value) {
      return;
    }
    if (draft.type !== "basic" || draft.definition.kind !== "basic") {
      ElMessage.warning("请选择基础函数");
      return;
    }
    actionLoading.value = true;
    try {
      const filtersDoc = parseBasicFilterConfig(draft.definition.parameterConfig);
      const queryConfig = buildOntologyFunctionQueryConfig(filtersDoc, draft.definition.aggFunc || "", draft.definition.targetProperty || "");
      const version = draft.version.trim();
      if (!version) {
        ElMessage.error("缺少函数版本，无法保存");
        return;
      }
      const payload: CreateOntologyFunctionParams = {
        functionApi: draft.functionApi.trim(),
        version: version,
        displayName: draft.name.trim(),
        description: draft.description.trim(),
        type: "BASIC_QUERY",
        ontologySpaceId: draft.spaceId,
        queryConfig,
      };
      if (editingOperator.value) {
        const response = await updateOntologyFunctionInterface(payload);
        if (response.code !== 200) {
          throw new Error(response.message || "函数保存失败");
        }
        ElMessage.success("函数已更新");
      } else {
        payload.basedOnOldVersion = Boolean(draft.sourceVersion?.trim());
        if (typeof draft.rateLimitTemplateId === "number" && Number.isFinite(draft.rateLimitTemplateId)) {
          payload.rateLimitTemplateId = draft.rateLimitTemplateId;
        }
        const response = await createOntologyFunctionInterface(payload);
        if (response.code !== 200) {
          throw new Error(response.message || "函数创建失败");
        }
        ElMessage.success("函数草稿已保存");
      }
      formVisible.value = false;
      formDraft.value = null;
      editingOperator.value = null;
      await loadOperators();
    } catch (error) {
      ElMessage.error(error instanceof Error && error.message.trim() ? error.message : "函数保存失败");
    } finally {
      actionLoading.value = false;
    }
  }

  /**
   * @description 打开函数算子删除确认弹框。
   * @param operator 目标算子。
   */
  function openDeleteOperator(operator: FunctionOperator): void {
    const functionApi = operator.functionApi.trim();
    const version = operator.version.trim();
    if (!functionApi) {
      ElMessage.error("缺少函数 API 名称，无法删除");
      return;
    }
    if (!version) {
      ElMessage.error("缺少函数版本，无法删除");
      return;
    }
    deleteError.value = "";
    deletingOperator.value = operator;
    deleteVisible.value = true;
  }

  /**
   * @description 确认删除函数算子：按 functionApi 与 version 调删除接口并刷新列表。
   */
  async function confirmDeleteOperator(): Promise<void> {
    if (deleteSubmitting.value) {
      return;
    }
    const operator = deletingOperator.value;
    const functionApi = operator?.functionApi.trim() ?? "";
    const version = operator?.version.trim() ?? "";
    if (!operator || !functionApi) {
      deleteError.value = "缺少函数 API 名称，无法删除";
      return;
    }
    if (!version) {
      deleteError.value = "缺少函数版本，无法删除";
      return;
    }
    deleteSubmitting.value = true;
    deleteError.value = "";
    try {
      const response = await deleteOntologyFunctionInterface({ functionApi, version });
      if (response.code !== 200) {
        throw new Error(response.message.trim() || "函数删除失败");
      }
      deleteVisible.value = false;
      deletingOperator.value = null;
      detailVisible.value = false;
      selectedOperator.value = null;
      ElMessage.success("函数已删除");
      await loadOperators();
    } catch (error) {
      deleteError.value = error instanceof Error && error.message.trim() ? error.message : "函数删除失败";
    } finally {
      deleteSubmitting.value = false;
    }
  }

  /**
   * @description 发布或下线函数算子；分别调用 publish / unpublish 真实接口。
   * @param operator 目标算子。
   */
  async function togglePublish(operator: FunctionOperator): Promise<void> {
    const functionApi = operator.functionApi.trim();
    const version = operator.version.trim();
    const isUnpublish = operator.status === "published";
    const actionLabel = isUnpublish ? "下线" : "发布";

    if (!functionApi) {
      ElMessage.error(`缺少函数 API，无法${actionLabel}`);
      return;
    }
    if (!version) {
      ElMessage.error(`缺少版本号，无法${actionLabel}`);
      return;
    }

    try {
      const response = isUnpublish
        ? await postOntologyFunctionUnpublishInterface({ functionApi, version })
        : await postOntologyFunctionPublishInterface({ functionApi, version });
      if (response.code !== 200) {
        throw new Error(typeof response.message === "string" && response.message.trim() ? response.message : `${actionLabel}失败`);
      }
      ElMessage.success(isUnpublish ? "下线成功" : "发布成功");
      if (selectedOperator.value?.id === operator.id) {
        selectedOperator.value = { ...selectedOperator.value, status: isUnpublish ? "draft" : "published" };
      }
      await loadOperators();
    } catch (error) {
      ElMessage.error(error instanceof Error && error.message.trim() ? error.message : `${actionLabel}失败`);
    }
  }

  /**
   * @description 根据当前对象、绑定键与属性选择刷新测试请求 JSON 预览。
   */
  function refreshTestRequestPreview(): void {
    const functionApi = testingOperator.value?.functionApi.trim() ?? "";
    const version = testingOperator.value?.version.trim() ?? "";
    if (!functionApi) {
      testInput.value = "{}";
      return;
    }
    const request = buildOntologyFunctionTestRequest({
      functionApi,
      version,
      ontologyIdentifier: testSelectedOntologyId.value,
      bindingKeys: testBindingKeys.value,
      propertyBindings: { ...testPropertyBindings },
    });
    testInput.value = `${JSON.stringify(request, null, 2)}\n`;
  }

  /**
   * @description 判断算子是否应按脚本函数测试弹框处理。脚本函数、外部 API、容器算子与函数编排共用该弹框。
   * @param operator 目标算子。
   * @returns 为脚本函数、外部 API、容器算子或函数编排时返回 true。
   */
  function isScriptFunctionOperator(operator: FunctionOperator): boolean {
    return (
      operator.type === "code" ||
      operator.type === "api" ||
      operator.type === "docker" ||
      operator.type === "composite" ||
      operator.apiModelType === "CUSTOMIZE" ||
      operator.apiModelType === "EXTERNAL" ||
      operator.apiModelType === "CONTAINER" ||
      operator.apiModelType === "COMPOSITE"
    );
  }

  /**
   * @description 清空属性绑定并按当前 bindingKeys 重建空选择。
   */
  function resetTestPropertyBindings(): void {
    for (const key of Object.keys(testPropertyBindings)) {
      delete testPropertyBindings[key];
    }
    for (const key of testBindingKeys.value) {
      testPropertyBindings[key] = "";
    }
  }

  /**
   * @description 加载当前空间下可选对象列表。
   */
  async function loadTestObjectOptions(): Promise<void> {
    if (!spaceId.value) {
      testObjectOptions.value = [];
      return;
    }
    testObjectLoading.value = true;
    try {
      const response = await getOntologyCategoryTreeInterface({ spaceId: String(spaceId.value) });
      if (response.code !== 200 || !response.data) {
        throw new Error(typeof response.message === "string" && response.message.trim() ? response.message : "对象列表加载失败");
      }
      testObjectOptions.value = mapOntologyObjectsToRelationOptions(response.data);
    } catch (error) {
      testObjectOptions.value = [];
      ElMessage.error(error instanceof Error && error.message.trim() ? error.message : "对象列表加载失败");
    } finally {
      testObjectLoading.value = false;
    }
  }

  /**
   * @description 按所选对象加载属性选项，并刷新请求预览。
   * @param ontologyIdentifier 对象唯一标识。
   */
  async function selectTestOntology(ontologyIdentifier: string): Promise<void> {
    testSelectedOntologyId.value = ontologyIdentifier;
    resetTestPropertyBindings();
    testPropertyOptions.value = [];
    refreshTestRequestPreview();
    const id = ontologyIdentifier.trim();
    if (!id) {
      return;
    }
    testPropertyLoading.value = true;
    try {
      const response = await getOntologyPropertyByOntologyIdInterface({ ontologyUniqueIdentifier: id });
      if (response.code !== 200 || !response.data) {
        throw new Error(typeof response.message === "string" && response.message.trim() ? response.message : "属性列表加载失败");
      }
      const options = new Map<string, SpaceRelationObjectOption>();
      for (const item of response.data) {
        const value = typeof item.apiName === "string" ? item.apiName.trim() : "";
        if (!value || options.has(value)) {
          continue;
        }
        const label = typeof item.displayName === "string" && item.displayName.trim() ? item.displayName.trim() : value;
        options.set(value, { value, label });
      }
      testPropertyOptions.value = [...options.values()].sort((a, b) => a.label.localeCompare(b.label, "zh-CN") || a.value.localeCompare(b.value));
    } catch (error) {
      testPropertyOptions.value = [];
      ElMessage.error(error instanceof Error && error.message.trim() ? error.message : "属性列表加载失败");
    } finally {
      testPropertyLoading.value = false;
      refreshTestRequestPreview();
    }
  }

  /**
   * @description 更新单个 variableBindings 键对应的属性 apiName。
   * @param bindingKey 绑定键。
   * @param apiName 属性 apiName。
   */
  function updateTestPropertyBinding(bindingKey: string, apiName: string): void {
    testPropertyBindings[bindingKey] = apiName;
    refreshTestRequestPreview();
  }

  /**
   * @description 打开测试对话框：脚本函数、外部 API、容器算子与函数编排走独立弹框，基础函数拉详情生成绑定键并加载对象列表。
   * @param operator 目标算子。
   */
  async function openTest(operator: FunctionOperator): Promise<void> {
    if (isScriptFunctionOperator(operator)) {
      await openScriptTest(operator);
      return;
    }
    const functionApi = operator.functionApi.trim();
    const version = operator.version.trim();
    if (!functionApi) {
      ElMessage.error("缺少函数 API 名称，无法测试");
      return;
    }
    if (!version) {
      ElMessage.error("缺少函数版本，无法测试");
      return;
    }
    testingOperator.value = operator;
    testBindingKeys.value = [];
    testSelectedOntologyId.value = "";
    testPropertyOptions.value = [];
    testObjectOptions.value = [];
    resetTestPropertyBindings();
    testInput.value = "{}";
    testOutput.value = "";
    testVisible.value = true;
    testDetailLoading.value = true;
    try {
      const response = await getOntologyFunctionDetailInterface({ functionApi, version });
      if (response.code !== 200 || !response.data) {
        throw new Error(typeof response.message === "string" && response.message.trim() ? response.message : "函数详情查询失败");
      }
      testBindingKeys.value = buildOntologyFunctionTestBindingKeys(response.data.params ?? []);
      resetTestPropertyBindings();
      refreshTestRequestPreview();
      await loadTestObjectOptions();
    } catch (error) {
      ElMessage.error(error instanceof Error && error.message.trim() ? error.message : "函数详情查询失败");
    } finally {
      testDetailLoading.value = false;
    }
  }

  /**
   * @description 打开脚本函数测试弹框：拉详情 INPUT 参数并渲染表单。
   * @param operator 目标算子。
   */
  async function openScriptTest(operator: FunctionOperator): Promise<void> {
    const functionApi = operator.functionApi.trim();
    const version = operator.version.trim();
    if (!functionApi) {
      ElMessage.error("缺少函数 API 名称，无法测试");
      return;
    }
    if (!version) {
      ElMessage.error("缺少函数版本，无法测试");
      return;
    }
    const requestId = ++scriptTestGeneration;
    scriptTestingOperator.value = operator;
    scriptTestInputRows.value = [];
    scriptTestOutput.value = "";
    scriptTestVisible.value = true;
    scriptTestDetailLoading.value = true;
    try {
      const response = await getOntologyFunctionDetailInterface({ functionApi, version });
      if (disposed || requestId !== scriptTestGeneration) {
        return;
      }
      if (response.code !== 200 || !response.data) {
        throw new Error(typeof response.message === "string" && response.message.trim() ? response.message : "函数详情查询失败");
      }
      scriptTestInputRows.value = buildOntologyFunctionScriptTestInputRows(response.data.params ?? []);
    } catch (error) {
      if (disposed || requestId !== scriptTestGeneration) {
        return;
      }
      ElMessage.error(error instanceof Error && error.message.trim() ? error.message : "函数详情查询失败");
    } finally {
      if (requestId === scriptTestGeneration) {
        scriptTestDetailLoading.value = false;
      }
    }
  }

  /**
   * @description 按从根到叶子的序号路径更新脚本测试入参值。
   * @param path 各层序号。
   * @param paramValue 参数值。
   */
  function updateScriptTestParamValue(path: number[], paramValue: string): void {
    scriptTestInputRows.value = writeOntologyFunctionScriptTestParamValue(scriptTestInputRows.value, path, paramValue);
  }

  /**
   * @description 解析预览 JSON 并调用函数测试接口；将完整响应写入输出结果文本框。
   */
  async function runTest(): Promise<void> {
    if (!testingOperator.value || testing.value) {
      return;
    }
    let payload: TestOntologyFunctionParams;
    try {
      const parsed: unknown = JSON.parse(testInput.value);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("测试参数必须是 JSON 对象");
      }
      const record = parsed as Record<string, unknown>;
      const functionApi = typeof record.functionApi === "string" ? record.functionApi.trim() : "";
      const version = typeof record.version === "string" && record.version.trim() ? record.version.trim() : testingOperator.value.version.trim();
      const ontologyIdentifier = typeof record.ontologyIdentifier === "string" ? record.ontologyIdentifier.trim() : "";
      if (!functionApi) {
        throw new Error("缺少 functionApi");
      }
      if (!version) {
        throw new Error("缺少 version");
      }
      if (!ontologyIdentifier) {
        throw new Error("请先选择对象");
      }
      const bindingsRaw = record.variableBindings;
      if (typeof bindingsRaw !== "object" || bindingsRaw === null || Array.isArray(bindingsRaw)) {
        throw new Error("variableBindings 必须是对象");
      }
      const variableBindings: Record<string, string> = {};
      for (const [key, value] of Object.entries(bindingsRaw)) {
        if (typeof value === "string" && value.trim()) {
          variableBindings[key] = value.trim();
        }
      }
      for (const key of testBindingKeys.value) {
        if (!variableBindings[key]) {
          throw new Error(`请为参数「${key}」选择属性`);
        }
      }
      payload = {
        functionApi,
        version,
        ontologyIdentifier,
        variableBindings,
        pageNum: typeof record.pageNum === "number" ? record.pageNum : 1,
        pageSize: typeof record.pageSize === "number" ? record.pageSize : 10,
      };
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : "测试参数格式错误");
      return;
    }
    testing.value = true;
    testOutput.value = "";
    try {
      const response = await testOntologyFunctionInterface(payload);
      testOutput.value = `${JSON.stringify(response, null, 2)}\n`;
      if (response.code !== 200) {
        throw new Error(typeof response.message === "string" && response.message.trim() ? response.message : "函数测试失败");
      }
      ElMessage.success("测试成功");
    } catch (error) {
      const message = error instanceof Error && error.message.trim() ? error.message : "函数测试失败";
      if (!testOutput.value.trim()) {
        testOutput.value = `${JSON.stringify({ code: null, message, success: false, data: null }, null, 2)}\n`;
      }
      ElMessage.error(message);
    } finally {
      testing.value = false;
    }
  }

  /**
   * @description 按表单入参调用脚本函数测试接口；将完整响应写入执行结果区。
   */
  async function runScriptTest(): Promise<void> {
    if (!scriptTestingOperator.value || scriptTesting.value || scriptTestDetailLoading.value) {
      return;
    }
    const functionApi = scriptTestingOperator.value.functionApi.trim();
    const version = scriptTestingOperator.value.version.trim();
    if (!functionApi) {
      ElMessage.error("缺少函数 API 名称，无法测试");
      return;
    }
    if (!version) {
      ElMessage.error("缺少函数版本，无法测试");
      return;
    }
    const requestId = ++scriptTestGeneration;
    const payload = buildOntologyFunctionScriptTestRequest({
      functionApi,
      version,
      rows: scriptTestInputRows.value,
    });
    scriptTesting.value = true;
    scriptTestOutput.value = "";
    try {
      const response = await testOntologyFunctionInterface(payload);
      if (disposed || requestId !== scriptTestGeneration) {
        return;
      }
      scriptTestOutput.value = `${JSON.stringify(response, null, 2)}\n`;
      if (response.code !== 200) {
        throw new Error(typeof response.message === "string" && response.message.trim() ? response.message : "函数测试失败");
      }
      ElMessage.success("测试成功");
    } catch (error) {
      if (disposed || requestId !== scriptTestGeneration) {
        return;
      }
      const message = error instanceof Error && error.message.trim() ? error.message : "函数测试失败";
      if (!scriptTestOutput.value.trim()) {
        scriptTestOutput.value = `${JSON.stringify({ code: null, message, success: false, data: null }, null, 2)}\n`;
      }
      ElMessage.error(message);
    } finally {
      if (requestId === scriptTestGeneration) {
        scriptTesting.value = false;
      }
    }
  }

  watch(detailVisible, (visible) => {
    if (!visible) {
      resetDetailVersionState();
      selectedOperator.value = null;
    }
  });

  watch(spaceId, () => {
    page.value = 1;
    selectedOperator.value = null;
    detailVisible.value = false;
    resetDetailVersionState();
    void loadOperators();
  });

  onMounted(() => {
    void loadOperators();
  });

  onUnmounted(() => {
    disposed = true;
  });

  return {
    spaceId,
    operators,
    total,
    page,
    pageSize,
    loading,
    errorMessage,
    actionLoading,
    viewMode,
    sortValue,
    updatedRange,
    filters,
    creatorOptions,
    selectedOperator,
    detailVisible,
    detailLoading,
    detailVersions,
    detailVersion,
    detailVersionsLoading,
    editingOperator,
    formDraft,
    formVisible,
    testVisible,
    testingOperator,
    testInput,
    testOutput,
    testing,
    testDetailLoading,
    testObjectLoading,
    testPropertyLoading,
    testBindingKeys,
    testObjectOptions,
    testPropertyOptions,
    testSelectedOntologyId,
    testPropertyBindings,
    scriptTestVisible,
    scriptTestingOperator,
    scriptTestInputRows,
    scriptTestOutput,
    scriptTesting,
    scriptTestDetailLoading,
    deleteVisible,
    deleteSubmitting,
    deleteError,
    deletingOperator,
    loadOperators,
    resetFilters,
    applyFilters,
    openDetail,
    changeDetailVersion,
    openCreate,
    openEdit,
    saveOperator,
    saveScriptOperator,
    saveExternalApiOperator,
    saveContainerOperator,
    saveCompositeOperator,
    openDeleteOperator,
    confirmDeleteOperator,
    togglePublish,
    openTest,
    selectTestOntology,
    updateTestPropertyBinding,
    runTest,
    updateScriptTestParamValue,
    runScriptTest,
  };
}
