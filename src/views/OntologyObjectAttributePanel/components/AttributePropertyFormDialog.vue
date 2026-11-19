<template>
  <el-dialog
    :title="editingAttributeId === null ? '添加属性' : '编辑属性'"
    width="min(760px, 94vw)"
    :close-on-click-modal="false"
    append-to-body
    destroy-on-close
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-alert v-if="datasourceLocked" title="该属性已绑定数据源，仅支持修改属性名称、属性分类和描述" type="info" show-icon :closable="false" />
    <el-form ref="formRef" :model="draft" :rules="rules" label-position="top" data-onboarding="attribute-create-required">
      <div class="ontology-object-attribute-panel__form-grid">
        <el-form-item label="属性名称" prop="displayName">
          <el-input v-model="draft.displayName" placeholder="例如：任务优先级" />
        </el-form-item>
        <el-form-item label="API" prop="apiName">
          <el-input v-model="draft.apiName" placeholder="例如：priority" :disabled="datasourceLocked || draft.isPrimary" />
        </el-form-item>
        <el-form-item label="属性分类" prop="categoryId" class="ontology-object-attribute-panel__form-full">
          <el-tree-select
            v-model="draft.categoryId"
            :data="categoryOptions"
            check-strictly
            default-expand-all
            :render-after-expand="false"
            node-key="id"
            :props="{ label: 'label', children: 'children' }"
            placeholder="请选择属性分类"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="数据类型" prop="dataType" class="ontology-object-attribute-panel__aligned-item">
          <el-select v-model="draft.dataType" placeholder="请选择数据类型" :disabled="datasourceLocked || draft.isPrimary">
            <el-option v-for="type in dataTypes" :key="type" :label="type" :value="type" />
          </el-select>
        </el-form-item>
        <el-form-item prop="storageGroup" class="ontology-object-attribute-panel__aligned-item">
          <template #label>
            <span>存储分组</span>
            <el-tooltip
              content="支持输入分组名称，回车后创建新的存储分组。存储分组用于创建子表，除main分组外，其他分组均会构建相应的子表"
              placement="top"
              :show-after="200"
            >
              <button type="button" class="el-button is-text is-circle" aria-label="存储分组帮助">
                <el-icon><QuestionFilled /></el-icon>
              </button>
            </el-tooltip>
          </template>
          <el-select v-model="draft.storageGroup" placeholder="请输入或选择存储分组" filterable allow-create default-first-option :disabled="datasourceLocked">
            <el-option v-for="group in storageGroups" :key="group.value" :label="group.label" :value="group.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="元数据" class="ontology-object-attribute-panel__form-full">
          <el-tree-select
            v-model="pendingMetadataId"
            :data="metadataTreeOptions"
            node-key="id"
            check-strictly
            default-expand-all
            :render-after-expand="false"
            :props="{ label: 'name', children: 'children' }"
            placeholder="请选择元数据"
            v-on="metadataSelectListeners"
            :loading="metadataLoading"
            style="width: 100%"
          />
          <p v-if="metadataError" class="ontology-object-attribute-panel__metadata-error" role="alert">{{ metadataError }}</p>
          <div v-if="selectedMetadataRecords.length" class="ontology-object-attribute-panel__metadata-tags">
            <el-tag v-for="item in selectedMetadataRecords" :key="item.id" type="info" closable @close="removeSelectedMetadata(item.id)">
              {{ item.name }}（{{ item.typeLabel }}）：{{ item.valueSummary }}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="默认值" prop="defaultValue" class="ontology-object-attribute-panel__form-full">
          <el-input v-model="draft.defaultValue" placeholder="可选" :disabled="datasourceLocked" />
        </el-form-item>
      </div>
      <el-form-item label="属性描述" class="ontology-object-attribute-panel__form-full">
        <el-input v-model="draft.description" type="textarea" :rows="3" placeholder="请输入属性描述" />
      </el-form-item>
      <div class="ontology-object-attribute-panel__switches">
        <div class="ontology-object-attribute-panel__switch-field">
          <span>主键</span>
          <el-switch
            :model-value="draft.isPrimary"
            inline-prompt
            active-text="是"
            inactive-text="否"
            :disabled="datasourceLocked"
            @update:model-value="$emit('update-primary', $event === true)"
          />
        </div>
        <div class="ontology-object-attribute-panel__switch-field">
          <span>名称键</span>
          <el-switch
            :model-value="draft.isNameKey"
            inline-prompt
            active-text="是"
            inactive-text="否"
            :disabled="datasourceLocked"
            @update:model-value="$emit('update-name-key', $event === true)"
          />
        </div>
      </div>
    </el-form>
    <p v-if="commandError" class="ontology-object-attribute-panel__dialog-error" role="alert">{{ commandError }}</p>
    <template #footer>
      <el-button data-onboarding="attribute-create-cancel" @click="$emit('update:visible', false)">取消</el-button>
      <el-button :loading="saving" data-onboarding="attribute-create-save" @click="confirmSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { QuestionFilled } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";
import type { OntologyAttributeCategoryNode, OntologyAttributeDraft, OntologyAttributeStorageGroupOption } from "@/types";
import { getMetadataSchemaInterface } from "@/apis";
import { buildMetadataTree, formatMetadataValueSummary, resolveMetadataValueTypeLabel } from "../utils/metadataOperations";
import { parseMetadataSchema } from "../utils/metadataSchemaAdapter";

const props = defineProps<{
  visible: boolean;
  ontologyIdentifier: string;
  editingAttributeId: string | null;
  /** 属性是否已绑定数据源；绑定时仅属性名称、属性分类和描述可修改。 */
  datasourceLocked: boolean;
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
  "update-primary": [enabled: boolean];
  "update-name-key": [enabled: boolean];
  "update-metadata": [records: unknown[]];
  confirm: [];
}>();

const formRef = ref<FormInstance>();
const metadataRecords = ref<ReturnType<typeof parseMetadataSchema>>([]);
const metadataLoading = ref(false);
const metadataError = ref("");
let metadataRevision = 0;
const selectedMetadataIds = computed(() => {
  const selected = props.draft.metadata.selectedRecords;
  if (!Array.isArray(selected)) return [];
  return selected.flatMap((item) => (item && typeof item === "object" && "id" in item && typeof item.id === "string" ? [item.id] : []));
});
const pendingMetadataId = ref("");
const metadataSelectListeners = { change: handleMetadataSelect };
const metadataTreeOptions = computed(() => buildMetadataTree(metadataRecords.value));
const selectedMetadataRecords = computed(() =>
  metadataRecords.value
    .filter((item) => selectedMetadataIds.value.includes(item.id))
    .map((item) => ({
      id: item.id,
      name: item.name,
      typeLabel: resolveMetadataValueTypeLabel(item.valueType),
      valueSummary: formatMetadataValueSummary(item),
    })),
);

/**
 * @description 将下拉框单选项加入下方卡片，并清空选择框。
 * @param value 选中的元数据 ID。
 */
function handleMetadataSelect(value: string | number | boolean | Record<string, unknown> | undefined): void {
  const id = value == null || value === false ? "" : String(value);
  if (id && !selectedMetadataIds.value.includes(id)) {
    const record = metadataRecords.value.find((item) => item.id === id);
    if (record) emit("update-metadata", [...(Array.isArray(props.draft.metadata.selectedRecords) ? props.draft.metadata.selectedRecords : []), { ...record }]);
  }
  pendingMetadataId.value = "";
}

/**
 * @description 从属性草稿中移除指定的元数据选择。
 * @param id 待移除的元数据 ID。
 */
function removeSelectedMetadata(id: string): void {
  const selected = props.draft.metadata.selectedRecords;
  const records = Array.isArray(selected) ? selected : [];
  emit(
    "update-metadata",
    records.filter((item) => !item || typeof item !== "object" || !("id" in item) || item.id !== id),
  );
}

/** @description 打开属性表单时查询当前对象的元数据树。 */
async function loadMetadataRecords(): Promise<void> {
  const revision = ++metadataRevision;
  metadataRecords.value = [];
  metadataLoading.value = false;
  metadataError.value = "";
  if (!props.visible) return;
  if (!props.ontologyIdentifier.trim()) {
    metadataError.value = "缺少对象标识，无法查询元数据";
    return;
  }
  metadataLoading.value = true;
  try {
    const response = await getMetadataSchemaInterface(props.ontologyIdentifier.trim());
    if (revision !== metadataRevision) return;
    if (response.code !== 200) throw new Error(response.message || "查询元数据失败");
    metadataRecords.value = parseMetadataSchema(response.data);
  } catch (cause) {
    if (revision !== metadataRevision) return;
    metadataRecords.value = [];
    metadataError.value = cause instanceof Error ? cause.message : "查询元数据失败";
  } finally {
    if (revision === metadataRevision) metadataLoading.value = false;
  }
}

watch(() => [props.visible, props.ontologyIdentifier], loadMetadataRecords, { immediate: true });

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

.ontology-object-attribute-panel__metadata-error {
  margin: 4px 0 0;
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

.ontology-object-attribute-panel__aligned-item {
  align-self: stretch;
}

.ontology-object-attribute-panel__aligned-item :deep(.el-form-item__label) {
  height: var(--aircas-size-button);
  align-items: center;
}

.ontology-object-attribute-panel__metadata-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.ontology-object-attribute-panel__metadata-tags :deep(.el-tag) {
  --el-tag-text-color: var(--aircas-color-text-primary);
  --el-tag-bg-color: var(--aircas-color-hover);
  --el-tag-border-color: var(--aircas-color-border);
  --el-tag-hover-color: var(--aircas-color-primary);
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
