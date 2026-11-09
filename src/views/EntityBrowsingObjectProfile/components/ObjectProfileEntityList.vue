<template>
  <section class="object-profile-entity-list" aria-label="实体列表">
    <template v-if="detailEmbedded">
      <header class="object-profile-entity-list__embed-header">
        <el-button type="primary" plain @click="closeEntityDetail">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </header>
      <iframe
        class="object-profile-entity-list__embed"
        :src="ENTITY_BROWSING_ENTITY_DETAIL_URL"
        title="实体详情"
        referrerpolicy="no-referrer"
      />
    </template>
    <template v-else>
      <header class="object-profile-entity-list__toolbar">
        <div class="object-profile-entity-list__filters">
          <el-select v-model="filterField" clearable placeholder="筛选字段" class="object-profile-entity-list__field">
            <el-option v-for="column in visibleColumns" :key="column" :label="column" :value="column" />
          </el-select>
          <el-input v-model="filterValue" clearable placeholder="请输入筛选值" class="object-profile-entity-list__value" />
          <el-button @click="resetEntityListFilter">重置</el-button>
          <el-button type="primary" @click="applyEntityListFilter">查询</el-button>
        </div>
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
              <template #default>
                <el-button link type="primary" @click="openEntityDetail">详情</el-button>
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

    </template>
  </section>
</template>

<script setup lang="ts">
import { ref, toRef, watch } from "vue";
import { ArrowLeft } from "@element-plus/icons-vue";
import AircasLoading from "@/components/AircasLoading.vue";
import { ENTITY_BROWSING_ENTITY_DETAIL_URL } from "@/utils/entityBrowseConstants";
import { useObjectProfileEntityList, type ObjectProfileEntityRow } from "../composables/useObjectProfileEntityList";

const props = defineProps<{
  objectId: string;
  /** 外部请求立即打开与「详情」相同的嵌入页。 */
  autoOpenDetail?: boolean;
}>();

const emit = defineEmits<{
  "detail-auto-opened": [];
  "close-detail": [];
}>();

const detailEmbedded = ref(false);

const {
  status,
  error,
  visibleColumns,
  filteredRows,
  total,
  pageNum,
  pageSize,
  filterField,
  filterValue,
  loadObjectProfileEntityPage,
  applyEntityListFilter,
  resetEntityListFilter,
} = useObjectProfileEntityList(toRef(props, "objectId"));

/**
 * @description 将表格默认行校验为实体列表行；结构不符时返回空行。
 * @param row 表格行。
 * @returns 实体列表行。
 */
function asEntityRow(row: unknown): ObjectProfileEntityRow {
  if (!row || typeof row !== "object") return { rowKey: "", cells: {}, detailItems: [] };
  const candidate = row as Partial<ObjectProfileEntityRow>;
  if (typeof candidate.rowKey !== "string" || !candidate.cells || typeof candidate.cells !== "object") {
    return { rowKey: "", cells: {}, detailItems: [] };
  }
  return {
    rowKey: candidate.rowKey,
    cells: candidate.cells,
    detailItems: Array.isArray(candidate.detailItems) ? candidate.detailItems : [],
  };
}

/**
 * @description 在当前区域嵌入固定舰船画像地址（与操作列「详情」相同）。
 */
function openEntityDetail(): void {
  detailEmbedded.value = true;
}

/**
 * @description 关闭嵌入详情并回到实体列表。
 */
function closeEntityDetail(): void {
  detailEmbedded.value = false;
  emit("close-detail");
}

watch(
  () => props.autoOpenDetail,
  (shouldOpen) => {
    if (!shouldOpen) return;
    openEntityDetail();
    emit("detail-auto-opened");
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

.object-profile-entity-list__embed-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
}

.object-profile-entity-list__embed {
  display: block;
  width: 100%;
  min-height: 0;
  flex: 1;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: var(--aircas-color-panel-background-deep);
}

.object-profile-entity-list__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
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
