import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";

import { createOntologyFunctionInterface, getOntologyFunctionListInterface } from "@/apis";
import {
  deleteFunctionOperatorMock,
  setFunctionOperatorStatusMock,
  testFunctionOperatorMock,
  updateFunctionOperatorMock,
} from "@/mocks/functionOperatorMock/functionOperatorMock";
import type {
  FunctionOperator,
  FunctionOperatorDraft,
  FunctionOperatorQuery,
  FunctionOperatorStatus,
  FunctionOperatorTestResult,
  FunctionOperatorType,
  FunctionOperatorViewMode,
} from "@/types";
import { buildOntologyFunctionQueryConfig, parseBasicFilterConfig } from "@/utils/functionOperatorBasicFilter";
import { mapOntologyFunctionListItem } from "@/utils/mapOntologyFunctionList";

/**
 * @description 空间函数算子工作区：列表筛选、增删改、发布与测试（Mock）。
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
  const editingOperator = ref<FunctionOperator | null>(null);
  const formDraft = ref<FunctionOperatorDraft | null>(null);
  const formVisible = ref(false);
  const testVisible = ref(false);
  const testingOperator = ref<FunctionOperator | null>(null);
  const testInput = ref("{}");
  const testResult = ref<FunctionOperatorTestResult | null>(null);
  const testing = ref(false);
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
   * @description 打开详情抽屉。
   * @param operator 目标算子。
   */
  function openDetail(operator: FunctionOperator): void {
    selectedOperator.value = operator;
    detailVisible.value = true;
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
   * @description 打开编辑弹框。
   * @param operator 目标算子。
   */
  function openEdit(operator: FunctionOperator): void {
    editingOperator.value = operator;
    formDraft.value = null;
    formVisible.value = true;
  }

  /**
   * @description 保存新建或编辑草稿；新建走创建接口，编辑暂用本地 Mock。
   * @param draft 表单草稿。
   */
  async function saveOperator(draft: FunctionOperatorDraft): Promise<void> {
    if (actionLoading.value) {
      return;
    }
    actionLoading.value = true;
    try {
      if (draft.id) {
        const saved = updateFunctionOperatorMock(draft);
        if (!saved) {
          ElMessage.error("函数保存失败");
          return;
        }
        ElMessage.success("函数已更新");
      } else {
        if (draft.type !== "basic" || draft.definition.kind !== "basic") {
          ElMessage.warning("请选择基础函数");
          return;
        }
        const filtersDoc = parseBasicFilterConfig(draft.definition.parameterConfig);
        const queryConfig = buildOntologyFunctionQueryConfig(filtersDoc, draft.definition.aggFunc || "");
        const response = await createOntologyFunctionInterface({
          functionApi: draft.functionApi.trim(),
          displayName: draft.name.trim(),
          description: draft.description.trim(),
          type: "BASIC_QUERY",
          ontologySpaceId: draft.spaceId,
          queryConfig,
        });
        if (response.code !== 200) {
          throw new Error(response.message || "函数创建失败");
        }
        ElMessage.success("函数草稿已保存");
      }
      formVisible.value = false;
      formDraft.value = null;
      await loadOperators();
    } catch (error) {
      ElMessage.error(error instanceof Error && error.message.trim() ? error.message : "函数保存失败");
    } finally {
      actionLoading.value = false;
    }
  }

  /**
   * @description 删除函数算子。
   * @param operator 目标算子。
   */
  async function removeOperator(operator: FunctionOperator): Promise<void> {
    try {
      await ElMessageBox.confirm(`确认删除函数「${operator.name}」吗？删除后不可恢复。`, "删除确认", { type: "warning" });
    } catch {
      return;
    }
    const ok = deleteFunctionOperatorMock(spaceId.value, operator.id);
    if (!ok) {
      ElMessage.error("函数删除失败");
      return;
    }
    ElMessage.success("函数已删除");
    detailVisible.value = false;
    await loadOperators();
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
   * @description 打开测试对话框并填充默认入参。
   * @param operator 目标算子。
   */
  function openTest(operator: FunctionOperator): void {
    testingOperator.value = operator;
    testInput.value = JSON.stringify(
      Object.fromEntries(
        operator.inputParameters.map((item) => [item.name, item.type === "number" ? 0 : item.type === "boolean" ? false : item.type === "object" ? {} : ""]),
      ),
      null,
      2,
    );
    testResult.value = null;
    testVisible.value = true;
  }

  /**
   * @description 运行函数测试。
   */
  async function runTest(): Promise<void> {
    if (!testingOperator.value) {
      return;
    }
    let payload: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(testInput.value);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("测试参数必须是 JSON 对象");
      }
      payload = parsed as Record<string, unknown>;
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : "测试参数格式错误");
      return;
    }
    testing.value = true;
    try {
      const result = testFunctionOperatorMock(spaceId.value, testingOperator.value.id, payload);
      testResult.value = result;
      if (!result.success) {
        ElMessage.error(result.message);
      } else {
        ElMessage.success(result.message);
      }
      await loadOperators();
      testingOperator.value = operators.value.find((item) => item.id === testingOperator.value?.id) ?? testingOperator.value;
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
    editingOperator,
    formDraft,
    formVisible,
    testVisible,
    testingOperator,
    testInput,
    testResult,
    testing,
    loadOperators,
    resetFilters,
    applyFilters,
    openDetail,
    openCreate,
    openEdit,
    saveOperator,
    removeOperator,
    togglePublish,
    openTest,
    runTest,
  };
}
