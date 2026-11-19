<template>
  <el-dialog
    class="metadata-manage-dialog"
    title="元数据管理"
    width="min(1080px, 96vw)"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="metadata-manage-dialog__body">
      <header class="metadata-manage-dialog__pane-header">
        <div>
          <h3>元数据</h3>
          <p>{{ workspace.items.length }} 条</p>
        </div>
        <div class="metadata-manage-dialog__toolbar">
          <el-button type="primary" :disabled="queryLoading || !!queryError || formSubmitting || deleting" @click="openMetadataCreate">添加元数据</el-button>
        </div>
      </header>

      <el-alert v-if="queryError" :title="queryError" type="error" :closable="false" show-icon />
      <el-button v-if="queryError" :disabled="queryLoading" @click="handleDialogOpened">重试</el-button>
      <p v-if="queryLoading" role="status">正在查询元数据…</p>
      <div v-if="!queryError && tableRows.length" class="metadata-manage-dialog__table-wrap">
        <el-table :data="tableRows" height="100%" stripe row-key="id" default-expand-all :tree-props="{ children: 'children' }">
          <el-table-column prop="name" label="元数据名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="valueTypeLabel" label="类型" width="100" />
          <el-table-column prop="valueSummary" label="值" min-width="220" show-overflow-tooltip />
          <el-table-column label="操作" width="170" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" :disabled="queryLoading || formSubmitting || deleting" @click="openMetadataEdit(String(row.id))"
                >编辑</el-button
              >
              <el-button type="danger" size="small" :disabled="queryLoading || formSubmitting || deleting" @click="handleRemoveMetadata(String(row.id))"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-empty v-else-if="!queryLoading && !queryError" description="暂无元数据" />
    </div>

    <MetadataRuleFormDialog
      :visible="formVisible"
      :editing="!!editingId"
      :parent-locked="parentLocked"
      :name="formName"
      :parent-id="formParentId"
      :parent-tree="parentTree"
      :value-type="formValueType"
      :value-type-options="METADATA_VALUE_TYPE_OPTIONS"
      :input-value="formInputValue"
      :range-min="formRangeMin"
      :range-max="formRangeMax"
      :enum-values="formEnumValues"
      :submitting="formSubmitting"
      :error="formError"
      @update:visible="formVisible = $event"
      @update:name="formName = $event"
      @update:parent-id="formParentId = $event"
      @update:value-type="formValueType = $event"
      @update:input-value="formInputValue = $event"
      @update:range-min="formRangeMin = $event"
      @update:range-max="formRangeMax = $event"
      @add-enum-value="addEnumValue"
      @remove-enum-value="removeEnumValue"
      @confirm="confirmMetadataCreate"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { deleteMetadataSchemaInterface, getMetadataSchemaInterface, postMetadataSchemaInterface, putMetadataSchemaInterface } from "@/apis";
import {
  METADATA_VALUE_TYPE_OPTIONS,
  ROOT_METADATA_PARENT_ID,
  type OntologyAttributeMetadataTreeNode,
  type OntologyAttributeMetadataValueType,
  type OntologyAttributeMetadataWorkspaceData,
} from "@/types";

import {
  buildMetadataParentSelectTree,
  buildMetadataTree,
  collectMetadataDescendantIds,
  formatMetadataValueSummary,
  resolveMetadataValueTypeLabel,
} from "../utils/metadataOperations";
import { parseMetadataSchema, serializeMetadataValue } from "../utils/metadataSchemaAdapter";
import MetadataRuleFormDialog from "./MetadataRuleFormDialog.vue";

const props = defineProps<{
  ontologyIdentifier: string;
  visible: boolean;
}>();

defineEmits<{
  "update:visible": [value: boolean];
}>();

interface MetadataTableRow {
  id: string;
  name: string;
  valueTypeLabel: string;
  valueSummary: string;
  children: MetadataTableRow[];
}

const workspace = ref<OntologyAttributeMetadataWorkspaceData>({ items: [] });

const queryLoading = ref(false);
const queryError = ref("");
const deleting = ref(false);
const editingId = ref("");
let queryRevision = 0;
onScopeDispose(() => {
  queryRevision++;
});
watch(
  () => [props.visible, props.ontologyIdentifier],
  () => {
    queryRevision++;
    formVisible.value = false;
    workspace.value = { items: [] };
    if (props.visible) void handleDialogOpened();
  },
);
const formVisible = ref(false);
const formName = ref("");
const formParentId = ref(ROOT_METADATA_PARENT_ID);
const formValueType = ref<OntologyAttributeMetadataValueType>("input");
const formInputValue = ref("");
const formRangeMin = ref<number | null>(null);
const formRangeMax = ref<number | null>(null);
const formEnumValues = ref<string[]>([]);
const formSubmitting = ref(false);
const formError = ref("");

const parentLocked = computed(
  () => !!editingId.value && workspace.value.items.find((item) => item.id === editingId.value)?.parentId === ROOT_METADATA_PARENT_ID,
);
const parentTree = computed(() =>
  buildMetadataParentSelectTree(workspace.value.items, editingId.value ? collectMetadataDescendantIds(workspace.value.items, editingId.value) : new Set()),
);

/**
 * @description 将树节点映射为表格行。
 * @param nodes 元数据树。
 * @returns 表格树行。
 */
function mapTreeToTableRows(nodes: OntologyAttributeMetadataTreeNode[]): MetadataTableRow[] {
  return nodes.map((node) => ({
    id: node.id,
    name: node.name,
    valueTypeLabel: resolveMetadataValueTypeLabel(node.valueType),
    valueSummary: formatMetadataValueSummary(node),
    children: mapTreeToTableRows(node.children),
  }));
}

const tableRows = computed(() => mapTreeToTableRows(buildMetadataTree(workspace.value.items)));

/** @description 查询当前对象的元数据并拒绝过期响应。 */
async function handleDialogOpened(): Promise<void> {
  const revision = ++queryRevision;
  queryLoading.value = true;
  queryError.value = "";
  workspace.value = { items: [] };
  try {
    if (!props.ontologyIdentifier) throw new Error("缺少对象标识，无法查询元数据");
    const response = await getMetadataSchemaInterface(props.ontologyIdentifier);
    if (revision !== queryRevision) return;
    if (response.code !== 200) throw new Error(response.message || "查询元数据失败");
    workspace.value = { items: parseMetadataSchema(response.data) };
  } catch (cause) {
    if (revision === queryRevision) queryError.value = cause instanceof Error ? cause.message : "查询元数据失败";
  } finally {
    if (revision === queryRevision) queryLoading.value = false;
  }
}

/**
 * @description 回填已有元数据以编辑。
 * @param itemId 元数据节点 ID。
 */
function openMetadataEdit(itemId: string): void {
  const item = workspace.value.items.find((record) => record.id === itemId);
  if (!item) return;
  openMetadataCreate();
  editingId.value = item.id;
  formName.value = item.name;
  formParentId.value = item.parentId;
  formValueType.value = item.valueType;
  if (item.valueType === "input") formInputValue.value = item.value;
  else if (item.valueType === "enum") formEnumValues.value = [...item.value];
  else {
    formRangeMin.value = item.value?.min ?? null;
    formRangeMax.value = item.value?.max ?? null;
  }
}

/** @description 打开添加元数据表单。 */
function openMetadataCreate(): void {
  editingId.value = "";
  formName.value = "";
  formParentId.value = ROOT_METADATA_PARENT_ID;
  formValueType.value = "input";
  formInputValue.value = "";
  formRangeMin.value = null;
  formRangeMax.value = null;
  formEnumValues.value = [];
  formError.value = "";
  formVisible.value = true;
}

/**
 * @description 更新枚举值列表中指定下标的内容。
 * @param index 枚举下标。
 * @param value 新值。
 */
/**
 * @description 将枚举值加入当前表单的本地标签列表。
 * @param value 待加入的枚举值。
 */
function addEnumValue(value: string): void {
  const normalized = value.trim();
  if (!normalized || normalized.includes(",") || formEnumValues.value.includes(normalized)) return;
  formEnumValues.value = [...formEnumValues.value, normalized];
}

/**
 * @description 删除指定下标的枚举值输入行。
 * @param index 枚举下标。
 */
function removeEnumValue(index: number): void {
  formEnumValues.value = formEnumValues.value.filter((_, current) => current !== index);
}

/** @description 校验并保存元数据，成功后重新查询服务端数据。 */
async function confirmMetadataCreate(): Promise<void> {
  if (formSubmitting.value || deleting.value) return;
  const revision = queryRevision;
  const ontologyIdentifier = props.ontologyIdentifier;
  formSubmitting.value = true;
  formError.value = "";
  try {
    const name = formName.value.trim();
    if (!name) throw new Error("请输入元数据名称");
    if (
      editingId.value &&
      !parentLocked.value &&
      (!formParentId.value ||
        collectMetadataDescendantIds(workspace.value.items, editingId.value).has(formParentId.value) ||
        !workspace.value.items.some((item) => item.id === formParentId.value))
    )
      throw new Error("请选择有效的父级节点");
    if (formValueType.value === "range" && (formRangeMin.value === null) !== (formRangeMax.value === null)) throw new Error("请同时填写范围最小值和最大值");
    const rangeValue = formRangeMin.value !== null && formRangeMax.value !== null ? { min: formRangeMin.value, max: formRangeMax.value } : null;
    const payload =
      formValueType.value === "input"
        ? serializeMetadataValue({ valueType: "input", value: formInputValue.value })
        : formValueType.value === "enum"
          ? serializeMetadataValue({ valueType: "enum", value: formEnumValues.value })
          : serializeMetadataValue({ valueType: "range", value: rangeValue });
    const response = editingId.value
      ? await putMetadataSchemaInterface({
          ontologyIdentifier,
          metadataSchemaId: Number(editingId.value),
          name,
          ...(!parentLocked.value ? { parentId: Number(formParentId.value) } : {}),
          ...payload,
        })
      : await postMetadataSchemaInterface({ ontologyIdentifier, parentId: Number(formParentId.value || 0), name, ...payload });
    if (revision !== queryRevision) return;
    if (response.code !== 200) throw new Error(response.message || "保存元数据失败");
    formVisible.value = false;
    ElMessage.success("元数据已保存");
    await handleDialogOpened();
  } catch (cause) {
    if (revision === queryRevision) formError.value = cause instanceof Error ? cause.message : "保存元数据失败";
  } finally {
    formSubmitting.value = false;
  }
}

/**
 * @description 确认删除后调用接口，取消与请求失败分别处理。
 * @param itemId 元数据 ID。
 */
async function handleRemoveMetadata(itemId: string): Promise<void> {
  if (deleting.value || formSubmitting.value) return;
  const row = workspace.value.items.find((item) => item.id === itemId);
  if (!row) return;
  deleting.value = true;
  const revision = queryRevision;
  const ontologyIdentifier = props.ontologyIdentifier;
  try {
    try {
      await ElMessageBox.confirm(`确认删除元数据「${row.name}」及其子节点吗？`, "删除元数据", { type: "warning" });
    } catch {
      return;
    }
    if (revision !== queryRevision) return;
    const response = await deleteMetadataSchemaInterface({ ontologyIdentifier, metadataSchemaId: Number(itemId) });
    if (revision !== queryRevision) return;
    if (response.code !== 200) throw new Error(response.message || "删除元数据失败");
    ElMessage.success("元数据已删除");
    await handleDialogOpened();
  } catch (cause) {
    if (revision === queryRevision) ElMessage.error(cause instanceof Error ? cause.message : "删除元数据失败");
  } finally {
    deleting.value = false;
  }
}
</script>

<style scoped lang="scss">
.metadata-manage-dialog__body {
  display: flex;
  min-height: min(58vh, 620px);
  max-height: min(70vh, 720px);
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
}

.metadata-manage-dialog__pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.metadata-manage-dialog__pane-header h3 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
}

.metadata-manage-dialog__pane-header p {
  margin: 2px 0 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.metadata-manage-dialog__toolbar {
  display: flex;
  gap: 8px;
}

.metadata-manage-dialog__table-wrap {
  min-height: 0;
  flex: 1;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
}

:root:not(.dark) .metadata-manage-dialog__table-wrap {
  background: linear-gradient(135deg, var(--aircas-color-card-background), var(--aircas-color-panel-background-deep));
}
</style>
