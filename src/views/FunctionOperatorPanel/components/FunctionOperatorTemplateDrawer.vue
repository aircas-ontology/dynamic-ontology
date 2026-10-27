<template>
  <el-drawer :model-value="modelValue" title="模板管理" size="520px" destroy-on-close @update:model-value="emit('update:modelValue', $event)">
    <div class="template-drawer__toolbar">
      <el-input v-model="keyword" clearable placeholder="搜索模板名称" /><el-select v-model="languageFilter" clearable placeholder="全部语言"
        ><el-option v-for="item in FUNCTION_OPERATOR_SCRIPT_LANGUAGE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" /></el-select
      ><el-button type="primary" @click="openCreate">新增模板</el-button>
    </div>
    <el-alert v-if="loadError" :title="loadError" type="error" show-icon :closable="false" />
    <el-empty v-if="!loading && filteredTemplates.length === 0" description="暂无模板" />
    <div v-else-if="loading" class="template-drawer__loading">正在加载模板…</div>
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
import { watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  deleteFunctionOperatorTemplateInterface,
  getListFunctionOperatorTemplateInterface,
  postCreateFunctionOperatorTemplateInterface,
  putUpdateFunctionOperatorTemplateInterface,
} from "@/apis";
import type { FunctionOperatorTemplate, FunctionOperatorTemplateLanguage } from "@/types";
import { FUNCTION_OPERATOR_SCRIPT_LANGUAGE_OPTIONS, type FunctionOperatorScriptLanguage } from "@/types";
import { SCRIPT_FUNCTION_STARTERS } from "../utils/scriptFunctionStarters";
import FunctionOperatorTemplateFormDialog, { type FunctionOperatorTemplateDraft } from "./FunctionOperatorTemplateFormDialog.vue";

const props = defineProps<{ modelValue: boolean; currentLanguage: FunctionOperatorScriptLanguage; currentCode: string }>();
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  changed: [];
  use: [value: { language: FunctionOperatorScriptLanguage; code: string }];
}>();
const templates = ref<FunctionOperatorTemplateDraft[]>([]);
const keyword = ref("");
const languageFilter = ref<FunctionOperatorScriptLanguage>();
const formVisible = ref(false);
const activeTemplate = ref<FunctionOperatorTemplateDraft | null>(null);
const formMode = ref<"create" | "edit" | "view">("create");
const saving = ref(false);
const loading = ref(false);
const loadError = ref("");
const apiLanguageByPageLanguage: Record<FunctionOperatorScriptLanguage, FunctionOperatorTemplateLanguage> = {
  typescript: "TYPESCRIPT",
  groovy: "GROOVY",
  python: "PYTHON",
  java: "JAVA",
};
const pageLanguageByApiLanguage: Record<FunctionOperatorTemplateLanguage, FunctionOperatorScriptLanguage> = {
  TYPESCRIPT: "typescript",
  GROOVY: "groovy",
  PYTHON: "python",
  JAVA: "java",
};
const filteredTemplates = computed(() =>
  templates.value.filter(
    (item) => (!keyword.value.trim() || item.name.includes(keyword.value.trim())) && (!languageFilter.value || item.language === languageFilter.value),
  ),
);
function languageLabel(language: FunctionOperatorScriptLanguage): string {
  return FUNCTION_OPERATOR_SCRIPT_LANGUAGE_OPTIONS.find((item) => item.value === language)?.label ?? language;
}

/** @description 将页面语言转换为服务端语言。 */
function toApiLanguage(language: FunctionOperatorScriptLanguage): FunctionOperatorTemplateLanguage {
  return apiLanguageByPageLanguage[language];
}

/** @description 将服务端语言转换为页面语言。 */
function toPageLanguage(language: FunctionOperatorTemplateLanguage): FunctionOperatorScriptLanguage {
  return pageLanguageByApiLanguage[language];
}

/** @description 将服务端模板映射为页面草稿。 */
function mapTemplate(template: FunctionOperatorTemplate): FunctionOperatorTemplateDraft {
  return {
    id: template.id,
    name: template.name,
    language: toPageLanguage(template.language),
    description: template.description ?? "",
    code: template.code,
    updatedAt: template.updateTime,
  };
}

/**
 * @description 查询模板列表并更新抽屉数据。
 * @returns 查询完成后的 Promise。
 */
async function loadTemplates(): Promise<void> {
  loading.value = true;
  loadError.value = "";
  try {
    const response = await getListFunctionOperatorTemplateInterface();
    if (response.code !== 0 && response.code !== 200) throw new Error(response.message || "模板列表加载失败");
    templates.value = (response.data ?? []).map(mapTemplate);
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : "模板列表加载失败";
    ElMessage.error(loadError.value);
  } finally {
    loading.value = false;
  }
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
async function saveTemplate(value: FunctionOperatorTemplateDraft): Promise<void> {
  saving.value = true;
  try {
    const data = {
      name: value.name.trim(),
      language: toApiLanguage(value.language),
      description: value.description.trim(),
      code: value.code,
    };
    const response = value.id
      ? await putUpdateFunctionOperatorTemplateInterface({ id: value.id, data })
      : await postCreateFunctionOperatorTemplateInterface(data);
    if (response.code !== 0 && response.code !== 200) throw new Error(response.message || "模板保存失败");
    await loadTemplates();
    formVisible.value = false;
    emit("changed");
    ElMessage.success(value.id ? "模板已更新" : "模板已创建");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "模板保存失败");
  } finally {
    saving.value = false;
  }
}
/** @description 删除指定模板并反馈结果。 */
async function deleteTemplate(item: FunctionOperatorTemplateDraft): Promise<void> {
  try {
    await ElMessageBox.confirm(`确定删除模板“${item.name}”吗？`, "删除模板", { type: "warning" });
    if (!item.id) return;
    const response = await deleteFunctionOperatorTemplateInterface({ id: item.id });
    if (response.code !== 0 && response.code !== 200) throw new Error(response.message || "模板删除失败");
    await loadTemplates();
    emit("changed");
    ElMessage.success("模板已删除");
  } catch (error) {
    if (error === "cancel" || error === "close") return;
    ElMessage.error(error instanceof Error ? error.message : "模板删除失败");
  }
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) void loadTemplates();
  },
);
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
.template-drawer__loading {
  padding: 32px 0;
  color: var(--aircas-color-text-secondary);
  text-align: center;
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
