<template>
  <section class="object-profile-entity-list" aria-label="实体列表">
    <ObjectProfileEntityDetail
      v-if="selectedEntity"
      :object-id="selectedEntity.ontologyUniqueIdentifier || objectId"
      :instance-id="selectedEntity.instanceId"
      :entity-primary-key="selectedEntity.entityPrimaryKey"
      :list-properties="selectedEntity.detailItems"
      :space-id="spaceId"
      :entity-name="resolveEntityTitle(selectedEntity)"
      @back="closeEntityDetail"
    />
    <template v-else>
      <header class="object-profile-entity-list__toolbar">
        <div class="object-profile-entity-list__filters">
          <el-select v-model="filterField" filterable clearable placeholder="筛选字段" class="object-profile-entity-list__field">
            <el-option v-for="column in visibleColumns" :key="column" :label="column" :value="column" />
          </el-select>
          <el-input v-model="filterValue" clearable placeholder="请输入筛选值" class="object-profile-entity-list__value" />
          <el-button @click="resetEntityListFilter">重置</el-button>
          <el-button type="primary" @click="applyEntityListFilter">查询</el-button>
        </div>
        <el-button type="primary" plain @click="openEntityListColumnConfig">配置</el-button>
      </header>

      <div v-if="status === 'loading'" class="object-profile-entity-list__state" role="status">
        <AircasLoading>正在加载实体列表…</AircasLoading>
      </div>
      <div v-else-if="status === 'error'" class="object-profile-entity-list__state object-profile-entity-list__state--error" role="alert">
        <p>{{ error }}</p>
        <el-button type="primary" @click="retryEntityListPage">重试</el-button>
      </div>
      <div v-else-if="status === 'empty'" class="object-profile-entity-list__state" role="status">
        <el-empty :description="error || '暂无实例'" />
      </div>
      <template v-else>
        <div class="object-profile-entity-list__table-wrap">
          <el-table :data="filteredRows" row-key="rowKey" height="100%" class="object-profile-entity-list__table" empty-text="无匹配实体">
            <el-table-column label="操作" width="88" fixed="left">
              <template #default="{ row }">
                <el-button link type="primary" @click="openEntityDetail(asEntityRow(row))">详情</el-button>
              </template>
            </el-table-column>
            <el-table-column v-for="column in visibleColumns" :key="column" :label="column" min-width="120" show-overflow-tooltip>
              <template #default="{ row }">
                {{ asEntityRow(row).cells[column] || "—" }}
              </template>
            </el-table-column>
          </el-table>
        </div>
        <footer class="object-profile-entity-list__pager">
          <el-pagination
            background
            layout="total, sizes, prev, pager, next"
            :total="total"
            :current-page="pageNum"
            :page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            @current-change="handleEntityListPageChange"
            @size-change="handleEntityListPageSizeChange"
          />
        </footer>
      </template>

      <ObjectProfileEntityListConfigDialog
        v-model="configDialogVisible"
        :columns="allColumns"
        :selected-columns="visibleColumns"
        @confirm="handleEntityListColumnConfigConfirm"
      />
    </template>
  </section>
</template>

<script setup lang="ts">
import { ref, toRef, watch } from "vue";
import { ElMessage } from "element-plus";
import AircasLoading from "@/components/AircasLoading.vue";
import { useObjectProfileEntityList, type ObjectProfileEntityRow } from "../composables/useObjectProfileEntityList";
import ObjectProfileEntityListConfigDialog from "./ObjectProfileEntityListConfigDialog.vue";
import ObjectProfileEntityDetail from "./ObjectProfileEntityDetail.vue";
import { readObjectProfileEntityPrimaryKey } from "../utils/mapObjectProfileEntityRows";

const props = defineProps<{
  objectId: string;
  objectName?: string;
  /** 对象空间 id。 */
  spaceId: string;
  /** 外部请求打开首个实体的站内详情。 */
  autoOpenDetail?: boolean;
}>();

const emit = defineEmits<{
  "detail-auto-opened": [];
  "close-detail": [];
}>();

const selectedEntity = ref<ObjectProfileEntityRow | null>(null);

const {
  status,
  error,
  allColumns,
  visibleColumns,
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
} = useObjectProfileEntityList(toRef(props, "objectId"));

/**
 * @description 应用列配置弹窗确认结果。
 * @param columns 勾选后的可见列。
 */
function handleEntityListColumnConfigConfirm(columns: string[]): void {
  applyEntityListColumnConfig(columns);
}

/**
 * @description 将表格默认行校验为实体列表行；结构不符时返回空行。
 * @param row 表格行。
 * @returns 实体列表行。
 */
function asEntityRow(row: unknown): ObjectProfileEntityRow {
  if (!row || typeof row !== "object") {
    return { rowKey: "", ontologyUniqueIdentifier: "", instanceId: "", cells: {}, detailItems: [] };
  }
  if (!("rowKey" in row) || typeof row.rowKey !== "string" || !("cells" in row) || !row.cells || typeof row.cells !== "object") {
    return { rowKey: "", ontologyUniqueIdentifier: "", instanceId: "", cells: {}, detailItems: [] };
  }
  const cells: Record<string, string> = {};
  Object.entries(row.cells).forEach(([name, value]) => {
    if (typeof value === "string") cells[name] = value;
  });
  return {
    rowKey: row.rowKey,
    ontologyUniqueIdentifier: "ontologyUniqueIdentifier" in row && typeof row.ontologyUniqueIdentifier === "string" ? row.ontologyUniqueIdentifier : "",
    instanceId: "instanceId" in row && typeof row.instanceId === "string" ? row.instanceId : "",
    entityPrimaryKey: readObjectProfileEntityPrimaryKey("entityPrimaryKey" in row ? row.entityPrimaryKey : undefined),
    cells,
    detailItems: Object.entries(cells).map(([label, value]) => ({ label, value })),
  };
}

/** @description 解析实体标题，优先名称字段，缺失时展示主键。 @param row 选中的实体。 @returns 标题文本。 */
function resolveEntityTitle(row: ObjectProfileEntityRow): string {
  return Object.entries(row.cells).find(([name, value]) => /名称|name$/i.test(name) && value)?.[1] || `${props.objectName || "实体"} · ${row.instanceId}`;
}

/** @description 打开当前实体站内详情，不重置列表分页与筛选。 @param row 当前表格行，不传时打开首条可见实体。 @returns 是否成功打开。 */
function openEntityDetail(row?: ObjectProfileEntityRow): boolean {
  const entity = row || filteredRows.value[0];
  if (!entity?.instanceId) {
    ElMessage.error("缺少实体主键，无法打开详情");
    return false;
  }
  selectedEntity.value = asEntityRow(entity);
  return true;
}

/** @description 返回原列表，保留分页、筛选和列配置。 */
function closeEntityDetail(): void {
  selectedEntity.value = null;
  emit("close-detail");
}

watch(
  () => [props.objectId, props.spaceId],
  () => {
    selectedEntity.value = null;
  },
);
watch(
  [() => props.autoOpenDetail, filteredRows, status],
  ([shouldOpen, rows, loadStatus]) => {
    if (shouldOpen && loadStatus === "ready" && rows.length && !selectedEntity.value && openEntityDetail(rows[0])) emit("detail-auto-opened");
  },
  { immediate: true },
);

defineExpose({ openEntityDetail });

/**
 * @description 按当前分页参数重新加载实体列表。
 */
function retryEntityListPage(): void {
  void loadObjectProfileEntityPage(pageNum.value, pageSize.value);
}

/**
 * @description 切换实体列表页码。
 * @param page 目标页码。
 */
function handleEntityListPageChange(page: number): void {
  void loadObjectProfileEntityPage(page, pageSize.value);
}

/**
 * @description 切换实体列表每页条数并回到第一页。
 * @param size 每页条数。
 */
function handleEntityListPageSizeChange(size: number): void {
  void loadObjectProfileEntityPage(1, size);
}
</script>

<style scoped lang="scss">
.object-profile-entity-list {
  display: flex;
  min-width: 0;
  min-height: 0;
  height: 100%;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
}

.object-profile-entity-list__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.object-profile-entity-list__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.object-profile-entity-list__field {
  width: 160px;
}

.object-profile-entity-list__value {
  width: 220px;
}

.object-profile-entity-list__table-wrap {
  min-width: 0;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.object-profile-entity-list__table {
  width: 100%;
}

.object-profile-entity-list__table :deep(.el-table__row:hover > td.el-table__cell) {
  background-color: var(--aircas-color-effect-primary-soft) !important;
}

.object-profile-entity-list__pager {
  display: flex;
  justify-content: flex-end;
}

.object-profile-entity-list__state {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--aircas-color-text-secondary);
}

.object-profile-entity-list__state--error {
  color: var(--aircas-color-danger);
}
</style>
