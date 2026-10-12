<template>
  <el-dialog
    :model-value="modelValue"
    class="aircas-dialog custom-rule-variable-dialog"
    title="自定义变量管理"
    width="880px"
    append-to-body
    destroy-on-close
    :z-index="5100"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="custom-rule-variable-dialog__toolbar">
      <el-input v-model="keyword" class="aircas-input custom-rule-variable-dialog__search" clearable placeholder="搜索变量或键" />
      <el-button class="aircas-button aircas-button--tone-primary" @click="openObjectEditor()">+ 添加变量</el-button>
    </div>
    <div class="custom-rule-variable-dialog__body">
      <section class="custom-rule-variable-dialog__panel" aria-label="自定义变量">
        <div class="custom-rule-variable-dialog__section-title">自定义变量</div>
        <el-table
          ref="objectTableRef"
          class="aircas-table custom-rule-variable-dialog__table"
          height="100%"
          row-key="id"
          highlight-current-row
          :data="filteredObjects"
          empty-text="暂无自定义变量"
          @current-change="handleCurrentObjectChange"
        >
          <el-table-column label="名称" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ asCatalogObject(row).name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <div class="custom-rule-variable-dialog__actions">
                <el-button class="aircas-button aircas-button--tone-secondary" size="small" @click.stop="openObjectEditor(asCatalogObject(row))"
                  >编辑</el-button
                >
                <el-button class="aircas-button aircas-button--tone-danger" type="danger" size="small" @click.stop="confirmDeleteObject(asCatalogObject(row))"
                  >删除</el-button
                >
              </div>
            </template>
          </el-table-column>
        </el-table>
      </section>
      <section class="custom-rule-variable-dialog__panel custom-rule-variable-dialog__panel--keys" aria-label="键">
        <div class="custom-rule-variable-dialog__property-header">
          <span class="custom-rule-variable-dialog__section-title">键{{ currentObject ? `（${currentObject.name}）` : "" }}</span>
          <el-button v-if="currentObject" class="aircas-button aircas-button--tone-secondary" @click="openPropertyEditor()">+ 添加键</el-button>
        </div>
        <el-table
          v-if="currentObject"
          class="aircas-table custom-rule-variable-dialog__table"
          height="100%"
          row-key="id"
          :data="filteredProperties"
          empty-text="暂无键"
        >
          <el-table-column label="键名称" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ asProperty(row).name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="值类型" width="100" align="center">
            <template #default="{ row }">
              <span class="custom-rule-variable-dialog__value-type" :class="`value-type-${asProperty(row).valueType}`">{{
                valueTypeLabel(asProperty(row).valueType)
              }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <div class="custom-rule-variable-dialog__actions">
                <el-button class="aircas-button aircas-button--tone-secondary" size="small" @click.stop="openPropertyEditor(asProperty(row))">编辑</el-button>
                <el-button class="aircas-button aircas-button--tone-danger" type="danger" size="small" @click.stop="confirmDeleteProperty(asProperty(row))"
                  >删除</el-button
                >
              </div>
            </template>
          </el-table-column>
        </el-table>
        <div v-else class="custom-rule-variable-dialog__empty">请先在左侧选择一个自定义变量</div>
      </section>
    </div>
    <template #footer>
      <el-button class="aircas-button aircas-button--tone-ghost" @click="emit('update:modelValue', false)">关闭</el-button>
    </template>
  </el-dialog>

  <CustomRuleVariableEditors
    v-model:object-open="objectEditorOpen"
    v-model:property-open="propertyEditorOpen"
    v-model:object-name="objectFormName"
    v-model:property-name="propertyFormName"
    v-model:property-value-type="propertyFormValueType"
    v-model:property-children="propertyFormChildren"
    :object-title="editingObject ? '编辑自定义变量' : '添加自定义变量'"
    :property-title="editingProperty ? '编辑键' : '添加键'"
    :submitting="submitting"
    @save-object="saveObject"
    @save-property="saveProperty"
  />
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { ElMessage, ElMessageBox, type TableInstance } from "element-plus";
import {
  RULE_VARIABLE_PROPERTY_VALUE_TYPE_OPTIONS,
  type RuleVariableCatalogObject,
  type RuleVariablePropertyOption,
  type RuleVariablePropertyValueType,
} from "@/types";
import {
  createCustomRuleVariableObject,
  createCustomRuleVariableProperty,
  deleteCustomRuleVariableObject,
  deleteCustomRuleVariableProperty,
  listCustomRuleVariableCatalog,
  updateCustomRuleVariableObject,
  updateCustomRuleVariableProperty,
} from "./utils/scheduleRuleVariableCatalog";
import CustomRuleVariableEditors from "./ruleConfig/CustomRuleVariableEditors.vue";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  saved: [];
}>();

const keyword = ref("");
const catalog = ref<RuleVariableCatalogObject[]>([]);
const currentObjectId = ref<string | null>(null);
const objectTableRef = ref<TableInstance>();
const objectEditorOpen = ref(false);
const propertyEditorOpen = ref(false);
const submitting = ref(false);
const editingObject = ref<RuleVariableCatalogObject | null>(null);
const editingProperty = ref<RuleVariablePropertyOption | null>(null);
const objectFormName = ref("");
const propertyFormName = ref("");
const propertyFormValueType = ref<RuleVariablePropertyValueType>("string");
const propertyFormChildren = ref<RuleVariablePropertyOption[]>([]);

const filteredObjects = computed(() => {
  const normalized = keyword.value.trim().toLowerCase();
  if (!normalized) return catalog.value;
  return catalog.value.filter((item) => {
    if (item.name.toLowerCase().includes(normalized)) return true;
    return item.properties.some((property) => property.name.toLowerCase().includes(normalized));
  });
});
const currentObject = computed(() => filteredObjects.value.find((item) => item.id === currentObjectId.value) ?? null);
const filteredProperties = computed(() => {
  if (!currentObject.value) return [];
  const normalized = keyword.value.trim().toLowerCase();
  if (!normalized) return currentObject.value.properties;
  return currentObject.value.properties.filter((item) => item.name.toLowerCase().includes(normalized));
});

/**
 * @description 判断未知值是否为自定义变量对象。
 * @param row 表格行。
 * @returns 是否为变量对象。
 */
function isCatalogObject(row: unknown): row is RuleVariableCatalogObject {
  return (
    typeof row === "object" &&
    row !== null &&
    "id" in row &&
    "name" in row &&
    "properties" in row &&
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    Array.isArray(row.properties)
  );
}

/**
 * @description 判断未知值是否为变量键。
 * @param row 表格行。
 * @returns 是否为键。
 */
function isProperty(row: unknown): row is RuleVariablePropertyOption {
  return (
    typeof row === "object" && row !== null && "id" in row && "name" in row && "valueType" in row && typeof row.id === "string" && typeof row.name === "string"
  );
}

/**
 * @description 把表格行转为变量对象。
 * @param row 表格行。
 * @returns 变量对象。
 */
function asCatalogObject(row: unknown): RuleVariableCatalogObject {
  if (!isCatalogObject(row)) throw new Error("表格行不是自定义变量");
  return row;
}

/**
 * @description 把表格行转为键。
 * @param row 表格行。
 * @returns 键。
 */
function asProperty(row: unknown): RuleVariablePropertyOption {
  if (!isProperty(row)) throw new Error("表格行不是变量键");
  return row;
}

/**
 * @description 值类型中文标签。
 * @param valueType 值类型。
 * @returns 标签。
 */
function valueTypeLabel(valueType: RuleVariablePropertyValueType): string {
  return RULE_VARIABLE_PROPERTY_VALUE_TYPE_OPTIONS.find((item) => item.value === valueType)?.label ?? "字符串";
}

/**
 * @description 刷新目录并尽量保持当前选中变量。
 */
function refreshCatalog() {
  catalog.value = listCustomRuleVariableCatalog();
  if (!filteredObjects.value.some((item) => item.id === currentObjectId.value)) {
    currentObjectId.value = filteredObjects.value[0]?.id ?? null;
  }
  emit("saved");
  void nextTick(() => {
    const current = currentObject.value;
    if (current) objectTableRef.value?.setCurrentRow(current);
  });
}

/**
 * @description 切换左侧当前变量。
 * @param row 选中行。
 */
function handleCurrentObjectChange(row: RuleVariableCatalogObject | null) {
  currentObjectId.value = row?.id ?? null;
}

/**
 * @description 打开添加或编辑变量弹窗。
 * @param row 要编辑的变量；缺省为新增。
 */
function openObjectEditor(row?: RuleVariableCatalogObject) {
  editingObject.value = row ?? null;
  objectFormName.value = row?.name ?? "";
  objectEditorOpen.value = true;
}

/**
 * @description 打开添加或编辑键弹窗。
 * @param row 要编辑的键；缺省为新增。
 */
function openPropertyEditor(row?: RuleVariablePropertyOption) {
  if (!currentObject.value) return;
  editingProperty.value = row ?? null;
  propertyFormName.value = row?.name ?? "";
  propertyFormValueType.value = row?.valueType ?? "string";
  propertyFormChildren.value = row?.children ? structuredClone(row.children) : [];
  propertyEditorOpen.value = true;
}

/**
 * @description 保存变量名称。
 */
function saveObject() {
  const name = objectFormName.value.trim();
  if (!name) {
    ElMessage.warning("请输入名称");
    return;
  }
  submitting.value = true;
  try {
    if (editingObject.value) {
      updateCustomRuleVariableObject(editingObject.value.id, name);
    } else {
      const created = createCustomRuleVariableObject(name);
      currentObjectId.value = created.id;
    }
    objectEditorOpen.value = false;
    refreshCatalog();
  } finally {
    submitting.value = false;
  }
}

/**
 * @description 保存键名称、值类型和子键。
 */
function saveProperty() {
  if (!currentObject.value) return;
  const name = propertyFormName.value.trim();
  if (!name) {
    ElMessage.warning("请输入键名称");
    return;
  }
  const children = propertyFormValueType.value === "object" ? propertyFormChildren.value : [];
  if (children.some((item) => !item.name.trim())) {
    ElMessage.warning("请完整填写所有子键的名称");
    return;
  }
  submitting.value = true;
  try {
    if (editingProperty.value) {
      updateCustomRuleVariableProperty(currentObject.value.id, editingProperty.value.id, name, propertyFormValueType.value, children);
    } else {
      createCustomRuleVariableProperty(currentObject.value.id, name, propertyFormValueType.value, children);
    }
    propertyEditorOpen.value = false;
    refreshCatalog();
  } finally {
    submitting.value = false;
  }
}

/**
 * @description 确认后删除自定义变量。
 * @param row 要删除的变量。
 */
async function confirmDeleteObject(row: RuleVariableCatalogObject) {
  try {
    await ElMessageBox.confirm(`确认删除「${row.name}」？该变量下的键也会一并删除。`, "删除确认", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  deleteCustomRuleVariableObject(row.id);
  refreshCatalog();
}

/**
 * @description 确认后删除键。
 * @param row 要删除的键。
 */
async function confirmDeleteProperty(row: RuleVariablePropertyOption) {
  if (!currentObject.value) return;
  try {
    await ElMessageBox.confirm(`确认删除键「${row.name}」？`, "删除确认", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  deleteCustomRuleVariableProperty(currentObject.value.id, row.id);
  refreshCatalog();
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    keyword.value = "";
    refreshCatalog();
  },
);
</script>

<style scoped lang="scss">
.custom-rule-variable-dialog__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.custom-rule-variable-dialog__search {
  flex: 1;
  max-width: 320px;
}

.custom-rule-variable-dialog__body {
  display: flex;
  gap: 16px;
  height: 480px;
}

.custom-rule-variable-dialog__panel {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.custom-rule-variable-dialog__panel--keys {
  padding-left: 16px;
  border-left: 1px solid var(--aircas-color-border-soft);
}

.custom-rule-variable-dialog__section-title {
  margin-bottom: 8px;
  color: var(--aircas-color-text-secondary);
  font-size: 14px;
}

.custom-rule-variable-dialog__property-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.custom-rule-variable-dialog__table {
  flex: 1;
}

.custom-rule-variable-dialog__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.custom-rule-variable-dialog__empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  color: var(--aircas-color-text-muted);
  font-size: 13px;
}

.custom-rule-variable-dialog__value-type {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1;
}

.value-type-string {
  color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-accent-cyan-fill);
}

.value-type-number {
  color: var(--aircas-color-accent-green);
  background: var(--aircas-color-accent-green-fill);
}

.value-type-boolean {
  color: var(--aircas-color-accent-orange);
  background: var(--aircas-color-accent-orange-fill);
}

.value-type-object {
  color: var(--aircas-color-accent-purple);
  background: var(--aircas-color-accent-purple-fill);
}
</style>
