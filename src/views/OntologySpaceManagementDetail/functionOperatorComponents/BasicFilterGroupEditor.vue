<template>
  <div class="basic-filter-group" :class="`basic-filter-group--depth-${depth}`">
    <div class="basic-filter-group__toolbar">
      <el-select
        :model-value="group.logic"
        class="aircas-select basic-filter-group__logic"
        popper-class="aircas-select-popper"
        style="width: 140px"
        @update:model-value="updateLogic"
      >
        <el-option v-for="item in BASIC_FILTER_LOGIC_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <div class="basic-filter-group__actions">
        <el-button class="aircas-button" size="small" @click="addFilter">+ 条件</el-button>
        <el-button v-if="depth < 3" class="aircas-button" size="small" @click="addGroup">+ 分组</el-button>
      </div>
    </div>

    <div class="basic-filter-group__children">
      <div v-for="(child, index) in group.children" :key="`${depth}-${index}-${child.type}`" class="basic-filter-group__child">
        <template v-if="child.type === 'FILTER' && child.filter">
          <div class="basic-filter-row">
            <el-input
              :model-value="child.filter.propertyApiName"
              class="aircas-input basic-filter-row__property"
              maxlength="64"
              placeholder="输入变量名"
              @update:model-value="(value) => updateFilterProperty(index, value)"
            />
            <el-select
              :model-value="child.filter.valueType"
              class="aircas-select basic-filter-row__value-type"
              popper-class="aircas-select-popper"
              @update:model-value="(value) => updateFilterValueType(index, value)"
            >
              <el-option v-for="item in BASIC_FILTER_VALUE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-select
              :model-value="child.filter.op"
              class="aircas-select basic-filter-row__op"
              popper-class="aircas-select-popper"
              @update:model-value="(value) => updateFilterOp(index, value)"
            >
              <el-option v-for="item in BASIC_FILTER_OP_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <div class="basic-filter-row__values">
              <template v-if="opNeedsRange(child.filter.op)">
                <template v-if="child.filter.valueType === 'number'">
                  <el-input-number
                    :model-value="Number(child.filter.values?.[0] ?? 0)"
                    class="basic-filter-row__number"
                    controls-position="right"
                    @update:model-value="(value) => updateFilterRange(index, 0, value ?? 0)"
                  />
                  <el-input-number
                    :model-value="Number(child.filter.values?.[1] ?? 0)"
                    class="basic-filter-row__number"
                    controls-position="right"
                    @update:model-value="(value) => updateFilterRange(index, 1, value ?? 0)"
                  />
                </template>
                <template v-else>
                  <el-input
                    :model-value="String(child.filter.values?.[0] ?? '')"
                    class="aircas-input"
                    placeholder="最小值"
                    @update:model-value="(value) => updateFilterRange(index, 0, value)"
                  />
                  <el-input
                    :model-value="String(child.filter.values?.[1] ?? '')"
                    class="aircas-input"
                    placeholder="最大值"
                    @update:model-value="(value) => updateFilterRange(index, 1, value)"
                  />
                </template>
              </template>
              <template v-else-if="opNeedsValue(child.filter.op)">
                <el-select
                  v-if="child.filter.valueType === 'boolean'"
                  :model-value="Boolean(child.filter.value)"
                  class="aircas-select"
                  popper-class="aircas-select-popper"
                  @update:model-value="(value) => updateFilterValue(index, Boolean(value))"
                >
                  <el-option label="true" :value="true" />
                  <el-option label="false" :value="false" />
                </el-select>
                <el-input-number
                  v-else-if="child.filter.valueType === 'number'"
                  :model-value="Number(child.filter.value ?? 0)"
                  class="basic-filter-row__number"
                  controls-position="right"
                  @update:model-value="(value) => updateFilterValue(index, value ?? 0)"
                />
                <el-input
                  v-else
                  :model-value="String(child.filter.value ?? '')"
                  class="aircas-input"
                  placeholder="输入值"
                  @update:model-value="(value) => updateFilterValue(index, value)"
                />
              </template>
              <span v-else class="basic-filter-row__value-placeholder">无需取值</span>
            </div>
            <el-button type="danger" plain class="aircas-button basic-filter-row__remove" :disabled="group.children.length <= 1" @click="removeChild(index)">
              删除
            </el-button>
          </div>
        </template>
        <template v-else-if="child.type === 'GROUP' && child.group">
          <div class="basic-filter-group__nested">
            <div class="basic-filter-group__nested-header">
              <span>分组</span>
              <el-button type="danger" plain class="aircas-button basic-filter-row__remove" :disabled="group.children.length <= 1" @click="removeChild(index)">
                删除分组
              </el-button>
            </div>
            <BasicFilterGroupEditor :group="child.group" :depth="depth + 1" @update:group="(value) => updateNestedGroup(index, value)" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  BASIC_FILTER_LOGIC_OPTIONS,
  BASIC_FILTER_OP_OPTIONS,
  BASIC_FILTER_VALUE_TYPE_OPTIONS,
  type BasicFilterDocument,
  type BasicFilterLogic,
  type BasicFilterOp,
  type BasicFilterValue,
  type BasicFilterValueType,
} from "@/types";
import { createEmptyBasicFilterGroup, createEmptyBasicFilterNode, opNeedsRange, opNeedsValue } from "@/utils/functionOperatorBasicFilter";

defineOptions({ name: "BasicFilterGroupEditor" });

const props = defineProps<{
  group: BasicFilterDocument;
  depth: number;
}>();

const emit = defineEmits<{
  "update:group": [value: BasicFilterDocument];
}>();

/**
 * @description 克隆当前过滤分组，避免直接修改 props。
 * @returns 深拷贝后的分组文档。
 */
function cloneGroup(): BasicFilterDocument {
  return JSON.parse(JSON.stringify(props.group)) as BasicFilterDocument;
}

function publish(next: BasicFilterDocument): void {
  emit("update:group", next);
}

function updateLogic(value: string | number | boolean | undefined): void {
  if (value !== "AND" && value !== "OR") return;
  const next = cloneGroup();
  next.logic = value as BasicFilterLogic;
  publish(next);
}

function addFilter(): void {
  const next = cloneGroup();
  next.children.push(createEmptyBasicFilterNode());
  publish(next);
}

function addGroup(): void {
  const next = cloneGroup();
  next.children.push(createEmptyBasicFilterGroup());
  publish(next);
}

function removeChild(index: number): void {
  if (props.group.children.length <= 1) return;
  const next = cloneGroup();
  next.children.splice(index, 1);
  publish(next);
}

function defaultValueForType(valueType: BasicFilterValueType): BasicFilterValue {
  if (valueType === "number") return 0;
  if (valueType === "boolean") return false;
  return "";
}

function coerceToType(value: unknown, valueType: BasicFilterValueType): BasicFilterValue {
  if (valueType === "boolean") return value === true || value === "true";
  if (valueType === "number") {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return value === undefined || value === null ? "" : String(value);
}

function updateFilterProperty(index: number, value: string | number): void {
  const next = cloneGroup();
  const child = next.children[index];
  if (!child?.filter) return;
  child.filter.propertyApiName = String(value);
  publish(next);
}

function updateFilterValueType(index: number, value: string | number | boolean | undefined): void {
  if (value !== "string" && value !== "number" && value !== "boolean") return;
  const next = cloneGroup();
  const child = next.children[index];
  if (!child?.filter) return;
  const valueType = value as BasicFilterValueType;
  child.filter.valueType = valueType;
  if (child.filter.op === "BETWEEN") {
    child.filter.values = [coerceToType(child.filter.values?.[0], valueType), coerceToType(child.filter.values?.[1], valueType)];
    delete child.filter.value;
  } else if (child.filter.op !== "IS_NULL" && child.filter.op !== "IS_NOT_NULL") {
    child.filter.value = coerceToType(child.filter.value, valueType);
    delete child.filter.values;
  }
  publish(next);
}

function updateFilterOp(index: number, value: string | number | boolean | undefined): void {
  const next = cloneGroup();
  const child = next.children[index];
  if (!child?.filter || typeof value !== "string") return;
  const op = value as BasicFilterOp;
  const valueType = child.filter.valueType || "string";
  child.filter.op = op;
  if (op === "BETWEEN") {
    child.filter.values = [
      coerceToType(child.filter.values?.[0] ?? child.filter.value, valueType),
      coerceToType(child.filter.values?.[1] ?? defaultValueForType(valueType), valueType),
    ];
    delete child.filter.value;
  } else if (op === "IS_NULL" || op === "IS_NOT_NULL") {
    delete child.filter.value;
    delete child.filter.values;
  } else {
    child.filter.value = coerceToType(child.filter.value ?? defaultValueForType(valueType), valueType);
    delete child.filter.values;
  }
  publish(next);
}

function updateFilterValue(index: number, value: string | number | boolean): void {
  const next = cloneGroup();
  const child = next.children[index];
  if (!child?.filter) return;
  child.filter.value = coerceToType(value, child.filter.valueType || "string");
  publish(next);
}

function updateFilterRange(index: number, slot: 0 | 1, value: string | number): void {
  const next = cloneGroup();
  const child = next.children[index];
  if (!child?.filter) return;
  const valueType = child.filter.valueType || "string";
  const values = [...(child.filter.values ?? [defaultValueForType(valueType), defaultValueForType(valueType)])];
  values[slot] = coerceToType(value, valueType);
  child.filter.values = [values[0] ?? defaultValueForType(valueType), values[1] ?? defaultValueForType(valueType)];
  publish(next);
}

function updateNestedGroup(index: number, group: BasicFilterDocument): void {
  const next = cloneGroup();
  const child = next.children[index];
  if (!child || child.type !== "GROUP") return;
  child.group = group;
  publish(next);
}
</script>

<style scoped lang="scss">
.basic-filter-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
  background: var(--aircas-color-card-background);
}

.basic-filter-group__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.basic-filter-group__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.basic-filter-group__children {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.basic-filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.basic-filter-row__property {
  flex: 1.2;
  min-width: 120px;
}

.basic-filter-row__value-type {
  flex: 0 0 110px;
  width: 110px;
}

.basic-filter-row__op {
  flex: 0 0 150px;
  width: 150px;
}

.basic-filter-row__values {
  display: flex;
  flex: 0 1 160px;
  min-width: 120px;
  max-width: 200px;
  align-items: center;
  gap: 8px;
}

.basic-filter-row__value-placeholder {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}

.basic-filter-group__nested {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  border: 1px dashed var(--aircas-color-border-soft);
  border-radius: 8px;
  background: var(--aircas-color-overlay);
}

:root[theme="light"] .basic-filter-group__nested {
  background: var(--aircas-color-panel-background);
}

.basic-filter-row__number {
  width: 100%;
  max-width: 140px;
  --el-fill-color-blank: var(--aircas-color-input-background);
  --el-input-bg-color: var(--aircas-color-input-background);
  --el-input-border-color: var(--aircas-color-border);
  --el-input-hover-border-color: var(--aircas-color-border-highlight);
  --el-input-focus-border-color: var(--aircas-color-focus-border);
  --el-input-text-color: var(--aircas-color-text-primary);
  --el-disabled-bg-color: var(--aircas-color-input-background);
  --el-text-color-regular: var(--aircas-color-text-primary);
}

.basic-filter-row__number :deep(.el-input__wrapper) {
  height: 32px;
  min-height: 32px;
  padding: 0 8px;
  background-color: var(--aircas-color-input-background);
  box-shadow: 0 0 0 1px var(--aircas-color-border) inset;
}

.basic-filter-row__number :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--aircas-color-border-highlight) inset;
}

.basic-filter-row__number :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--aircas-color-focus-border) inset;
}

.basic-filter-row__number :deep(.el-input-number__decrease),
.basic-filter-row__number :deep(.el-input-number__increase) {
  width: 28px;
  background: var(--aircas-color-panel-background-deep);
  border-color: var(--aircas-color-border-soft);
  color: var(--aircas-color-text-secondary);
}

.basic-filter-row__number :deep(.el-input-number__decrease:hover),
.basic-filter-row__number :deep(.el-input-number__increase:hover) {
  color: var(--aircas-color-text-primary);
}

.basic-filter-row__remove.aircas-button {
  flex: 0 0 auto;
  height: 32px;
  min-height: 32px;
  padding: 0 12px;
  margin-left: 0;
}

.basic-filter-group__nested-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--aircas-color-text-primary);
  font-size: 12px;
  font-weight: 600;
}
</style>
