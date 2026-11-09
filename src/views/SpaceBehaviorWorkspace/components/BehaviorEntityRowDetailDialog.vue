<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="920px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @close="emit('update:modelValue', false)"
  >
    <p v-if="!detail" class="behavior-entity-row-detail__state" role="status">暂无实例数据</p>
    <template v-else>
      <el-descriptions :column="2" border size="small" class="behavior-entity-row-detail__meta">
        <el-descriptions-item label="实体主键">{{ formatValue(detail.primaryKey) }}</el-descriptions-item>
        <el-descriptions-item label="对象标识">{{ detail.ontologyUniqueIdentifier || "—" }}</el-descriptions-item>
      </el-descriptions>

      <p v-if="(enableUpdateTest || enableCreateTest) && paramDetailLoading" class="behavior-entity-row-detail__state" role="status">正在加载行为参数…</p>
      <p v-else-if="(enableUpdateTest || enableCreateTest) && paramDetailError" class="behavior-entity-row-detail__state" role="alert">
        {{ paramDetailError }}
      </p>

      <section v-for="group in detail.propertyGroups" :key="group.storageGroup || 'group'" class="behavior-entity-row-detail__group">
        <h4 class="behavior-entity-row-detail__group-title">存储分组 · {{ group.storageGroup || "—" }}</h4>
        <div
          v-for="(row, rowIndex) in group.groupDataList"
          :key="`${group.storageGroup}-${formatValue(row.dataPrimaryKey)}-${rowIndex}`"
          class="behavior-entity-row-detail__row"
          :class="{ 'behavior-entity-row-detail__row--editable': isEditableDataRow(row.dataPrimaryKey) }"
        >
          <p class="behavior-entity-row-detail__row-key">
            数据行主键：{{ formatValue(row.dataPrimaryKey)
            }}<span v-if="isEditableDataRow(row.dataPrimaryKey)" class="behavior-entity-row-detail__row-tag">可编辑</span>
          </p>
          <el-table :data="row.props" size="small" class="aircas-table--accent-header" empty-text="暂无属性">
            <el-table-column prop="propertyDisplayName" label="属性名称" min-width="120" show-overflow-tooltip />
            <el-table-column prop="propertyApiName" label="属性 api" min-width="120" show-overflow-tooltip />
            <el-table-column label="属性值" min-width="140" show-overflow-tooltip>
              <template #default="{ row: propRow }">{{ formatValue(asPropertyInfo(propRow).propertyValue) }}</template>
            </el-table-column>
            <el-table-column v-if="enableUpdateTest" label="修改值" min-width="180">
              <template #default="{ row: propRow }">
                <el-input
                  v-if="resolveEditableParamName(row.dataPrimaryKey, asPropertyInfo(propRow))"
                  :model-value="paramValues[resolveEditableParamName(row.dataPrimaryKey, asPropertyInfo(propRow)) ?? ''] ?? ''"
                  :placeholder="`请输入 ${asPropertyInfo(propRow).propertyDisplayName || asPropertyInfo(propRow).propertyApiName}`"
                  clearable
                  :disabled="submitLoading"
                  @update:model-value="
                    emit('update-param-value', resolveEditableParamName(row.dataPrimaryKey, asPropertyInfo(propRow)) ?? '', String($event ?? ''))
                  "
                />
                <span v-else>—</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <p v-if="!group.groupDataList.length" class="behavior-entity-row-detail__state">该分组暂无数据行</p>
      </section>
      <p v-if="!detail.propertyGroups.length" class="behavior-entity-row-detail__state">暂无属性分组数据</p>

      <section v-if="enableCreateTest" class="behavior-entity-row-detail__create-params">
        <h4 class="behavior-entity-row-detail__group-title">测试参数</h4>
        <el-table v-if="enableCreateTest && paramRows.length" :data="paramRows" row-key="rowKey" size="small" class="aircas-table--accent-header">
          <el-table-column prop="propertyDisplayName" label="属性名称" min-width="140" show-overflow-tooltip />
          <el-table-column prop="propertyType" label="类型" width="120" show-overflow-tooltip />
          <el-table-column label="参数值" min-width="220">
            <template #default="{ row }">
              <el-input
                :model-value="paramValues[asParamRow(row).paramName] ?? ''"
                :placeholder="`请输入 ${asParamRow(row).propertyDisplayName || asParamRow(row).paramName}`"
                clearable
                :disabled="submitLoading"
                @update:model-value="emit('update-param-value', asParamRow(row).paramName, String($event ?? ''))"
              />
            </template>
          </el-table-column>
        </el-table>
        <p v-else-if="!paramDetailLoading && !paramDetailError" class="behavior-entity-row-detail__state" role="status">暂无外部输入参数</p>
      </section>

      <p v-if="(enableUpdateTest || enableCreateTest) && submitError" class="behavior-entity-row-detail__state" role="alert">{{ submitError }}</p>
    </template>

    <template #footer>
      <el-button :disabled="submitLoading" @click="emit('update:modelValue', false)">关闭</el-button>
      <el-button v-if="enableUpdateTest || enableCreateTest" type="primary" :loading="submitLoading" @click="emit('start-test')">开始测试</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import type { OntologyEntityRowDetailVO, OntologyEntityRowPropertyInfo } from "@/types";

/** 属性值修改测试的外部输入参数行。 */
export interface BehaviorEntityRowDetailParamRow {
  rowKey: string;
  paramName: string;
  propertyDisplayName: string;
  propertyType: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    ontologyUniqueIdentifier: string;
    entityPrimaryKey: string | number | null;
    entityDisplayName?: string;
    /** 父组件传入的 page 适配详情；有值时直接展示，不再请求 row_detail。 */
    externalDetail?: OntologyEntityRowDetailVO | null;
    /** 是否启用属性值-修改测试参数与开始测试。 */
    enableUpdateTest?: boolean;
    /** 是否启用属性值-新增测试参数与开始测试。 */
    enableCreateTest?: boolean;
    /** 外层已选数据行主键；仅该行内联编辑。 */
    selectedDataPrimaryKey?: string | number | boolean | Record<string, unknown> | null;
    paramRows?: BehaviorEntityRowDetailParamRow[];
    paramValues?: Record<string, string>;
    paramDetailLoading?: boolean;
    paramDetailError?: string;
    submitLoading?: boolean;
    submitError?: string;
  }>(),
  {
    entityDisplayName: "",
    externalDetail: null,
    enableUpdateTest: false,
    enableCreateTest: false,
    selectedDataPrimaryKey: null,
    paramRows: () => [],
    paramValues: () => ({}),
    paramDetailLoading: false,
    paramDetailError: "",
    submitLoading: false,
    submitError: "",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update-param-value": [paramName: string, value: string];
  "start-test": [];
  "detail-loaded": [detail: OntologyEntityRowDetailVO | null];
  "reload-detail": [];
}>();

const detail = computed(() => props.externalDetail ?? null);

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
 * @description 比较两个主键是否同一数据行。
 * @param left 左侧主键。
 * @param right 右侧主键。
 * @returns 相等时为 true。
 */
function isSameDataPrimaryKey(left: unknown, right: unknown): boolean {
  if (left === null || left === undefined || left === "" || right === null || right === undefined || right === "") return false;
  if (left === right) return true;
  if (
    (typeof left === "string" || typeof left === "number" || typeof left === "boolean") &&
    (typeof right === "string" || typeof right === "number" || typeof right === "boolean")
  ) {
    return String(left) === String(right);
  }
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
}

/**
 * @description 判断当前数据行是否为可编辑的选中行。
 * @param dataPrimaryKey 数据行主键。
 * @returns 可编辑时为 true。
 */
function isEditableDataRow(dataPrimaryKey: unknown): boolean {
  if (!props.enableUpdateTest) return false;
  return isSameDataPrimaryKey(dataPrimaryKey, props.selectedDataPrimaryKey);
}

/**
 * @description 按属性 apiName 查找可编辑的外部参数名。
 * @param dataPrimaryKey 数据行主键。
 * @param property 属性信息。
 * @returns 参数名；不可编辑时为 null。
 */
function resolveEditableParamName(dataPrimaryKey: unknown, property: OntologyEntityRowPropertyInfo): string | null {
  if (!isEditableDataRow(dataPrimaryKey)) return null;
  const apiName = (property.propertyApiName ?? "").trim();
  if (!apiName) return null;
  const matched = props.paramRows.find((item) => item.paramName.trim() === apiName);
  return matched ? matched.paramName : null;
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
 * @description 将表格行收窄为新增测试参数行类型。
 * @param row 表格行。
 * @returns 参数行。
 */
function asParamRow(row: unknown): BehaviorEntityRowDetailParamRow {
  return row as BehaviorEntityRowDetailParamRow;
}

/**
 * @description 对外暴露：通知父组件重新加载 page 详情。
 */
function reloadEntityRowDetail(): void {
  emit("reload-detail");
}

defineExpose({ reloadEntityRowDetail });

watch(
  () => [props.modelValue, props.externalDetail] as const,
  ([visible, externalDetail]) => {
    if (!visible) {
      emit("detail-loaded", null);
      return;
    }
    emit("detail-loaded", externalDetail ?? null);
  },
);
</script>

<style scoped lang="scss">
.behavior-entity-row-detail__state {
  margin: 0 0 8px;
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
.behavior-entity-row-detail__row--editable {
  padding: 8px;
  border: 1px solid var(--aircas-color-border-secondary, rgba(64, 158, 255, 0.35));
  border-radius: 4px;
}
.behavior-entity-row-detail__row-key {
  margin: 0 0 6px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}
.behavior-entity-row-detail__row-tag {
  margin-left: 8px;
  color: var(--aircas-color-primary, #409eff);
  font-size: 12px;
}
.behavior-entity-row-detail__create-params {
  margin-top: 8px;
  margin-bottom: 8px;
}
</style>
