<template>
  <main class="subspace-create-workspace" aria-label="子空间创建内容">
    <header class="subspace-create-workspace__header subspace-create-workspace__panel">
      <el-button class="aircas-button" @click="emit('back')">返回</el-button>
      <span>父空间：{{ parentSpaceName }}</span>
      <div class="subspace-create-workspace__header-actions">
        <el-button v-if="currentStepIndex > 0" class="aircas-button" @click="emit('previous')">上一步</el-button>
        <el-button v-if="currentStepIndex < flowSteps.length - 1" class="aircas-button" type="primary" @click="emit('next')">下一步</el-button>
        <el-button v-else class="aircas-button" type="primary" @click="emit('create')">创建</el-button>
      </div>
    </header>

    <el-form class="aircas-form subspace-create-workspace__form" label-position="left" label-width="88px">
      <el-form-item label="子空间名称">
        <el-input :model-value="spaceName" class="aircas-input" ariaLabel="子空间名称" @update:model-value="emit('update:spaceName', String($event ?? ''))" />
      </el-form-item>
      <el-form-item label="API 名称">
        <el-input :model-value="apiName" class="aircas-input" ariaLabel="API 名称" @update:model-value="emit('update:apiName', String($event ?? ''))" />
      </el-form-item>
    </el-form>

    <ol class="subspace-create-workspace__steps subspace-create-workspace__panel" aria-label="子空间创建步骤">
      <li
        v-for="(step, index) in flowSteps"
        :key="step"
        :class="`is-${resolveStepStatus(index)}`"
        :aria-current="resolveStepStatus(index) === 'process' ? 'step' : undefined"
      >
        <span class="subspace-create-workspace__step-index" aria-hidden="true"></span>
        {{ step }}
        <i v-if="index < flowSteps.length - 1" class="subspace-create-workspace__step-arrow" aria-hidden="true"></i>
      </li>
    </ol>

    <section class="subspace-create-workspace__empty subspace-create-workspace__panel" aria-live="polite">
      <header class="subspace-create-workspace__empty-header">
        <div>
          <h2>{{ stepPanelCopy.title }}</h2>
          <p>{{ stepPanelCopy.description }}</p>
        </div>
        <div v-if="currentStepIndex === 2" class="subspace-create-workspace__property-actions">
          <el-button class="aircas-button" size="small" @click="emit('selectAllProperties')">全选属性</el-button>
          <el-button class="aircas-button" size="small" @click="emit('clearProperties')">取消全选</el-button>
        </div>
        <strong v-else>{{ stepPanelCopy.summary }}</strong>
      </header>
      <div v-if="currentStepIndex === 0 && selectedObjects.length" class="subspace-create-workspace__cards">
        <article v-for="item in selectedObjects" :key="item.id" class="subspace-create-workspace__card">
          <el-icon class="subspace-create-workspace__card-icon"><Ship /></el-icon>
          <div class="subspace-create-workspace__card-body">
            <strong :title="item.label">{{ item.label }}</strong>
            <small :title="item.apiName">{{ item.apiName }}</small>
          </div>
        </article>
      </div>
      <el-table
        v-else-if="currentStepIndex === 1 && instanceRows.length"
        ref="instanceTableRef"
        class="aircas-table aircas-table--flat subspace-create-workspace__table"
        :data="instanceRows"
        row-key="id"
        stripe
        height="100%"
        @selection-change="syncSelectedInstanceRows"
      >
        <el-table-column type="selection" width="48" reserve-selection />
        <el-table-column prop="name" label="实例名称" min-width="240" show-overflow-tooltip />
        <el-table-column prop="objectLabel" label="所属对象" min-width="200" show-overflow-tooltip />
      </el-table>
      <div v-else-if="currentStepIndex === 2 && propertyGroups.length" class="subspace-create-workspace__properties">
        <section v-for="group in propertyGroups" :key="group.objectId" class="subspace-create-workspace__property-group">
          <header class="subspace-create-workspace__property-group-header">
            <div>
              <strong>{{ group.objectLabel }}</strong>
              <span>{{ countSelectedObjectProperties(group.objectId) }} / {{ group.properties.length }} 个属性</span>
            </div>
            <el-button class="aircas-button" size="small" @click="selectObjectProperties(group.objectId)">全选</el-button>
          </header>
          <el-table class="aircas-table aircas-table--flat subspace-create-workspace__property-table" :data="group.properties" row-key="id" stripe>
            <el-table-column label="选择" width="72">
              <template v-slot:default="{ row }">
                <el-checkbox
                  class="aircas-checkbox"
                  :model-value="isObjectPropertySelected(row)"
                  ariaLabel="选择属性"
                  @change="toggleObjectProperty(row, $event)"
                />
              </template>
            </el-table-column>
            <el-table-column label="属性名称" min-width="180">
              <template v-slot:default="{ row }">
                <div class="subspace-create-workspace__property-name">
                  <strong>{{ readObjectProperty(row).displayName }}</strong>
                  <small>{{ readObjectProperty(row).apiName }}</small>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="数据类型" width="140">
              <template v-slot:default="{ row }">
                <el-tag class="aircas-tag" size="small">{{ readObjectProperty(row).dataType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="筛选条件" min-width="280">
              <template v-slot:default="{ row }">
                <el-date-picker
                  v-if="resolvePropertyFilterKind(row) === 'dateRange' || resolvePropertyFilterKind(row) === 'dateTimeRange'"
                  :model-value="readPropertyDateRange(row)"
                  class="aircas-input subspace-create-workspace__property-filter"
                  popper-class="aircas-picker"
                  :type="resolvePropertyFilterKind(row) === 'dateTimeRange' ? 'datetimerange' : 'daterange'"
                  :value-format="resolvePropertyFilterKind(row) === 'dateTimeRange' ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD'"
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  @update:model-value="updatePropertyDateRange(row, $event)"
                />
                <el-input-number
                  v-else-if="resolvePropertyFilterKind(row) === 'number'"
                  :model-value="readPropertyFilterNumber(row)"
                  class="subspace-create-workspace__property-filter"
                  controls-position="right"
                  @update:model-value="updatePropertyFilterNumber(row, $event)"
                />
                <el-select
                  v-else-if="resolvePropertyFilterKind(row) === 'boolean'"
                  :model-value="readPropertyFilterBoolean(row)"
                  class="aircas-select subspace-create-workspace__property-filter"
                  popper-class="aircas-select-popper"
                  clearable
                  placeholder="请选择"
                  @update:model-value="updatePropertyFilterBoolean(row, $event)"
                >
                  <el-option label="是" :value="true" />
                  <el-option label="否" :value="false" />
                </el-select>
                <el-input
                  v-else
                  :model-value="readPropertyFilterText(row)"
                  class="aircas-input subspace-create-workspace__property-filter"
                  clearable
                  placeholder="请输入筛选内容"
                  ariaLabel="筛选条件"
                  @update:model-value="updatePropertyFilterText(row, String($event ?? ''))"
                />
              </template>
            </el-table-column>
          </el-table>
        </section>
      </div>
      <el-table
        v-else-if="currentStepIndex === 3 && relationRows.length"
        ref="relationTableRef"
        class="aircas-table aircas-table--flat subspace-create-workspace__table"
        :data="relationRows"
        row-key="id"
        stripe
        height="100%"
        @selection-change="syncSelectedRelationRows"
      >
        <el-table-column type="selection" width="48" reserve-selection />
        <el-table-column prop="displayName" label="关系名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="sourceLabel" label="源对象" min-width="220" show-overflow-tooltip />
        <el-table-column prop="targetLabel" label="目标对象" min-width="220" show-overflow-tooltip />
      </el-table>
      <el-empty v-else class="aircas-empty" :description="resolveEmptyDescription()" />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { Ship } from "@element-plus/icons-vue";
import type { CheckboxValueType, TableInstance } from "element-plus";
import type { SubspaceCreateObjectProperty, SubspaceCreateObjectPropertyGroup } from "../utils/mapSubspaceCreateObjectProperty";
import { resolveSubspaceCreatePropertyFilterKind } from "../utils/resolveSubspaceCreatePropertyFilterKind";
import type { SubspaceCreatePropertyFilterKind } from "../utils/resolveSubspaceCreatePropertyFilterKind";
import type { SubspaceCreateSelectedInstance } from "../utils/mapSubspaceCreateSelectedInstance";
import type { SubspaceCreateSelectedRelation } from "../utils/mapSubspaceCreateSelectedRelation";
import type { SubspaceCreateSelectedObject } from "../utils/mapSubspaceCreateSelectedObject";

const props = defineProps<{
  spaceName: string;
  apiName: string;
  parentSpaceName: string;
  selectedCount: number;
  selectedObjects: SubspaceCreateSelectedObject[];
  currentStepIndex: number;
  instanceRows: SubspaceCreateSelectedInstance[];
  selectedInstanceIds: string[];
  propertyGroups: SubspaceCreateObjectPropertyGroup[];
  selectedPropertyIds: string[];
  relationRows: SubspaceCreateSelectedRelation[];
  selectedRelationIds: string[];
}>();

const emit = defineEmits<{
  "update:spaceName": [value: string];
  "update:apiName": [value: string];
  "update:selectedInstanceIds": [value: string[]];
  "update:selectedRelationIds": [value: string[]];
  selectObjectProperties: [objectId: string];
  selectAllProperties: [];
  clearProperties: [];
  toggleProperty: [propertyId: string, checked: boolean];
  back: [];
  previous: [];
  next: [];
  create: [];
}>();

const flowSteps = ["选择对象", "选择实例", "配置属性", "配置关系"];
const instanceTableRef = ref<TableInstance>();
const relationTableRef = ref<TableInstance>();
let isApplyingInstanceSelection = false;
let isApplyingRelationSelection = false;
const stepPanelCopy = computed(() => resolveStepPanelCopy());
const propertyFilters = ref<
  Record<string, { text: string; number: number | null; dateRange: [string, string] | undefined; booleanValue: boolean | undefined }>
>({});

/**
 * @description 按当前进行步骤计算节点状态：已完成、进行中或等待。
 * @param index 步骤序号，从 0 起。
 * @returns 步骤状态。
 */
function resolveStepStatus(index: number) {
  if (index < props.currentStepIndex) {
    return "finish";
  }
  if (index === props.currentStepIndex) {
    return "process";
  }
  return "wait";
}

/**
 * @description 按当前步骤返回标题、说明和数量文案。
 * @returns 步骤内容区文案。
 */
function resolveStepPanelCopy() {
  if (props.currentStepIndex <= 0) {
    return {
      title: "第一步：选择对象",
      description: "请先在左侧分类体系树下勾选需要纳入子空间的本体对象。",
      summary: `${props.selectedCount} 个对象`,
    };
  }
  if (props.currentStepIndex === 1) {
    return {
      title: "第二步：选择实例",
      description: "选择纳入子空间的对象实例。",
      summary: `${props.selectedInstanceIds.length} 个实例`,
    };
  }
  if (props.currentStepIndex === 2) {
    return {
      title: "第三步：配置对象属性",
      description: "按不同对象配置筛选条件，不修改属性本身。",
      summary: "",
    };
  }
  return {
    title: "第四步：选择关系",
    description: "选择纳入子空间的对象关系。",
    summary: `${props.selectedRelationIds.length} 个关系`,
  };
}

/**
 * @description 返回当前步骤没有可展示内容时的空状态说明。
 * @returns 空状态文案。
 */
function resolveEmptyDescription() {
  if (props.currentStepIndex <= 0) {
    return "请在左侧勾选本体对象";
  }
  if (props.currentStepIndex === 1) {
    return "暂无对象实例";
  }
  if (props.currentStepIndex === 2) {
    return "暂无对象属性";
  }
  return "暂无对象关系";
}

/**
 * @description 统计某个对象已勾选的属性数量。
 * @param objectId 对象 id。
 * @returns 已选属性数。
 */
function countSelectedObjectProperties(objectId: string) {
  const ids = new Set(props.propertyGroups.find((group) => group.objectId === objectId)?.properties.map((item) => item.id) ?? []);
  return props.selectedPropertyIds.filter((id) => ids.has(id)).length;
}

/**
 * @description 通知父级勾选某个对象下的全部属性。
 * @param objectId 对象 id。
 */
function selectObjectProperties(objectId: string) {
  emit("selectObjectProperties", objectId);
}

/**
 * @description 从表格行读取属性字段，无法识别时返回空属性。
 * @param row 表格当前行。
 * @returns 属性行。
 */
function readObjectProperty(row: unknown): SubspaceCreateObjectProperty {
  const propertyId = row && typeof row === "object" && "id" in row && typeof row.id === "string" ? row.id : "";
  const property = props.propertyGroups.flatMap((group) => group.properties).find((item) => item.id === propertyId);
  return (
    property ?? {
      id: "",
      objectId: "",
      objectLabel: "",
      displayName: "",
      apiName: "",
      dataType: "",
    }
  );
}

/**
 * @description 判断属性行是否已勾选。
 * @param row 表格当前行。
 * @returns 是否选中。
 */
function isObjectPropertySelected(row: unknown) {
  return props.selectedPropertyIds.includes(readObjectProperty(row).id) && readObjectProperty(row).id.length > 0;
}

/**
 * @description 将单条属性勾选变化通知父级。
 * @param row 表格当前行。
 * @param checked 复选框当前值。
 */
function toggleObjectProperty(row: unknown, checked: CheckboxValueType) {
  const propertyId = readObjectProperty(row).id;
  if (!propertyId) {
    return;
  }
  emit("toggleProperty", propertyId, checked === true);
}

/**
 * @description 读取属性行对应的筛选控件类型。
 * @param row 表格当前行。
 * @returns 筛选控件类型。
 */
function resolvePropertyFilterKind(row: unknown): SubspaceCreatePropertyFilterKind {
  return resolveSubspaceCreatePropertyFilterKind(readObjectProperty(row).dataType);
}

/**
 * @description 读取或初始化某条属性的筛选值。
 * @param propertyId 属性 id。
 * @returns 筛选值。
 */
function ensurePropertyFilter(propertyId: string) {
  const current = propertyFilters.value[propertyId];
  if (current) {
    return current;
  }
  const created = { text: "", number: null, dateRange: undefined, booleanValue: undefined };
  propertyFilters.value = { ...propertyFilters.value, [propertyId]: created };
  return created;
}

/**
 * @description 读取字符串筛选内容。
 * @param row 表格当前行。
 * @returns 文本。
 */
function readPropertyFilterText(row: unknown) {
  return propertyFilters.value[readObjectProperty(row).id]?.text ?? "";
}

/**
 * @description 写入字符串筛选内容。
 * @param row 表格当前行。
 * @param value 输入文本。
 */
function updatePropertyFilterText(row: unknown, value: string) {
  const propertyId = readObjectProperty(row).id;
  if (!propertyId) {
    return;
  }
  const current = ensurePropertyFilter(propertyId);
  propertyFilters.value = { ...propertyFilters.value, [propertyId]: { ...current, text: value } };
}

/**
 * @description 读取数值筛选内容。
 * @param row 表格当前行。
 * @returns 数值，未填写时为空。
 */
function readPropertyFilterNumber(row: unknown) {
  return propertyFilters.value[readObjectProperty(row).id]?.number ?? null;
}

/**
 * @description 写入数值筛选内容。
 * @param row 表格当前行。
 * @param value 数字输入值。
 */
function updatePropertyFilterNumber(row: unknown, value: number | undefined) {
  const propertyId = readObjectProperty(row).id;
  if (!propertyId) {
    return;
  }
  const current = ensurePropertyFilter(propertyId);
  propertyFilters.value = { ...propertyFilters.value, [propertyId]: { ...current, number: typeof value === "number" ? value : null } };
}

/**
 * @description 读取时间段筛选内容。
 * @param row 表格当前行。
 * @returns 开始和结束时间。
 */
function readPropertyDateRange(row: unknown) {
  return propertyFilters.value[readObjectProperty(row).id]?.dateRange;
}

/**
 * @description 写入时间段筛选内容。
 * @param row 表格当前行。
 * @param value 日期范围选择值。
 */
function updatePropertyDateRange(row: unknown, value: unknown) {
  const propertyId = readObjectProperty(row).id;
  if (!propertyId) {
    return;
  }
  const range =
    Array.isArray(value) && value.length === 2 && value.every((item) => typeof item === "string") ? ([value[0], value[1]] as [string, string]) : undefined;
  const current = ensurePropertyFilter(propertyId);
  propertyFilters.value = { ...propertyFilters.value, [propertyId]: { ...current, dateRange: range } };
}

/**
 * @description 读取布尔筛选内容。
 * @param row 表格当前行。
 * @returns 是否值。
 */
function readPropertyFilterBoolean(row: unknown) {
  return propertyFilters.value[readObjectProperty(row).id]?.booleanValue;
}

/**
 * @description 写入布尔筛选内容。
 * @param row 表格当前行。
 * @param value 下拉选择值。
 */
function updatePropertyFilterBoolean(row: unknown, value: unknown) {
  const propertyId = readObjectProperty(row).id;
  if (!propertyId) {
    return;
  }
  const current = ensurePropertyFilter(propertyId);
  propertyFilters.value = { ...propertyFilters.value, [propertyId]: { ...current, booleanValue: typeof value === "boolean" ? value : undefined } };
}

/**
 * @description 把父级已选实例 id 同步到表格勾选状态。
 */
function applyInstanceTableSelection() {
  const table = instanceTableRef.value;
  if (!table || props.currentStepIndex !== 1) {
    return;
  }
  const selectedIds = new Set(props.selectedInstanceIds);
  isApplyingInstanceSelection = true;
  props.instanceRows.forEach((row) => {
    table.toggleRowSelection(row, selectedIds.has(row.id));
  });
  void nextTick(() => {
    isApplyingInstanceSelection = false;
  });
}

/**
 * @description 将表格勾选行同步为父级已选实例 id。
 * @param rows 当前勾选的实例行。
 */
function syncSelectedInstanceRows(rows: unknown[]) {
  if (isApplyingInstanceSelection) {
    return;
  }
  emit(
    "update:selectedInstanceIds",
    rows.flatMap((row) => {
      if (row && typeof row === "object" && "id" in row && typeof row.id === "string") {
        return [row.id];
      }
      return [];
    }),
  );
}

watch(
  () => [props.currentStepIndex, props.instanceRows, props.selectedInstanceIds] as const,
  async () => {
    if (props.currentStepIndex !== 1) {
      return;
    }
    await nextTick();
    applyInstanceTableSelection();
  },
  { immediate: true },
);

/**
 * @description 把父级已选关系 id 同步到表格勾选状态。
 */
function applyRelationTableSelection() {
  const table = relationTableRef.value;
  if (!table || props.currentStepIndex !== 3) {
    return;
  }
  const selectedIds = new Set(props.selectedRelationIds);
  isApplyingRelationSelection = true;
  props.relationRows.forEach((row) => {
    table.toggleRowSelection(row, selectedIds.has(row.id));
  });
  void nextTick(() => {
    isApplyingRelationSelection = false;
  });
}

/**
 * @description 将表格勾选行同步为父级已选关系 id。
 * @param rows 当前勾选的关系行。
 */
function syncSelectedRelationRows(rows: unknown[]) {
  if (isApplyingRelationSelection) {
    return;
  }
  emit(
    "update:selectedRelationIds",
    rows.flatMap((row) => {
      if (row && typeof row === "object" && "id" in row && typeof row.id === "string") {
        return [row.id];
      }
      return [];
    }),
  );
}

watch(
  () => [props.currentStepIndex, props.relationRows, props.selectedRelationIds] as const,
  async () => {
    if (props.currentStepIndex !== 3) {
      return;
    }
    await nextTick();
    applyRelationTableSelection();
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.subspace-create-workspace {
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  flex: 1;
  flex-direction: column;
  gap: 8px;
}

.subspace-create-workspace__panel {
  border: 1px solid var(--aircas-color-accent-cyan-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background);
}

.subspace-create-workspace__header {
  display: grid;
  width: 100%;
  height: 61.33px;
  flex-shrink: 0;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
}

.subspace-create-workspace__header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.subspace-create-workspace__header span {
  min-width: 0;
  overflow: hidden;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subspace-create-workspace__form {
  display: grid;
  width: 100%;
  flex-shrink: 0;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
}

.subspace-create-workspace__form :deep(.el-form-item) {
  margin-bottom: 0;
}

.subspace-create-workspace__steps {
  display: flex;
  width: 100%;
  height: 47.33px;
  flex-shrink: 0;
  align-items: center;
  margin: 0;
  padding: 0 16px;
  list-style: none;
}

.subspace-create-workspace__steps li {
  position: relative;
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
}

.subspace-create-workspace__steps li.is-finish {
  color: var(--aircas-color-title);
}

.subspace-create-workspace__steps li.is-process {
  color: var(--aircas-color-text-primary);
}

.subspace-create-workspace__steps li.is-wait {
  color: var(--aircas-color-text-muted);
}

.subspace-create-workspace__step-index {
  display: grid;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  place-items: center;
  border: 1px solid var(--aircas-color-text-muted);
  border-radius: 50%;
  background: var(--aircas-color-transparent);
}

.subspace-create-workspace__steps li.is-finish .subspace-create-workspace__step-index {
  border-color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-accent-cyan);
}

.subspace-create-workspace__steps li.is-finish .subspace-create-workspace__step-index::after {
  content: "";
  width: 4px;
  height: 7px;
  margin-bottom: 2px;
  border-right: 2px solid var(--aircas-color-page-background);
  border-bottom: 2px solid var(--aircas-color-page-background);
  transform: rotate(45deg);
}

.subspace-create-workspace__steps li.is-process .subspace-create-workspace__step-index {
  border-color: var(--aircas-color-text-primary);
}

.subspace-create-workspace__steps li.is-process .subspace-create-workspace__step-index::after {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--aircas-color-accent-cyan);
}

.subspace-create-workspace__step-arrow {
  position: absolute;
  right: 0;
  width: 8px;
  height: 8px;
  border-top: 1px solid var(--aircas-color-text-muted);
  border-right: 1px solid var(--aircas-color-text-muted);
  transform: rotate(45deg);
}

.subspace-create-workspace__empty {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
}

.subspace-create-workspace__empty-header {
  display: flex;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.subspace-create-workspace__empty-header h2 {
  margin: 0 0 8px;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
}

.subspace-create-workspace__empty-header p {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
}

.subspace-create-workspace__empty-header strong {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
  font-weight: 400;
}

.subspace-create-workspace__empty :deep(.aircas-empty) {
  min-height: 0;
  flex: 1;
}

.subspace-create-workspace__cards {
  display: grid;
  min-height: 0;
  flex: 1;
  align-content: start;
  grid-template-columns: repeat(auto-fill, minmax(260px, 280px));
  gap: 16px;
  margin-top: 16px;
  overflow: auto;
}

.subspace-create-workspace__card {
  display: grid;
  min-width: 0;
  grid-template-columns: 40px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--aircas-color-card-background-active);
}

.subspace-create-workspace__card:hover {
  background: var(--aircas-color-selected-background);
}

.subspace-create-workspace__card:focus-visible {
  outline: 2px solid var(--aircas-color-accent-cyan);
  outline-offset: 2px;
}

.subspace-create-workspace__card-icon {
  color: var(--aircas-color-text-muted);
  font-size: 28px;
}

.subspace-create-workspace__card-body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.subspace-create-workspace__card-body strong,
.subspace-create-workspace__card-body small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subspace-create-workspace__card-body strong {
  color: var(--aircas-color-text-primary);
  font-size: 14px;
  font-weight: 600;
}

.subspace-create-workspace__card-body small {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}

.subspace-create-workspace__table {
  width: 100%;
  min-height: 0;
  flex: 1;
  margin-top: 16px;
}

.subspace-create-workspace__property-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
}

.subspace-create-workspace__properties {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
  overflow: auto;
}

.subspace-create-workspace__property-group {
  overflow: hidden;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
}

.subspace-create-workspace__property-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: var(--aircas-color-card-background-active);
}

.subspace-create-workspace__property-group-header strong {
  color: var(--aircas-color-text-primary);
  font-size: 14px;
}

.subspace-create-workspace__property-group-header span {
  margin-left: 8px;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}

.subspace-create-workspace__property-table {
  width: 100%;
}

.subspace-create-workspace__property-name {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.subspace-create-workspace__property-name strong,
.subspace-create-workspace__property-name small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subspace-create-workspace__property-name strong {
  color: var(--aircas-color-text-primary);
  font-size: 14px;
}

.subspace-create-workspace__property-name small {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}

.subspace-create-workspace__property-filter {
  width: 100%;
}
</style>
