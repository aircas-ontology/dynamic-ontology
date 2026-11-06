<template>
  <el-dialog
    :model-value="modelValue"
    title="实例关系数据"
    width="820px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @close="emit('update:modelValue', false)"
  >
    <p v-if="detailLoading" class="behavior-entity-link-data__state" role="status">正在加载实例关系数据…</p>
    <p v-else-if="detailError" class="behavior-entity-link-data__state" role="alert">{{ detailError }}</p>
    <p v-else-if="!linkItems.length" class="behavior-entity-link-data__state" role="status">暂无实例关系数据</p>
    <div v-else class="behavior-entity-link-data__list">
      <section v-for="(item, index) in linkItems" :key="buildLinkItemKey(item, index)" class="behavior-entity-link-data__item">
        <h4 class="behavior-entity-link-data__item-title">关系 {{ index + 1 }} · {{ formatText(item.linkName) }}</h4>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="关系名称">{{ formatText(item.linkName) }}</el-descriptions-item>
          <el-descriptions-item label="关系类型">{{ formatText(item.linkType) }}</el-descriptions-item>
          <el-descriptions-item label="源对象展示名">{{ formatText(item.displayNameFrom) }}</el-descriptions-item>
          <el-descriptions-item label="目标对象展示名">{{ formatText(item.displayNameTo) }}</el-descriptions-item>
          <el-descriptions-item label="源实体主键">{{ formatText(item.entityPrimaryKeyFrom) }}</el-descriptions-item>
          <el-descriptions-item label="目标实体主键">{{ formatText(item.entityPrimaryKeyTo) }}</el-descriptions-item>
          <el-descriptions-item label="源实体节点">{{ formatText(item.entityNodeFrom) }}</el-descriptions-item>
          <el-descriptions-item label="目标实体节点">{{ formatText(item.entityNodeTo) }}</el-descriptions-item>
          <el-descriptions-item label="源对象标识">{{ formatText(item.ontologyFrom) }}</el-descriptions-item>
          <el-descriptions-item label="目标对象标识">{{ formatText(item.ontologyTo) }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ formatLinkStatus(item.status) }}</el-descriptions-item>
          <el-descriptions-item label="整体起止">{{ formatTimeRange(item.startTime, item.endTime) }}</el-descriptions-item>
          <el-descriptions-item label="持续时间" :span="2">
            <ul v-if="listVisibilityWindows(item).length" class="behavior-entity-link-data__windows">
              <li v-for="(windowItem, windowIndex) in listVisibilityWindows(item)" :key="`${index}-window-${windowIndex}`">
                {{ formatTimeRange(windowItem.startTime, windowItem.endTime) }}
              </li>
            </ul>
            <span v-else>—</span>
          </el-descriptions-item>
        </el-descriptions>
      </section>
    </div>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { postOntologyEntityAllLinkInterface } from "@/apis";
import {
  SPACE_BEHAVIOR_RELATION_TARGET_STATUS_LABELS,
  type PostOntologyEntityAllLinkItem,
  type PostOntologyEntityAllLinkParams,
  type PostOntologyEntityAllLinkVisibilityWindow,
  type SpaceBehaviorRelationTargetStatus,
} from "@/types";

const props = defineProps<{
  modelValue: boolean;
  queryParams: PostOntologyEntityAllLinkParams;
}>();

const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();

const detailLoading = ref(false);
const detailError = ref("");
const linkItems = ref<PostOntologyEntityAllLinkItem[]>([]);
let detailLoadToken = 0;

/**
 * @description 将未知值格式化为展示文案。
 * @param value 任意值。
 * @returns 展示文案。
 */
function formatText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * @description 将关系状态码映射为表单同口径文案。
 * @param status 状态码。
 * @returns 展示文案。
 */
function formatLinkStatus(status: unknown): string {
  if (typeof status !== "string" || !status.trim()) return "—";
  const normalized = status.trim().toUpperCase() as SpaceBehaviorRelationTargetStatus;
  return SPACE_BEHAVIOR_RELATION_TARGET_STATUS_LABELS[normalized] ?? status.trim();
}

/**
 * @description 将时间值格式化为本地可读时间。
 * @param value 时间字符串或毫秒时间戳。
 * @returns 展示文案。
 */
function formatDateTime(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  const date = typeof value === "number" ? new Date(value) : new Date(String(value));
  if (Number.isNaN(date.getTime())) return formatText(value);
  return date.toLocaleString();
}

/**
 * @description 格式化起止时间区间。
 * @param startTime 开始时间。
 * @param endTime 结束时间。
 * @returns 展示文案。
 */
function formatTimeRange(startTime: unknown, endTime: unknown): string {
  const startText = formatDateTime(startTime);
  const endText = formatDateTime(endTime);
  if (!startText && !endText) return "—";
  return `${startText || "—"} 至 ${endText || "—"}`;
}

/**
 * @description 读取关系项的持续时段列表。
 * @param item 关系项。
 * @returns 时段列表。
 */
function listVisibilityWindows(item: PostOntologyEntityAllLinkItem): PostOntologyEntityAllLinkVisibilityWindow[] {
  return Array.isArray(item.visibilityWindows) ? item.visibilityWindows : [];
}

/**
 * @description 生成关系项列表 key。
 * @param item 关系项。
 * @param index 序号。
 * @returns 稳定 key。
 */
function buildLinkItemKey(item: PostOntologyEntityAllLinkItem, index: number): string {
  return [
    formatText(item.linkName),
    formatText(item.entityPrimaryKeyFrom),
    formatText(item.entityPrimaryKeyTo),
    formatText(item.entityNodeFrom),
    formatText(item.entityNodeTo),
    String(index),
  ].join(":");
}

/**
 * @description 清空详情状态。
 */
function clearDetailState(): void {
  linkItems.value = [];
  detailError.value = "";
  detailLoading.value = false;
}

/**
 * @description 打开弹框时调用 entity/link_between 加载并展示关系数据。
 */
async function loadEntityLinkData(): Promise<void> {
  const requestToken = ++detailLoadToken;
  detailLoading.value = true;
  detailError.value = "";
  linkItems.value = [];
  try {
    const response = await postOntologyEntityAllLinkInterface(props.queryParams);
    if (requestToken !== detailLoadToken) return;
    if (response.code !== 200) throw new Error(response.message || "实例关系数据加载失败");
    linkItems.value = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    if (requestToken !== detailLoadToken) return;
    detailError.value = error instanceof Error ? error.message : "实例关系数据加载失败";
    linkItems.value = [];
  } finally {
    if (requestToken === detailLoadToken) detailLoading.value = false;
  }
}

watch(
  () => [props.modelValue, props.queryParams] as const,
  ([visible]) => {
    if (!visible) {
      detailLoadToken += 1;
      clearDetailState();
      return;
    }
    void loadEntityLinkData();
  },
);
</script>

<style scoped lang="scss">
.behavior-entity-link-data__state {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.behavior-entity-link-data__list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: min(70vh, 640px);
  overflow: auto;
}

.behavior-entity-link-data__item-title {
  margin: 0 0 8px;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}

.behavior-entity-link-data__windows {
  margin: 0;
  padding-left: 18px;
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  line-height: 1.6;
}
</style>
