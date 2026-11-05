<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="820px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @close="emit('update:modelValue', false)"
  >
    <p v-if="detailLoading" class="behavior-entity-row-detail__state" role="status">正在加载实例数据…</p>
    <p v-else-if="detailError" class="behavior-entity-row-detail__state" role="alert">{{ detailError }}</p>
    <template v-else-if="detail">
      <el-descriptions :column="2" border size="small" class="behavior-entity-row-detail__meta">
        <el-descriptions-item label="实体主键">{{ formatValue(detail.primaryKey) }}</el-descriptions-item>
        <el-descriptions-item label="对象标识">{{ detail.ontologyUniqueIdentifier || "—" }}</el-descriptions-item>
      </el-descriptions>

      <section v-for="group in detail.propertyGroups" :key="group.storageGroup || 'group'" class="behavior-entity-row-detail__group">
        <h4 class="behavior-entity-row-detail__group-title">存储分组 · {{ group.storageGroup || "—" }}</h4>
        <div
          v-for="(row, rowIndex) in group.groupDataList"
          :key="`${group.storageGroup}-${formatValue(row.dataPrimaryKey)}-${rowIndex}`"
          class="behavior-entity-row-detail__row"
        >
          <p class="behavior-entity-row-detail__row-key">数据行主键：{{ formatValue(row.dataPrimaryKey) }}</p>
          <el-table :data="row.props" size="small" class="aircas-table--accent-header" empty-text="暂无属性">
            <el-table-column prop="propertyDisplayName" label="属性名称" min-width="140" show-overflow-tooltip />
            <el-table-column prop="propertyApiName" label="属性 api" min-width="140" show-overflow-tooltip />
            <el-table-column label="属性值" min-width="180" show-overflow-tooltip>
              <template #default="{ row: propRow }">{{ formatValue(asPropertyInfo(propRow).propertyValue) }}</template>
            </el-table-column>
          </el-table>
        </div>
        <p v-if="!group.groupDataList.length" class="behavior-entity-row-detail__state">该分组暂无数据行</p>
      </section>
      <p v-if="!detail.propertyGroups.length" class="behavior-entity-row-detail__state">暂无属性分组数据</p>
    </template>
    <p v-else class="behavior-entity-row-detail__state" role="status">暂无实例数据</p>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { postGetOntologyEntityRowDetailInterface } from "@/apis";
import type { OntologyEntityRowDetailVO, OntologyEntityRowPropertyInfo } from "@/types";

const props = defineProps<{
  modelValue: boolean;
  ontologyUniqueIdentifier: string;
  entityPrimaryKey: string | number | null;
  entityDisplayName?: string;
}>();

const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();

const detailLoading = ref(false);
const detailError = ref("");
const detail = ref<OntologyEntityRowDetailVO | null>(null);
let detailLoadToken = 0;

const dialogTitle = computed(() => {
  const name = (props.entityDisplayName ?? "").trim();
  return name ? `实例数据 · ${name}` : "实例数据";
});

/**
 * @description 将未知值格式化为展示文案。
 * @param value 任意值。
 * @returns 展示文案。
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * @description 将表格行收窄为属性信息类型。
 * @param row 表格行。
 * @returns 属性信息。
 */
function asPropertyInfo(row: unknown): OntologyEntityRowPropertyInfo {
  return row as OntologyEntityRowPropertyInfo;
}

/**
 * @description 清空详情状态。
 */
function clearDetailState(): void {
  detail.value = null;
  detailError.value = "";
  detailLoading.value = false;
}

/**
 * @description 加载实体属性行详情。
 */
async function loadEntityRowDetail(): Promise<void> {
  const ontologyUniqueIdentifier = props.ontologyUniqueIdentifier.trim();
  const entityPrimaryKey = props.entityPrimaryKey;
  if (!ontologyUniqueIdentifier) {
    clearDetailState();
    detailError.value = "缺少对象标识，无法加载实例数据";
    return;
  }
  if (entityPrimaryKey === null || entityPrimaryKey === undefined || entityPrimaryKey === "") {
    clearDetailState();
    detailError.value = "缺少实体主键，无法加载实例数据";
    return;
  }
  const requestToken = ++detailLoadToken;
  detailLoading.value = true;
  detailError.value = "";
  try {
    const response = await postGetOntologyEntityRowDetailInterface({
      ontologyUniqueIdentifier,
      entityPrimaryKey,
      sort: "DESC",
    });
    if (requestToken !== detailLoadToken) return;
    if (response.code !== 200) throw new Error(response.message || "实例数据加载失败");
    detail.value = response.data ?? null;
  } catch (error) {
    if (requestToken !== detailLoadToken) return;
    detail.value = null;
    detailError.value = error instanceof Error ? error.message : "实例数据加载失败";
  } finally {
    if (requestToken === detailLoadToken) detailLoading.value = false;
  }
}

watch(
  () => [props.modelValue, props.ontologyUniqueIdentifier, props.entityPrimaryKey] as const,
  ([visible]) => {
    if (!visible) {
      detailLoadToken += 1;
      clearDetailState();
      return;
    }
    void loadEntityRowDetail();
  },
);
</script>

<style scoped lang="scss">
.behavior-entity-row-detail__state {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}
.behavior-entity-row-detail__meta {
  margin-bottom: 16px;
}
.behavior-entity-row-detail__group {
  margin-bottom: 16px;
}
.behavior-entity-row-detail__group-title {
  margin: 0 0 8px;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}
.behavior-entity-row-detail__row {
  margin-bottom: 12px;
}
.behavior-entity-row-detail__row-key {
  margin: 0 0 6px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}
</style>
