<template>
  <div class="space-behavior-workspace">
    <BehaviorCategoryPanel
      :tree-data="categoryTree"
      :selected-node-id="selectedCategoryId"
      @select-node="selectBehaviorCategory"
      @create="openCategoryCreate"
      @edit="openCategoryEdit"
      @delete="openCategoryDelete"
    />

    <section class="space-behavior-workspace__main">
      <div v-if="status === 'loading'" class="space-behavior-workspace__state" role="status"><AircasLoading>正在加载行为…</AircasLoading></div>
      <div v-else-if="status === 'error'" class="space-behavior-workspace__state space-behavior-workspace__state--error" role="alert">
        <span>{{ errorMessage || "行为工作区加载失败" }}</span>
        <el-button @click="loadSpaceBehaviorWorkspace">重试</el-button>
      </div>
      <BehaviorListPanel
        v-else
        :category-label="selectedCategoryLabel"
        :items="pagedBehaviors"
        :total="total"
        :page="page"
        :page-size="pageSize"
        :keyword="keyword"
        :status-filter="statusFilter"
        @update:keyword="keyword = $event"
        @update:status-filter="statusFilter = $event"
        @query="applyBehaviorFilters"
        @reset="resetBehaviorFilters"
        @create="openBehaviorCreate"
        @view="openBehaviorView"
        @edit="openBehaviorEdit"
        @status="openBehaviorStatus"
        @delete="openBehaviorDelete"
        @page-change="changeBehaviorPage"
        @page-size-change="changeBehaviorPageSize"
      />
    </section>

    <BehaviorCategoryFormDialog
      ref="categoryFormRef"
      v-model="categoryFormVisible"
      :mode="categoryFormMode"
      :parent-label="categoryParentLabel"
      :initial-name="categoryFormMode === 'edit' ? categoryActionName : ''"
      @submit="handleCategorySubmit"
    />
    <BehaviorCategoryDeleteDialog
      v-model="categoryDeleteVisible"
      :category-name="categoryActionName"
      :blocked="categoryDeleteBlocked"
      :loading="actionLoading"
      @confirm="handleCategoryDelete"
    />
    <BehaviorFormDialog
      ref="behaviorFormRef"
      v-model="behaviorFormVisible"
      :mode="behaviorFormMode"
      :category-options="categoryOptions"
      :default-category-id="selectedCategoryId || ROOT_SPACE_BEHAVIOR_CATEGORY_ID"
      :behavior="activeBehavior"
      @submit="handleBehaviorSubmit"
      @save-copy="handleBehaviorSaveCopy"
    />
    <BehaviorDetailDrawer v-model="behaviorDetailVisible" :behavior="activeBehavior" />
    <BehaviorStatusDialog v-model="behaviorStatusVisible" :behavior="activeBehavior" :loading="actionLoading" @confirm="handleBehaviorStatusSubmit" />
    <BehaviorDeleteDialog v-model="behaviorDeleteVisible" :preflight="behaviorDeletePreflight" :loading="actionLoading" @confirm="handleBehaviorDelete" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";
import type { SpaceBehaviorDraft, SpaceBehaviorItem, SpaceBehaviorStatusChangeDraft } from "@/types";
import { ROOT_SPACE_BEHAVIOR_CATEGORY_ID } from "@/types";
import AircasLoading from "@/components/AircasLoading.vue";
import { useSpaceBehaviorWorkspace } from "./composables/useSpaceBehaviorWorkspace";
import { createSpaceBehaviorDeletePreflight, findSpaceBehaviorCategoryNode, flattenSpaceBehaviorCategoryOptions } from "./utils/spaceBehaviorOperations";
import BehaviorCategoryPanel from "./components/BehaviorCategoryPanel.vue";
import BehaviorListPanel from "./components/BehaviorListPanel.vue";
import BehaviorCategoryFormDialog from "./components/BehaviorCategoryFormDialog.vue";
import BehaviorCategoryDeleteDialog from "./components/BehaviorCategoryDeleteDialog.vue";
import BehaviorFormDialog from "./components/BehaviorFormDialog.vue";
import BehaviorDetailDrawer from "./components/BehaviorDetailDrawer.vue";
import BehaviorStatusDialog from "./components/BehaviorStatusDialog.vue";
import BehaviorDeleteDialog from "./components/BehaviorDeleteDialog.vue";

const {
  status,
  errorMessage,
  categoryTree,
  selectedCategoryId,
  selectedCategoryLabel,
  keyword,
  statusFilter,
  page,
  pageSize,
  total,
  pagedBehaviors,
  actionLoading,
  loadSpaceBehaviorWorkspace,
  selectBehaviorCategory,
  applyBehaviorFilters,
  resetBehaviorFilters,
  changeBehaviorPage,
  changeBehaviorPageSize,
  createBehaviorCategory,
  renameBehaviorCategory,
  deleteBehaviorCategory,
  createBehavior,
  updateBehavior,
  changeBehaviorStatus,
  deleteBehavior,
} = useSpaceBehaviorWorkspace();

const categoryFormRef = ref<{ setLoading: (value: boolean) => void } | null>(null);
const behaviorFormRef = ref<{ setLoading: (value: boolean) => void } | null>(null);
const categoryFormVisible = ref(false);
const categoryFormMode = ref<"create" | "edit">("create");
const categoryParentId = ref(ROOT_SPACE_BEHAVIOR_CATEGORY_ID);
const categoryActionId = ref("");
const categoryActionName = ref("");
const categoryDeleteVisible = ref(false);
const categoryDeleteBlocked = ref(false);
const behaviorFormVisible = ref(false);
const behaviorFormMode = ref<"create" | "edit">("create");
const behaviorDetailVisible = ref(false);
const behaviorStatusVisible = ref(false);
const behaviorDeleteVisible = ref(false);
const activeBehavior = ref<SpaceBehaviorItem | null>(null);

const categoryOptions = computed(() => flattenSpaceBehaviorCategoryOptions(categoryTree.value));
const categoryParentLabel = computed(() => findSpaceBehaviorCategoryNode(categoryTree.value, categoryParentId.value)?.label ?? "行为分类");
const behaviorDeletePreflight = computed(() => (activeBehavior.value ? createSpaceBehaviorDeletePreflight(activeBehavior.value.displayName) : null));

/**
 * @description 打开新建子分类弹窗。
 * @param parentId 父分类 id。
 */
function openCategoryCreate(parentId: string): void {
  categoryFormMode.value = "create";
  categoryParentId.value = parentId || ROOT_SPACE_BEHAVIOR_CATEGORY_ID;
  categoryActionName.value = "";
  categoryFormVisible.value = true;
}

/**
 * @description 打开编辑分类弹窗。
 * @param categoryId 分类 id。
 */
function openCategoryEdit(categoryId: string): void {
  const node = findSpaceBehaviorCategoryNode(categoryTree.value, categoryId);
  if (!node) return;
  categoryFormMode.value = "edit";
  categoryActionId.value = categoryId;
  categoryActionName.value = node.label;
  categoryFormVisible.value = true;
}

/**
 * @description 打开删除分类确认弹窗；含子分类或行为时禁止确认。
 * @param categoryId 分类 id。
 */
function openCategoryDelete(categoryId: string): void {
  const node = findSpaceBehaviorCategoryNode(categoryTree.value, categoryId);
  if (!node) return;
  categoryActionId.value = categoryId;
  categoryActionName.value = node.label;
  categoryDeleteBlocked.value = node.children.length > 0 || node.count > 0;
  categoryDeleteVisible.value = true;
}

/**
 * @description 提交分类新建或重命名。
 * @param name 分类名称。
 */
function handleCategorySubmit(name: string): void {
  const ok = categoryFormMode.value === "create" ? createBehaviorCategory(categoryParentId.value, name) : renameBehaviorCategory(categoryActionId.value, name);
  categoryFormRef.value?.setLoading(false);
  if (!ok) {
    ElMessage.error("分类保存失败");
    return;
  }
  categoryFormVisible.value = false;
  ElMessage.success(categoryFormMode.value === "create" ? "分类已创建" : "分类已更新");
}

/**
 * @description 确认删除空分类。
 */
function handleCategoryDelete(): void {
  const result = deleteBehaviorCategory(categoryActionId.value);
  if (!result.ok) {
    categoryDeleteBlocked.value = result.reason === "has-children" || result.reason === "has-behaviors";
    ElMessage.error(result.reason === "root" ? "根分类不可删除" : "分类删除失败");
    return;
  }
  categoryDeleteVisible.value = false;
  ElMessage.success("分类已删除");
}

/**
 * @description 打开新建行为弹窗。
 */
function openBehaviorCreate(): void {
  behaviorFormMode.value = "create";
  activeBehavior.value = null;
  behaviorFormVisible.value = true;
}

/**
 * @description 打开查看行为抽屉。
 * @param item 行为记录。
 */
function openBehaviorView(item: SpaceBehaviorItem): void {
  activeBehavior.value = item;
  behaviorDetailVisible.value = true;
}

/**
 * @description 打开编辑行为弹窗。
 * @param item 行为记录。
 */
function openBehaviorEdit(item: SpaceBehaviorItem): void {
  behaviorFormMode.value = "edit";
  activeBehavior.value = item;
  behaviorFormVisible.value = true;
}

/**
 * @description 打开行为状态管理弹窗。
 * @param item 行为记录。
 */
function openBehaviorStatus(item: SpaceBehaviorItem): void {
  activeBehavior.value = item;
  behaviorStatusVisible.value = true;
}

/**
 * @description 打开删除行为确认弹窗。
 * @param item 行为记录。
 */
function openBehaviorDelete(item: SpaceBehaviorItem): void {
  activeBehavior.value = item;
  behaviorDeleteVisible.value = true;
}

/**
 * @description 提交行为新建或就地编辑。
 * @param draft 行为草稿。
 */
function handleBehaviorSubmit(draft: SpaceBehaviorDraft): void {
  if (behaviorFormMode.value === "create") {
    createBehavior({ ...draft, status: "draft" });
    behaviorFormRef.value?.setLoading(false);
    behaviorFormVisible.value = false;
    ElMessage.success("行为已创建");
    return;
  }
  if (!activeBehavior.value || activeBehavior.value.status === "published" || activeBehavior.value.status === "disabled") {
    behaviorFormRef.value?.setLoading(false);
    return;
  }
  const ok = updateBehavior(activeBehavior.value.id, draft);
  behaviorFormRef.value?.setLoading(false);
  if (!ok) {
    ElMessage.error("行为保存失败");
    return;
  }
  behaviorFormVisible.value = false;
  ElMessage.success("行为已更新");
}

/**
 * @description 将已发布行为另存为独立草稿副本，不修改原行为。
 * @param draft 行为草稿。
 */
function handleBehaviorSaveCopy(draft: SpaceBehaviorDraft): void {
  createBehavior({ ...draft, status: "draft" });
  behaviorFormRef.value?.setLoading(false);
  behaviorFormVisible.value = false;
  ElMessage.success("已另存为草稿副本");
}

/**
 * @description 确认行为状态变更。
 * @param draft 状态变更草稿。
 */
function handleBehaviorStatusSubmit(draft: SpaceBehaviorStatusChangeDraft): void {
  if (!activeBehavior.value) return;
  const ok = changeBehaviorStatus(activeBehavior.value.id, draft);
  if (!ok) {
    ElMessage.error("状态变更失败");
    return;
  }
  behaviorStatusVisible.value = false;
  ElMessage.success("状态已更新");
}

/**
 * @description 确认删除行为。
 */
function handleBehaviorDelete(): void {
  if (!activeBehavior.value) return;
  const ok = deleteBehavior(activeBehavior.value.id);
  if (!ok) {
    ElMessage.error("行为删除失败");
    return;
  }
  behaviorDeleteVisible.value = false;
  ElMessage.success("行为已删除");
}
</script>

<style scoped lang="scss">
.space-behavior-workspace {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 8px;
  min-width: 0;
  min-height: 0;
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.space-behavior-workspace__main {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
}
.space-behavior-workspace__state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 160px;
  color: var(--aircas-color-text-secondary);
  font-size: 14px;
}
.space-behavior-workspace__state--error {
  color: var(--aircas-color-warning);
}
</style>
