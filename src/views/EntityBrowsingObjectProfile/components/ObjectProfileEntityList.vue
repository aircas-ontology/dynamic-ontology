<template>
  <section class="object-profile-entity-list" aria-label="实体列表">
    <template v-if="detailEmbedded">
      <header class="object-profile-entity-list__embed-header">
        <el-button type="primary" plain @click="closeEntityDetail">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </header>
      <div v-if="detailStatus === 'loading'" class="object-profile-entity-list__state" role="status">
        <AircasLoading>正在加载实体详情…</AircasLoading>
      </div>
      <div v-else-if="detailStatus === 'error'" class="object-profile-entity-list__state object-profile-entity-list__state--error" role="alert">
        <p>{{ detailError }}</p>
        <el-button type="primary" @click="retryEntityDetailUrl">重试</el-button>
      </div>
      <iframe v-else-if="detailUrl" class="object-profile-entity-list__embed" :src="detailUrl" title="实体详情" referrerpolicy="no-referrer" />
      <div v-else class="object-profile-entity-list__state" role="status">暂无实体详情地址</div>
    </template>
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
import { onScopeDispose, ref, toRef, watch } from "vue";
import { ArrowLeft } from "@element-plus/icons-vue";
import { getOntologyInstanceUrlListInterface } from "@/apis";
import AircasLoading from "@/components/AircasLoading.vue";
import { ENTITY_BROWSING_ENTITY_DETAIL_URL } from "@/utils/entityBrowseConstants";
import { isUseMockEnabled } from "@/utils/isUseMockEnabled";
import { useObjectProfileEntityList, type ObjectProfileEntityRow } from "../composables/useObjectProfileEntityList";
import ObjectProfileEntityListConfigDialog from "./ObjectProfileEntityListConfigDialog.vue";

const props = defineProps<{
  objectId: string;
  /** 对象空间 id；用于查询实例 URL。 */
  spaceId: string;
  /** 外部请求立即打开与「详情」相同的嵌入页。 */
  autoOpenDetail?: boolean;
}>();

const emit = defineEmits<{
  "detail-auto-opened": [];
  "close-detail": [];
}>();

const detailEmbedded = ref(false);
const detailStatus = ref<"idle" | "loading" | "ready" | "error">("idle");
const detailError = ref("");
const detailUrl = ref("");
const detailRequestRow = ref<ObjectProfileEntityRow | null>(null);
let detailLoadToken = 0;

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
  const candidate = row as Partial<ObjectProfileEntityRow>;
  if (typeof candidate.rowKey !== "string" || !candidate.cells || typeof candidate.cells !== "object") {
    return { rowKey: "", ontologyUniqueIdentifier: "", instanceId: "", cells: {}, detailItems: [] };
  }
  return {
    rowKey: candidate.rowKey,
    ontologyUniqueIdentifier: typeof candidate.ontologyUniqueIdentifier === "string" ? candidate.ontologyUniqueIdentifier : "",
    instanceId: typeof candidate.instanceId === "string" ? candidate.instanceId : "",
    cells: candidate.cells,
    detailItems: Array.isArray(candidate.detailItems) ? candidate.detailItems : [],
  };
}

/**
 * @description 解析空间 id 为接口所需数字。
 * @param spaceId 路由空间 id。
 * @returns 数字 spaceId；无效时为 null。
 */
function parseObjectProfileSpaceId(spaceId: string): number | null {
  const trimmed = spaceId.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * @description 从实例 URL 列表中取出首个非空 url。
 * @param items 接口返回列表。
 * @returns url 或空串。
 */
function pickOntologyInstanceUrl(items: Array<{ url?: string }> | null | undefined): string {
  if (!Array.isArray(items)) return "";
  for (const item of items) {
    const url = typeof item?.url === "string" ? item.url.trim() : "";
    if (url) return url;
  }
  return "";
}

/**
 * @description 按当前行请求实例详情 URL 并写入嵌入态。
 * @param row 实体行；为空时仅按对象 id 查询。
 */
async function loadEntityDetailUrl(row: ObjectProfileEntityRow | null): Promise<void> {
  const requestToken = ++detailLoadToken;
  detailStatus.value = "loading";
  detailError.value = "";
  detailUrl.value = "";
  detailRequestRow.value = row;

  const spaceId = parseObjectProfileSpaceId(props.spaceId);
  if (spaceId === null) {
    detailStatus.value = "error";
    detailError.value = "缺少有效对象空间 id，无法加载实体详情。";
    return;
  }

  const objectId = (row?.ontologyUniqueIdentifier || props.objectId).trim();
  const instanceId = (row?.instanceId ?? "").trim();
  if (!objectId) {
    detailStatus.value = "error";
    detailError.value = "缺少对象标识，无法加载实体详情。";
    return;
  }

  if (isUseMockEnabled()) {
    if (requestToken !== detailLoadToken) return;
    detailUrl.value = ENTITY_BROWSING_ENTITY_DETAIL_URL;
    detailStatus.value = "ready";
    return;
  }

  try {
    const response = await getOntologyInstanceUrlListInterface({
      spaceId,
      objectId,
      ...(instanceId ? { instanceId } : {}),
    });
    if (requestToken !== detailLoadToken) return;
    if (response.code !== 200) {
      throw new Error(response.message || "实体详情地址加载失败");
    }
    const url = pickOntologyInstanceUrl(response.data);
    if (!url) {
      throw new Error("未返回实体详情地址");
    }
    detailUrl.value = url;
    detailStatus.value = "ready";
  } catch (cause) {
    if (requestToken !== detailLoadToken) return;
    detailUrl.value = "";
    detailStatus.value = "error";
    detailError.value = cause instanceof Error && cause.message.trim() ? cause.message : "实体详情地址加载失败，请重试。";
  }
}

/**
 * @description 打开实体详情嵌入区并按行加载 iframe 地址。
 * @param row 当前表格行。
 */
function openEntityDetail(row?: ObjectProfileEntityRow): void {
  detailEmbedded.value = true;
  void loadEntityDetailUrl(row ? asEntityRow(row) : null);
}

/**
 * @description 重试当前详情 URL 请求。
 */
function retryEntityDetailUrl(): void {
  void loadEntityDetailUrl(detailRequestRow.value);
}

/**
 * @description 关闭嵌入详情并回到实体列表。
 */
function closeEntityDetail(): void {
  detailLoadToken += 1;
  detailEmbedded.value = false;
  detailStatus.value = "idle";
  detailError.value = "";
  detailUrl.value = "";
  detailRequestRow.value = null;
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

onScopeDispose(() => {
  detailLoadToken += 1;
});

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
