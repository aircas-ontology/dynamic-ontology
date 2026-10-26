<template>
  <el-drawer :model-value="modelValue" title="模板管理" size="520px" destroy-on-close @update:model-value="emit('update:modelValue', $event)">
    <div class="template-drawer__toolbar">
      <el-input v-model="keyword" clearable placeholder="搜索模板名称" /><el-select v-model="languageFilter" clearable placeholder="全部语言"
        ><el-option v-for="item in FUNCTION_OPERATOR_SCRIPT_LANGUAGE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" /></el-select
      ><el-button type="primary" @click="openCreate">新增模板</el-button>
    </div>
    <el-empty v-if="filteredTemplates.length === 0" description="暂无模板" />
    <div v-else class="template-drawer__list">
      <div
        v-for="item in filteredTemplates"
        :key="item.id"
        class="template-drawer__item"
        role="button"
        tabindex="0"
        @click="openView(item)"
        @keydown.enter="openView(item)"
      >
        <div class="template-drawer__item-main">
          <div class="template-drawer__item-title">
            <strong>{{ item.name }}</strong
            ><el-tag size="small">{{ languageLabel(item.language) }}</el-tag>
          </div>
          <div class="template-drawer__item-description-row">
            <span>{{ item.description || "暂无说明" }}</span>
            <div class="template-drawer__item-actions" @click.stop>
              <el-button text type="primary" @click="openEdit(item)">编辑</el-button>
              <el-button text type="danger" @click="void deleteTemplate(item)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <FunctionOperatorTemplateFormDialog
      v-model="formVisible"
      :template="activeTemplate"
      :read-only="formMode === 'view'"
      :editing="formMode === 'edit'"
      :saving="saving"
      @save="saveTemplate"
    />
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { FUNCTION_OPERATOR_SCRIPT_LANGUAGE_OPTIONS, type FunctionOperatorScriptLanguage } from "@/types";
import { SCRIPT_FUNCTION_STARTERS } from "../utils/scriptFunctionStarters";
import FunctionOperatorTemplateFormDialog, { type FunctionOperatorTemplateDraft } from "./FunctionOperatorTemplateFormDialog.vue";

const props = defineProps<{ modelValue: boolean; currentLanguage: FunctionOperatorScriptLanguage; currentCode: string }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean]; use: [value: { language: FunctionOperatorScriptLanguage; code: string }] }>();
const templates = ref<FunctionOperatorTemplateDraft[]>([
  {
    id: 1,
    name: "TypeScript 基础函数",
    language: "typescript",
    description: "默认 TypeScript 函数模板",
    code: SCRIPT_FUNCTION_STARTERS.typescript,
    updatedAt: "",
  },
]);
const keyword = ref("");
const languageFilter = ref<FunctionOperatorScriptLanguage>();
const formVisible = ref(false);
const activeTemplate = ref<FunctionOperatorTemplateDraft | null>(null);
const formMode = ref<"create" | "edit" | "view">("create");
const saving = ref(false);
const filteredTemplates = computed(() =>
  templates.value.filter(
    (item) => (!keyword.value.trim() || item.name.includes(keyword.value.trim())) && (!languageFilter.value || item.language === languageFilter.value),
  ),
);
function languageLabel(language: FunctionOperatorScriptLanguage): string {
  return FUNCTION_OPERATOR_SCRIPT_LANGUAGE_OPTIONS.find((item) => item.value === language)?.label ?? language;
}
/** @description 打开新增模板表单。 */
function openCreate(): void {
  activeTemplate.value = {
    name: "",
    language: props.currentLanguage,
    description: "",
    code: props.currentCode || SCRIPT_FUNCTION_STARTERS[props.currentLanguage],
  };
  formMode.value = "create";
  formVisible.value = true;
}
/** @description 打开模板查看弹窗。 */
function openView(item: FunctionOperatorTemplateDraft): void {
  activeTemplate.value = { ...item };
  formMode.value = "view";
  formVisible.value = true;
}
/** @description 打开模板编辑弹窗。 */
function openEdit(item: FunctionOperatorTemplateDraft): void {
  activeTemplate.value = { ...item };
  formMode.value = "edit";
  formVisible.value = true;
}
/** @description 保存新增或编辑后的模板。 */
function saveTemplate(value: FunctionOperatorTemplateDraft): void {
  saving.value = true;
  const next = { ...value, id: value.id ?? Date.now(), updatedAt: new Date().toISOString() };
  templates.value = value.id ? templates.value.map((item) => (item.id === value.id ? next : item)) : [next, ...templates.value];
  saving.value = false;
  formVisible.value = false;
  ElMessage.success("模板已保存");
}
/** @description 删除指定模板并反馈结果。 */
async function deleteTemplate(item: FunctionOperatorTemplateDraft): Promise<void> {
  try {
    await ElMessageBox.confirm(`确定删除模板“${item.name}”吗？`, "删除模板", { type: "warning" });
    templates.value = templates.value.filter((template) => template.id !== item.id);
    ElMessage.success("模板已删除");
  } catch {
    /* 用户取消 */
  }
}
</script>

<style scoped lang="scss">
.template-drawer__toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px auto;
  gap: 8px;
  margin-bottom: 16px;
}
.template-drawer__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.template-drawer__item {
  display: flex;
  min-height: 96px;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background);
  cursor: pointer;
}
.template-drawer__item:hover,
.template-drawer__item:focus-visible {
  border-color: var(--aircas-color-primary);
  outline: none;
}
.template-drawer__item-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.template-drawer__item-main {
  display: flex;
  width: 100%;
  min-width: 0;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.template-drawer__item-main strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.template-drawer__item-actions {
  display: flex;
  align-self: flex-end;
  gap: 4px;
}
.template-drawer__item-main {
  align-items: center;
}
.template-drawer__item-description-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}
.template-drawer__item-main span {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
