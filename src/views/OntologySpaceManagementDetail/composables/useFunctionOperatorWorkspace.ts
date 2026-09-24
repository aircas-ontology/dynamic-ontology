import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";

import {
  createOntologyFunctionInterface,
  deleteOntologyFunctionInterface,
  getOntologyCategoryTreeInterface,
  getOntologyFunctionDetailInterface,
  getOntologyFunctionListInterface,
  getOntologyPropertyByOntologyIdInterface,
  testOntologyFunctionInterface,
  updateOntologyFunctionInterface,
} from "@/apis";
import { setFunctionOperatorStatusMock } from "@/mocks/functionOperatorMock/functionOperatorMock";
import type {
  FunctionOperator,
  FunctionOperatorDraft,
  FunctionOperatorQuery,
  FunctionOperatorStatus,
  FunctionOperatorType,
  FunctionOperatorViewMode,
  SpaceRelationObjectOption,
  TestOntologyFunctionParams,
} from "@/types";
import { buildOntologyFunctionQueryConfig, parseBasicFilterConfig } from "@/utils/functionOperatorBasicFilter";
import { mapOntologyFunctionDetailToDraft, mapOntologyFunctionDetailToOperator } from "@/utils/mapOntologyFunctionDetail";
import { mapOntologyFunctionListItem } from "@/utils/mapOntologyFunctionList";
import { buildOntologyFunctionTestBindingKeys, buildOntologyFunctionTestRequest } from "@/utils/mapOntologyFunctionTest";

import { mapOntologyObjectsToRelationOptions } from "../utils/mapOntologyObjectsToRelationOptions";
/**
 * @description 空间函数算子工作区：列表筛选、创建/修改/删除接口与发布测试（部分 Mock）。
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
   * @description 加载函数算子列表（分页走后端；筛选暂在当前页客户端过滤）。
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
      });
      if (disposed || requestId !== generation) {
        return;
      }
      if (response.code !== 200 || !response.data) {
        throw new Error(response.message || "函数算子加载失败");
      }
      let records = response.data.records.map((item) => mapOntologyFunctionListItem(item, spaceId.value));
      const keyword = filters.keyword.trim().toLowerCase();
      if (keyword) {
        records = records.filter(
          (item) =>
            item.name.toLowerCase().includes(keyword) || item.functionApi.toLowerCase().includes(keyword) || item.description.toLowerCase().includes(keyword),
        );
      }
      if (filters.type) {
        records = records.filter((item) => item.type === filters.type);
      }
      if (filters.creator) {
        records = records.filter((item) => item.createdBy === filters.creator);
      }
      if (filters.status) {
        records = records.filter((item) => item.status === filters.status);
      }
      if (updatedRange.value?.[0]) {
        const from = updatedRange.value[0];
        records = records.filter((item) => item.updatedAt.slice(0, 10) >= from);
      }
      if (updatedRange.value?.[1]) {
        const to = updatedRange.value[1];
        records = records.filter((item) => item.updatedAt.slice(0, 10) <= to);
      }
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
   * @description 打开详情抽屉：先展示列表行，再按 functionApi 拉取详情回填。
   * @param operator 目标算子。
   */
  async function openDetail(operator: FunctionOperator): Promise<void> {
    const functionApi = operator.functionApi.trim();
    if (!functionApi) {
      ElMessage.error("缺少函数 API 名称，无法查看详情");
      return;
    }
    selectedOperator.value = operator;
    detailVisible.value = true;
    detailLoading.value = true;
    try {
      const response = await getOntologyFunctionDetailInterface({ functionApi });
      if (response.code !== 200 || !response.data) {
        throw new Error(typeof response.message === "string" && response.message.trim() ? response.message : "函数详情查询失败");
      }
      selectedOperator.value = mapOntologyFunctionDetailToOperator(response.data, operator);
    } catch (error) {
      ElMessage.error(error instanceof Error && error.message.trim() ? error.message : "函数详情查询失败");
    } finally {
      detailLoading.value = false;
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
   * @description 打开编辑弹框：先打开表单，再按 functionApi 拉取详情回填；详情失败保留列表行数据并提示。
   * @param operator 目标算子。
   */
  async function openEdit(operator: FunctionOperator): Promise<void> {
    const functionApi = operator.functionApi.trim();
    if (!functionApi) {
      ElMessage.error("缺少函数 API 名称，无法编辑");
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
      const response = await getOntologyFunctionDetailInterface({ functionApi });
      const message = typeof response.message === "string" ? response.message.trim() : "";
      if (response.code !== 200 || !response.data) {
        throw new Error(message || "函数详情查询失败");
      }
      formDraft.value = mapOntologyFunctionDetailToDraft(response.data, spaceId.value || operator.spaceId);
    } catch (error) {
      formDraft.value = null;
      ElMessage.error(error instanceof Error && error.message.trim() ? error.message : "函数详情查询失败，已使用列表数据打开");
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
      const queryConfig = buildOntologyFunctionQueryConfig(filtersDoc, draft.definition.aggFunc || "");
      const payload = {
        functionApi: draft.functionApi.trim(),
        displayName: draft.name.trim(),
        description: draft.description.trim(),
        type: "BASIC_QUERY" as const,
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
    if (!functionApi) {
      ElMessage.error("缺少函数 API 名称，无法删除");
      return;
    }
    deleteError.value = "";
    deletingOperator.value = operator;
    deleteVisible.value = true;
  }

  /**
   * @description 确认删除函数算子：按 functionApi 调删除接口并刷新列表。
   */
  async function confirmDeleteOperator(): Promise<void> {
    if (deleteSubmitting.value) {
      return;
    }
    const operator = deletingOperator.value;
    const functionApi = operator?.functionApi.trim() ?? "";
    if (!operator || !functionApi) {
      deleteError.value = "缺少函数 API 名称，无法删除";
      return;
    }
    deleteSubmitting.value = true;
    deleteError.value = "";
    try {
      const response = await deleteOntologyFunctionInterface({ functionApi });
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
   * @description 发布或下线函数算子。
   * @param operator 目标算子。
   */
  async function togglePublish(operator: FunctionOperator): Promise<void> {
    const nextStatus = operator.status === "published" ? "disabled" : "published";
    const updated = setFunctionOperatorStatusMock(spaceId.value, operator.id, nextStatus);
    if (!updated) {
      ElMessage.error("状态更新失败");
      return;
    }
    ElMessage.success(nextStatus === "published" ? "已发布" : "已下线");
    selectedOperator.value = updated;
    await loadOperators();
  }

  /**
   * @description 根据当前对象、绑定键与属性选择刷新测试请求 JSON 预览。
   */
  function refreshTestRequestPreview(): void {
    const functionApi = testingOperator.value?.functionApi.trim() ?? "";
    if (!functionApi) {
      testInput.value = "{}";
      return;
    }
    const request = buildOntologyFunctionTestRequest({
      functionApi,
      ontologyIdentifier: testSelectedOntologyId.value,
      bindingKeys: testBindingKeys.value,
      propertyBindings: { ...testPropertyBindings },
    });
    testInput.value = `${JSON.stringify(request, null, 2)}\n`;
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
   * @description 加载当前空间下可选本体对象列表。
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
   * @description 按所选本体加载属性选项，并刷新请求预览。
   * @param ontologyIdentifier 本体唯一标识。
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
   * @description 打开测试对话框：拉详情生成绑定键，并加载空间对象列表。
   * @param operator 目标算子。
   */
  async function openTest(operator: FunctionOperator): Promise<void> {
    const functionApi = operator.functionApi.trim();
    if (!functionApi) {
      ElMessage.error("缺少函数 API 名称，无法测试");
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
      const response = await getOntologyFunctionDetailInterface({ functionApi });
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
      const ontologyIdentifier = typeof record.ontologyIdentifier === "string" ? record.ontologyIdentifier.trim() : "";
      if (!functionApi) {
        throw new Error("缺少 functionApi");
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

  watch(spaceId, () => {
    page.value = 1;
    selectedOperator.value = null;
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
    deleteVisible,
    deleteSubmitting,
    deleteError,
    deletingOperator,
    loadOperators,
    resetFilters,
    applyFilters,
    openDetail,
    openCreate,
    openEdit,
    saveOperator,
    openDeleteOperator,
    confirmDeleteOperator,
    togglePublish,
    openTest,
    selectTestOntology,
    updateTestPropertyBinding,
    runTest,
  };
}
