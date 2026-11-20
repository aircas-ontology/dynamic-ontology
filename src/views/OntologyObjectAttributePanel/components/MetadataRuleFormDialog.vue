<template>
  <el-dialog
    :title="editing ? '编辑元数据' : '添加元数据'"
    width="min(560px, 94vw)"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form label-position="top">
      <el-form-item label="元数据名称" required>
        <el-input
          maxlength="64"
          ariaLabel="元数据名称"
          placeholder="请输入元数据名称"
          :model-value="name"
          :disabled="submitting"
          @update:model-value="$emit('update:name', $event)"
        />
      </el-form-item>
      <el-form-item label="父级" required>
        <el-tree-select
          v-model="selectedParentId"
          :data="parentTree"
          node-key="id"
          :props="treeSelectProps"
          check-strictly
          filterable
          :render-after-expand="false"
          :disabled="submitting || parentLocked"
          placeholder="请选择父级"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="类型" required>
        <el-select :model-value="valueType" ariaLabel="元数据类型" :disabled="submitting" @update:model-value="$emit('update:valueType', $event)">
          <el-option v-for="option in valueTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
        </el-select>
      </el-form-item>

      <el-form-item v-if="valueType === 'enum'" label="值">
        <div class="metadata-rule-form__enum-list">
          <div class="metadata-rule-form__enum-tags" aria-label="已添加枚举值">
            <el-tag v-for="(value, index) in enumValues" :key="`enum-${index}`" closable :disable-transitions="true" @close="$emit('remove-enum-value', index)">
              {{ value }}
            </el-tag>
          </div>
          <div class="metadata-rule-form__enum-input">
            <el-input v-model="enumInput" placeholder="请输入枚举值" :disabled="submitting" @keyup.enter="addEnumValue" />
            <el-button :disabled="submitting || !enumInput.trim()" @click="addEnumValue">添加枚举值</el-button>
          </div>
        </div>
      </el-form-item>
    </el-form>
    <p v-if="error" class="ontology-object-attribute-panel__dialog-error" role="alert">{{ error }}</p>
    <template #footer>
      <el-button :disabled="submitting" @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="$emit('confirm')">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { OntologyAttributeMetadataValueType } from "@/types";
import type { OntologyAttributeMetadataParentSelectNode } from "../utils/metadataOperations";

const props = defineProps<{
  visible: boolean;
  editing: boolean;
  parentLocked: boolean;
  name: string;
  parentId: string;
  parentTree: OntologyAttributeMetadataParentSelectNode[];
  valueType: OntologyAttributeMetadataValueType;
  valueTypeOptions: ReadonlyArray<{ label: string; value: OntologyAttributeMetadataValueType }>;
  inputValue: string;
  rangeMin: number | null;
  rangeMax: number | null;
  enumValues: string[];
  submitting: boolean;
  error: string;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  "update:name": [value: string];
  "update:parentId": [value: string];
  "update:valueType": [value: OntologyAttributeMetadataValueType];
  "update:inputValue": [value: string];
  "update:rangeMin": [value: number | null];
  "update:rangeMax": [value: number | null];
  "add-enum-value": [value: string];
  "remove-enum-value": [index: number];
  confirm: [];
}>();

const enumInput = ref("");
watch(
  () => props.visible,
  (visible) => {
    if (visible) enumInput.value = "";
  },
);

/** @description 将输入框中的枚举值加入本地标签列表。 */
function addEnumValue(): void {
  const value = enumInput.value.trim();
  if (!value) return;
  emit("add-enum-value", value);
  enumInput.value = "";
}

const treeSelectProps = { label: "label", children: "children" };

/**
 * @description 将父级 id 与 TreeSelect 双向绑定。
 */
const selectedParentId = computed({
  /**
   * @description 读取当前父级 id。
   * @returns 父级 id。
   */
  get: () => props.parentId,
  /**
   * @description 回写父级 id。
   * @param value TreeSelect 选中值。
   */
  set: (value: string | number | boolean | Record<string, unknown> | undefined) => {
    emit("update:parentId", value == null || value === false ? "" : String(value));
  },
});
</script>

<style scoped lang="scss">
.ontology-object-attribute-panel__dialog-error {
  margin: 8px 0 0;
  color: var(--aircas-color-danger);
  font-size: 12px;
}

.metadata-rule-form__enum-list {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 8px;
}

.metadata-rule-form__enum-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.metadata-rule-form__enum-tags,
.metadata-rule-form__enum-input {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.metadata-rule-form__enum-input .el-input {
  flex: 1;
}
</style>
