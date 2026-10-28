<template>
  <div class="external-api-param-fields" :style="{ marginLeft: `${indentPx}px` }">
    <div class="external-api-param-fields__head">
      <el-button type="primary" plain native-type="button" @click="addFieldRow">添加属性</el-button>
    </div>
    <div v-for="(row, index) in modelValue" :key="row.id" class="external-api-param-fields__row">
      <el-input v-model="row.name" maxlength="64" placeholder="请输入字段名称" />
      <el-select v-model="row.type" placeholder="请选择 type" @change="onFieldTypeChange(row)">
        <el-option v-for="item in typeOptions" :key="`${row.id}-${item}`" :label="item" :value="item" />
      </el-select>
      <el-input v-model="row.description" maxlength="240" placeholder="请输入描述" />
      <el-button type="danger" plain native-type="button" @click="removeFieldRow(index)">删除</el-button>
      <FunctionOperatorExternalApiParamFieldsEditor
        v-if="row.type === 'object'"
        class="external-api-param-fields__nested"
        :model-value="ensureObjectFields(row)"
        :type-options="typeOptions"
        :create-field-id="createFieldId"
        :depth="(depth ?? 0) + 1"
        @update:model-value="(next) => onNestedFieldsChange(row, next)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

/** 外部 API 嵌套属性行。 */
export interface ExternalApiParamFieldRow {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  fields?: ExternalApiParamFieldRow[];
}

const props = defineProps<{
  modelValue: ExternalApiParamFieldRow[];
  typeOptions: ReadonlyArray<"string" | "number" | "boolean" | "array" | "object">;
  /** 生成嵌套属性行 id。 */
  createFieldId: () => string;
  /** 缩进层级，根层为 0。 */
  depth?: number;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: ExternalApiParamFieldRow[]];
}>();

/** 当前层级左边距像素。 */
const indentPx = computed(() => (props.depth ?? 0) * 12);

/**
 * @description 追加一行空的嵌套属性。
 */
function addFieldRow(): void {
  emit("update:modelValue", [
    ...props.modelValue,
    {
      id: props.createFieldId(),
      name: "",
      type: "string",
      description: "",
    },
  ]);
}

/**
 * @description 按序号删除一行嵌套属性。
 * @param index 行序号。
 */
function removeFieldRow(index: number): void {
  emit(
    "update:modelValue",
    props.modelValue.filter((_, rowIndex) => rowIndex !== index),
  );
}

/**
 * @description 属性类型变更时，非 object 清空 fields。
 * @param row 当前属性行。
 */
function onFieldTypeChange(row: ExternalApiParamFieldRow): void {
  if (row.type !== "object") {
    delete row.fields;
  } else if (!row.fields) {
    row.fields = [];
  }
}

/**
 * @description 保证 object 行具备可编辑的 fields 数组引用。
 * @param row 当前属性行。
 * @returns fields 数组。
 */
function ensureObjectFields(row: ExternalApiParamFieldRow): ExternalApiParamFieldRow[] {
  if (!row.fields) {
    row.fields = [];
  }
  return row.fields;
}

/**
 * @description 同步子层 fields 变更到当前行。
 * @param row 当前属性行。
 * @param next 子层最新 fields。
 */
function onNestedFieldsChange(row: ExternalApiParamFieldRow, next: ExternalApiParamFieldRow[]): void {
  row.fields = next;
}
</script>

<style scoped lang="scss">
.external-api-param-fields {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 10px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  background: var(--aircas-color-panel-background-deep);
}

.external-api-param-fields__head {
  display: flex;
  justify-content: flex-start;
}

.external-api-param-fields__row {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(120px, 0.8fr) minmax(0, 1.4fr) 72px;
  gap: 8px;
  align-items: start;
}

.external-api-param-fields__nested {
  grid-column: 1 / -1;
  margin-top: 0;
}
</style>
