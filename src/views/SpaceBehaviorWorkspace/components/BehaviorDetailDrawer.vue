<template>
  <el-drawer
    :model-value="modelValue"
    class="behavior-detail-drawer"
    :title="drawerTitle"
    size="680px"
    append-to-body
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p v-if="detailLoading" class="behavior-detail-drawer__state" role="status">正在加载行为详情…</p>
    <p v-else-if="detailError" class="behavior-detail-drawer__state" role="alert">{{ detailError }}</p>
    <template v-else-if="viewState">
      <header class="behavior-detail-drawer__header">
        <p class="behavior-detail-drawer__description" :title="viewState.description || '暂无描述'">
          {{ viewState.description || "暂无描述" }}
        </p>
        <div class="behavior-detail-drawer__tags">
          <el-tag size="small" :type="statusTagType(viewState.status)">{{ SPACE_BEHAVIOR_STATUS_LABELS[viewState.status] }}</el-tag>
          <el-tag size="small" effect="plain">{{ viewState.actionKindLabel }}</el-tag>
          <el-tag v-if="viewState.subjectTypeLabel !== '—'" size="small" effect="plain">{{ viewState.subjectTypeLabel }}</el-tag>
          <el-tag v-if="viewState.operationLabel !== '—'" size="small" effect="plain">{{ viewState.operationLabel }}</el-tag>
        </div>
        <div class="behavior-detail-drawer__meta-line">
          <span>apiName {{ viewState.actionApi || "—" }}</span>
          <span v-if="viewState.functionApi">算子 {{ viewState.functionDescription || viewState.functionApi }}</span>
        </div>
      </header>

      <el-descriptions class="behavior-detail-drawer__summary" :column="2" border size="small">
        <el-descriptions-item label="行为 ID">{{ viewState.id }}</el-descriptions-item>
        <el-descriptions-item label="行为 api">{{ viewState.actionApi || "—" }}</el-descriptions-item>
        <el-descriptions-item label="行为类别">{{ viewState.actionKindLabel }}</el-descriptions-item>
        <el-descriptions-item label="主体类型">{{ viewState.subjectTypeLabel }}</el-descriptions-item>
        <el-descriptions-item label="基础操作">{{ viewState.operationLabel }}</el-descriptions-item>
        <el-descriptions-item label="对象标识">{{ viewState.ontologyUniqIdentifier || "—" }}</el-descriptions-item>
        <el-descriptions-item v-if="viewState.storageGroup" label="存储分组">{{ viewState.storageGroup }}</el-descriptions-item>
        <el-descriptions-item v-if="viewState.functionApi" label="绑定算子">
          {{ viewState.functionDescription || viewState.functionApi }}
        </el-descriptions-item>
        <el-descriptions-item v-if="viewState.functionApi" label="算子 api">{{ viewState.functionApi }}</el-descriptions-item>
        <el-descriptions-item v-if="viewState.outputMode" label="输出方式">{{ viewState.outputMode }}</el-descriptions-item>
        <el-descriptions-item v-if="viewState.linkRelationId" label="绑定关系">{{ viewState.linkRelationId }}</el-descriptions-item>
        <el-descriptions-item v-if="viewState.linkTargetStatus" label="关系状态">{{ viewState.linkTargetStatus }}</el-descriptions-item>
      </el-descriptions>

      <section class="behavior-detail-drawer__section">
        <h4>输入参数</h4>
        <el-table v-if="viewState.inputRows.length" :data="viewState.inputRows" row-key="rowKey" class="aircas-table--accent-header" size="small">
          <el-table-column label="参数" min-width="140" show-overflow-tooltip>
            <template #default="{ row }">{{ formatParamLabel(asParamRow(row)) }}</template>
          </el-table-column>
          <el-table-column prop="paramType" label="类型" width="100" show-overflow-tooltip />
          <el-table-column prop="sourceType" label="来源" width="110" show-overflow-tooltip />
          <el-table-column prop="bindSummary" label="绑定" min-width="200" show-overflow-tooltip />
          <el-table-column prop="description" label="描述" min-width="140" show-overflow-tooltip />
        </el-table>
        <p v-else class="behavior-detail-drawer__empty">暂无输入参数</p>
      </section>

      <section class="behavior-detail-drawer__section">
        <h4>输出参数</h4>
        <el-table v-if="viewState.outputRows.length" :data="viewState.outputRows" row-key="rowKey" class="aircas-table--accent-header" size="small">
          <el-table-column label="参数" min-width="140" show-overflow-tooltip>
            <template #default="{ row }">{{ formatParamLabel(asParamRow(row)) }}</template>
          </el-table-column>
          <el-table-column prop="paramType" label="类型" width="100" show-overflow-tooltip />
          <el-table-column prop="outputMode" label="输出方式" width="140" show-overflow-tooltip>
            <template #default="{ row }">{{ asParamRow(row).outputMode || "—" }}</template>
          </el-table-column>
          <el-table-column prop="bindSummary" label="绑定" min-width="200" show-overflow-tooltip />
          <el-table-column prop="description" label="描述" min-width="140" show-overflow-tooltip />
        </el-table>
        <p v-else class="behavior-detail-drawer__empty">暂无输出参数</p>
      </section>
    </template>
    <p v-else class="behavior-detail-drawer__state" role="status">暂无行为详情</p>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { getOntologyActionInfoInterface } from "@/apis";
import type { SpaceBehaviorItem, SpaceBehaviorStatus } from "@/types";
import { SPACE_BEHAVIOR_STATUS_LABELS } from "@/types";
import {
  mapOntologyActionInfoToViewState,
  type SpaceBehaviorActionInfoViewParamRow,
  type SpaceBehaviorActionInfoViewState,
} from "../utils/mapOntologyActionInfoToViewState";

const props = defineProps<{
  modelValue: boolean;
  spaceId: string;
  behavior: SpaceBehaviorItem | null;
}>();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();

const detailLoading = ref(false);
const detailError = ref("");
const viewState = ref<SpaceBehaviorActionInfoViewState | null>(null);
let detailLoadToken = 0;

const drawerTitle = computed(() => viewState.value?.displayName || props.behavior?.displayName || "行为详情");

/**
 * @description 将行为状态映射为标签颜色。
 * @param status 行为状态。
 * @returns Element Plus 标签类型。
 */
function statusTagType(status: SpaceBehaviorStatus): "success" | "info" | "warning" {
  if (status === "published") return "success";
  if (status === "disabled") return "info";
  return "warning";
}

/**
 * @description 将表格行收窄为详情参数行类型。
 * @param row 表格行。
 * @returns 参数行。
 */
function asParamRow(row: unknown): SpaceBehaviorActionInfoViewParamRow {
  return row as SpaceBehaviorActionInfoViewParamRow;
}

/**
 * @description 格式化参数名与路径展示。
 * @param row 入出参行。
 * @returns 展示文案。
 */
function formatParamLabel(row: SpaceBehaviorActionInfoViewParamRow): string {
  if (row.paramPath) return `${row.paramName}.${row.paramPath}`;
  return row.paramName || "—";
}

/**
 * @description 清空详情加载结果。
 */
function clearDetailViewState(): void {
  viewState.value = null;
  detailError.value = "";
  detailLoading.value = false;
}

/**
 * @description 打开查看抽屉时拉取行为详情并映射展示状态。
 */
async function loadActionInfoForView(): Promise<void> {
  const actionApi = (props.behavior?.behaviorApiName ?? "").trim();
  const ontologySpaceId = props.spaceId.trim();
  if (!actionApi) {
    clearDetailViewState();
    detailError.value = "行为 api 名称无效，无法加载详情";
    return;
  }
  if (!ontologySpaceId) {
    clearDetailViewState();
    detailError.value = "当前对象空间无效，无法加载详情";
    return;
  }
  const requestToken = ++detailLoadToken;
  detailLoading.value = true;
  detailError.value = "";
  viewState.value = null;
  try {
    const response = await getOntologyActionInfoInterface({ actionApi, ontologySpaceId });
    if (requestToken !== detailLoadToken) return;
    if (response.code !== 200 || !response.data) throw new Error(response.message || "行为详情加载失败");
    viewState.value = mapOntologyActionInfoToViewState(response.data);
  } catch (error) {
    if (requestToken !== detailLoadToken) return;
    viewState.value = null;
    detailError.value = error instanceof Error ? error.message : "行为详情加载失败";
  } finally {
    if (requestToken === detailLoadToken) detailLoading.value = false;
  }
}

watch(
  () => [props.modelValue, props.behavior?.behaviorApiName, props.spaceId] as const,
  ([visible]) => {
    if (!visible) {
      detailLoadToken += 1;
      clearDetailViewState();
      return;
    }
    void loadActionInfoForView();
  },
);
</script>

<style scoped lang="scss">
.behavior-detail-drawer__header {
  margin-bottom: 12px;
}
.behavior-detail-drawer__description {
  margin: 0 0 8px;
  overflow: hidden;
  color: var(--aircas-color-text-secondary);
  font-size: 14px;
  line-height: 1.6;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.behavior-detail-drawer__tags,
.behavior-detail-drawer__meta-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.behavior-detail-drawer__meta-line {
  margin-top: 8px;
}
.behavior-detail-drawer__summary {
  margin-top: 16px;
}
.behavior-detail-drawer__section {
  margin-top: 20px;
}
.behavior-detail-drawer__section h4 {
  margin: 0 0 10px;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
}
.behavior-detail-drawer__empty,
.behavior-detail-drawer__state {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}
</style>

<style lang="scss">
.behavior-detail-drawer.el-drawer .el-drawer__header {
  margin-bottom: 0;
  padding: 14px 16px;
  border-bottom: 1px solid var(--aircas-color-border-light);
  background: var(--aircas-color-section-header);
  color: var(--aircas-color-text-primary);
}

.behavior-detail-drawer.el-drawer .el-drawer__title {
  color: var(--aircas-color-text-primary);
  font-weight: 600;
}

.behavior-detail-drawer.el-drawer .el-drawer__body {
  padding-top: 16px;
}
</style>
