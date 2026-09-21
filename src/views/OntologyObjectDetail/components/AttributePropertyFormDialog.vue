<template>
  <el-dialog
    class="aircas-dialog"
    :title="editingAttributeId === null ? '添加属性' : '编辑属性'"
    width="min(760px, 94vw)"
    append-to-body
    destroy-on-close
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="draft" :rules="rules" class="aircas-form" label-position="top">
      <div class="ontology-object-attribute-panel__form-grid">
        <el-form-item label="属性名称" prop="displayName">
          <el-input v-model="draft.displayName" class="aircas-input" placeholder="例如：任务优先级" />
        </el-form-item>
        <el-form-item label="API" prop="apiName">
          <el-input v-model="draft.apiName" class="aircas-input" placeholder="例如：priority" />
        </el-form-item>
        <el-form-item label="属性分类" prop="categoryId" class="ontology-object-attribute-panel__form-full">
          <el-select v-model="draft.categoryId" class="aircas-select" popper-class="aircas-select-popper" placeholder="请选择属性分类">
            <el-option v-for="category in categoryOptions" :key="category.id" :label="category.label" :value="category.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据类型" prop="dataType">
          <el-select v-model="draft.dataType" class="aircas-select" popper-class="aircas-select-popper" placeholder="请选择数据类型">
            <el-option v-for="type in dataTypes" :key="type" :label="type" :value="type" />
          </el-select>
        </el-form-item>
        <el-form-item label="存储分组" prop="storageGroup">
          <el-select v-model="draft.storageGroup" class="aircas-select" popper-class="aircas-select-popper" placeholder="请选择存储分组">
            <el-option v-for="group in storageGroups" :key="group.value" :label="group.label" :value="group.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="默认值" class="ontology-object-attribute-panel__form-full">
          <el-input v-model="draft.defaultValue" class="aircas-input" placeholder="可选" />
        </el-form-item>
      </div>
      <el-form-item label="属性描述" class="ontology-object-attribute-panel__form-full">
        <el-input v-model="draft.description" class="aircas-input" type="textarea" :rows="3" placeholder="请输入属性描述" />
      </el-form-item>
      <div class="ontology-object-attribute-panel__switches">
        <div class="ontology-object-attribute-panel__switch-field">
          <span>主键</span>
          <el-switch
            class="aircas-switch"
            :model-value="draft.isPrimary"
            inline-prompt
            active-text="是"
            inactive-text="否"
            @update:model-value="draft.isPrimary = $event === true"
          />
        </div>
        <div class="ontology-object-attribute-panel__switch-field">
          <span>名称键</span>
          <el-switch
            class="aircas-switch"
            :model-value="draft.isNameKey"
            inline-prompt
            active-text="是"
            inactive-text="否"
            @update:model-value="draft.isNameKey = $event === true"
          />
        </div>
      </div>
    </el-form>
    <p v-if="commandError" class="ontology-object-attribute-panel__dialog-error" role="alert">{{ commandError }}</p>
    <template #footer>
      <el-button class="aircas-button" @click="$emit('update:visible', false)">取消</el-button>
      <el-button class="aircas-button" type="primary" :loading="saving" @click="confirmSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { OntologyAttributeCategoryNode, OntologyAttributeDraft, OntologyAttributeStorageGroupOption } from "@/types";

defineProps<{
  visible: boolean;
  editingAttributeId: string | null;
  draft: OntologyAttributeDraft;
  rules: FormRules<OntologyAttributeDraft>;
  categoryOptions: OntologyAttributeCategoryNode[];
  dataTypes: string[];
  storageGroups: OntologyAttributeStorageGroupOption[];
  commandError: string;
  saving: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  confirm: [];
}>();

const formRef = ref<FormInstance>();

/**
 * @description 校验属性表单后向父组件发出确认保存事件。
 */
async function confirmSave() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  emit("confirm");
}
</script>

<style scoped lang="scss">
.ontology-object-attribute-panel__dialog-error {
  margin: 8px 0 0;
  color: var(--aircas-color-danger);
  font-size: 12px;
}

.ontology-object-attribute-panel__form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}

.ontology-object-attribute-panel__form-full {
  grid-column: 1 / -1;
}

.ontology-object-attribute-panel__switches {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 4px;
}

.ontology-object-attribute-panel__switch-field {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
}

@media (max-width: 720px) {
  .ontology-object-attribute-panel__form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
