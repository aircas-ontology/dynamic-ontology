import { computed, onUnmounted, ref, watch, type Ref } from "vue";
import { getOntologyEntitiesInterface } from "@/apis";
import { createObjectProfileEntityListMockRecords } from "@/mocks/objectProfileEntityListMock/objectProfileEntityListMock";
import type { OntologyEntityInfo, OntologySpaceDetailLoadStatus } from "@/types";
import { isUseMockEnabled } from "@/utils/isUseMockEnabled";
import {
  appendNewObjectProfileEntityColumns,
  collectObjectProfileEntityColumns,
  filterObjectProfileEntityRows,
  mapObjectProfileEntityRows,
  readObjectProfileEntityVisibleColumns,
  resolveObjectProfileEntityVisibleColumns,
  writeObjectProfileEntityVisibleColumns,
  type ObjectProfileEntityRow,
} from "../utils/mapObjectProfileEntityRows";

/** 实体列表默认每页条数。 */
export const OBJECT_PROFILE_ENTITY_LIST_PAGE_SIZE = 20;

/**
 * @description 按对象 id 分页加载实体列表，支持当前页前端筛选、列显隐配置与过期响应丢弃。
 * @param objectId 对象唯一标识。
 * @returns 列表状态、分页、筛选、列配置与加载方法。
 */
export function useObjectProfileEntityList(objectId: Ref<string>) {
  const status = ref<OntologySpaceDetailLoadStatus>("loading");
  const error = ref("");
  const records = ref<OntologyEntityInfo[]>([]);
  const total = ref(0);
  const pageNum = ref(1);
  const pageSize = ref(OBJECT_PROFILE_ENTITY_LIST_PAGE_SIZE);
  const filterField = ref("");
  const filterValue = ref("");
  const appliedField = ref("");
  const appliedValue = ref("");
  const visibleColumnSelection = ref<string[] | null>(null);
  const configDialogVisible = ref(false);
  let generation = 0;
  let disposed = false;

  const allColumns = computed(() => collectObjectProfileEntityColumns(records.value));
  const visibleColumns = computed(() =>
    resolveObjectProfileEntityVisibleColumns(allColumns.value, visibleColumnSelection.value),
  );
  const rows = computed(() => mapObjectProfileEntityRows(records.value));
  const filteredRows = computed(() => filterObjectProfileEntityRows(rows.value, appliedField.value, appliedValue.value));

  /**
   * @description 从本地恢复当前对象的列勾选；无历史时置 null（默认全选）。
   */
  function restoreVisibleColumnsFromStorage(): void {
    visibleColumnSelection.value = readObjectProfileEntityVisibleColumns(objectId.value);
  }

  /**
   * @description 请求指定页的实体实例；无 objectId 时置 empty，失败置 error。
   * @param nextPage 目标页码。
   * @param nextPageSize 可选每页条数。
   */
  async function loadObjectProfileEntityPage(nextPage = pageNum.value, nextPageSize = pageSize.value): Promise<void> {
    const id = objectId.value.trim();
    const request = ++generation;
    status.value = "loading";
    error.value = "";

    if (!id) {
      records.value = [];
      total.value = 0;
      status.value = "empty";
      error.value = "缺少对象标识，无法加载实体列表。";
      return;
    }

    pageNum.value = nextPage;
    pageSize.value = nextPageSize;

    /** USE_MOCK 时用前端写死样例，内网无实体列表接口也能展示。 */
    if (isUseMockEnabled()) {
      if (disposed || request !== generation) return;
      const nextRecords = createObjectProfileEntityListMockRecords();
      records.value = nextRecords;
      total.value = nextRecords.length;
      status.value = nextRecords.length ? "ready" : "empty";
      error.value = nextRecords.length ? "" : "暂无实例";
      return;
    }

    try {
      const response = await getOntologyEntitiesInterface({
        ontologyUniqueIdentifier: id,
        pageNum: nextPage,
        pageSize: nextPageSize,
      });
      if (disposed || request !== generation) return;
      if (response.code !== 200) {
        throw new Error(response.message || "实体列表加载失败");
      }
      const data = response.data;
      const nextRecords = Array.isArray(data?.records) ? data.records : [];
      records.value = nextRecords;
      total.value = Number(data?.total) || nextRecords.length;
      pageNum.value = Number(data?.current) || nextPage;
      pageSize.value = Number(data?.size) || nextPageSize;
      status.value = nextRecords.length ? "ready" : "empty";
      error.value = nextRecords.length ? "" : "暂无实例";
    } catch (cause) {
      if (disposed || request !== generation) return;
      records.value = [];
      total.value = 0;
      status.value = "error";
      error.value = cause instanceof Error && cause.message.trim() ? cause.message : "实体列表加载失败，请重试。";
    }
  }

  /**
   * @description 应用当前筛选字段与筛选值到已加载页数据。
   */
  function applyEntityListFilter(): void {
    appliedField.value = filterField.value;
    appliedValue.value = filterValue.value;
  }

  /**
   * @description 清空筛选条件并恢复当前页全量展示。
   */
  function resetEntityListFilter(): void {
    filterField.value = "";
    filterValue.value = "";
    appliedField.value = "";
    appliedValue.value = "";
  }

  /**
   * @description 打开列配置弹窗。
   */
  function openEntityListColumnConfig(): void {
    configDialogVisible.value = true;
  }

  /**
   * @description 保存可见列并关闭配置弹窗；空选择时不写入。
   * @param columns 用户勾选的列。
   * @returns 是否保存成功。
   */
  function applyEntityListColumnConfig(columns: readonly string[]): boolean {
    const selected = new Set(columns);
    const next = allColumns.value.filter((column) => selected.has(column));
    if (!next.length && allColumns.value.length) {
      return false;
    }
    visibleColumnSelection.value = next;
    writeObjectProfileEntityVisibleColumns(objectId.value, next);
    if (filterField.value && !next.includes(filterField.value)) {
      filterField.value = "";
      appliedField.value = "";
    }
    configDialogVisible.value = false;
    return true;
  }

  watch(
    objectId,
    () => {
      resetEntityListFilter();
      restoreVisibleColumnsFromStorage();
      void loadObjectProfileEntityPage(1, pageSize.value);
    },
    { immediate: true },
  );

  watch(allColumns, (nextColumns, previousColumns) => {
    if (!visibleColumnSelection.value) return;
    const merged = appendNewObjectProfileEntityColumns(nextColumns, previousColumns ?? [], visibleColumnSelection.value);
    if (merged.length === visibleColumnSelection.value.length && merged.every((column, index) => column === visibleColumnSelection.value?.[index])) {
      return;
    }
    visibleColumnSelection.value = merged;
    writeObjectProfileEntityVisibleColumns(objectId.value, merged);
  });

  onUnmounted(() => {
    disposed = true;
    generation += 1;
  });

  return {
    status,
    error,
    allColumns,
    visibleColumns,
    rows,
    filteredRows,
    total,
    pageNum,
    pageSize,
    filterField,
    filterValue,
    configDialogVisible,
    loadObjectProfileEntityPage,
    applyEntityListFilter,
    resetEntityListFilter,
    openEntityListColumnConfig,
    applyEntityListColumnConfig,
  };
}

export type { ObjectProfileEntityRow };
