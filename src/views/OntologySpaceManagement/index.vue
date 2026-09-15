<template>
  <div class="ontology-space-management">
    <section class="ontology-space-management__overview">
      <WelcomePanel @create="openForm()" />
      <div class="ontology-space-management__stats"><StatCard v-for="stat in summaryStats" :key="stat.id" :stat="stat" /></div>
    </section>
    <p class="ontology-space-management__notice">当前使用演示数据，刷新页面后恢复初始内容。</p>
    <SectionToolbar v-model:keyword="keyword" v-model:order="order" v-model:view-mode="viewMode" />
    <div v-if="status === 'loading'" class="ontology-space-management__state" role="status">正在加载本体空间…</div>
    <div v-else-if="status === 'error'" class="ontology-space-management__state" role="alert"><span>{{ error }}</span><el-button class="aircas-button" type="primary" @click="load">重试</el-button></div>
    <SpaceTable v-else :spaces="result.items" :total="result.total" :page="result.page" v-model:page-size="pageSize" :view-mode="viewMode" @update:page="page = $event" @action="handleAction" />
    <SpaceFormDialog v-model="formVisible" :space="activeSpace" :external-error="actionError" @save="handleSave" />
    <el-dialog v-model="deleteVisible" class="aircas-dialog" title="删除本体空间" width="min(460px, 94vw)" :close-on-click-modal="false">
      <p>确定删除「{{ activeSpace?.displayName }}」？本次演示中的更改将在刷新后重置。</p>
      <p v-if="actionError" class="ontology-space-management__error" role="alert">{{ actionError }}</p>
      <template #footer><el-button class="aircas-button" @click="deleteVisible = false">取消</el-button><el-button class="aircas-button" type="danger" :loading="actionBusy" @click="confirmDelete">删除</el-button></template>
    </el-dialog>
    <el-dialog v-model="exportVisible" class="aircas-dialog" title="导出本体空间" width="min(460px, 94vw)">
      <p>导出「{{ activeSpace?.displayName }}」的空间基本信息，文件可用于导入创建。</p>
      <p class="ontology-space-management__notice">对象结构与实体数据尚未接入，本次不包含这些内容。</p>
      <p v-if="actionError" class="ontology-space-management__error" role="alert">{{ actionError }}</p>
      <template #footer><el-button class="aircas-button" @click="exportVisible = false">取消</el-button><el-button class="aircas-button" type="primary" :loading="actionBusy" @click="confirmExport">导出 JSON</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import type { OntologySpaceDraft, OntologySpaceItem } from "@/types";
import WelcomePanel from "./components/WelcomePanel.vue";
import StatCard from "./components/StatCard.vue";
import SectionToolbar from "./components/SectionToolbar.vue";
import SpaceTable from "./components/SpaceTable.vue";
import SpaceFormDialog from "./components/SpaceFormDialog.vue";
import { useSpaceManagement } from "./composables/useSpaceManagement";
import { serializeSpace } from "./utils/spaceOperations";
import { downloadSpaceJson } from "./utils/downloadSpaceJson";
const { keyword, order, viewMode, page, pageSize, status, error, result, summaryStats, load, save, remove } = useSpaceManagement();
const activeSpace = ref<OntologySpaceItem | null>(null);
const formVisible = ref(false);
const deleteVisible = ref(false);
const exportVisible = ref(false);
const actionBusy = ref(false);
const actionError = ref("");
onMounted(load);
function openForm(space: OntologySpaceItem | null = null) {
  activeSpace.value = space;
  actionError.value = "";
  formVisible.value = true;
}
function handleAction(action: string, space: OntologySpaceItem) {
  activeSpace.value = space;
  actionError.value = "";
  if (action === "edit") openForm(space);
  else if (action === "delete") deleteVisible.value = true;
  else if (action === "export") exportVisible.value = true;
  else ElMessage.info(action === "subspace" ? "子空间创建页面尚未接入。" : "空间详情页面尚未接入。");
}
function handleSave(draft: OntologySpaceDraft) {
  if (actionBusy.value) return;
  actionBusy.value = true;
  try {
    save(draft, activeSpace.value?.id);
    formVisible.value = false;
    keyword.value = "";
    ElMessage.success(activeSpace.value ? "空间已更新" : "空间已创建");
  } catch (cause) { actionError.value = cause instanceof Error ? cause.message : "保存失败，请重试。"; }
  finally { actionBusy.value = false; }
}
function confirmDelete() {
  if (!activeSpace.value || actionBusy.value) return;
  actionBusy.value = true;
  try {
    remove(activeSpace.value.id);
    deleteVisible.value = false;
    ElMessage.success("空间已删除");
  } catch (cause) { actionError.value = cause instanceof Error ? cause.message : "删除失败，请重试。"; }
  finally { actionBusy.value = false; }
}
function confirmExport() {
  if (!activeSpace.value || actionBusy.value) return;
  actionBusy.value = true;
  try {
    downloadSpaceJson(activeSpace.value.apiName + ".json", serializeSpace(activeSpace.value));
    exportVisible.value = false;
    ElMessage.success("导出文件已生成");
  } catch { actionError.value = "导出失败，请重试。"; }
  finally { actionBusy.value = false; }
}
</script>
<style scoped lang="scss">
.ontology-space-management {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 100%;
  padding: 12px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-page-background);
}
.ontology-space-management__overview { display: grid; grid-template-columns: minmax(320px, 1.3fr) minmax(560px, 2fr); gap: 12px; }
.ontology-space-management__stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.ontology-space-management__notice { margin-top: 12px; font-size: 12px; color: var(--aircas-color-text-muted); }
.ontology-space-management__state { display: flex; justify-content: center; align-items: center; min-height: 300px; gap: 12px; }
.ontology-space-management__error { color: var(--aircas-color-danger); margin-top: 12px; }
@media (max-width: 1200px) { .ontology-space-management__overview { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 700px) { .ontology-space-management__stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
