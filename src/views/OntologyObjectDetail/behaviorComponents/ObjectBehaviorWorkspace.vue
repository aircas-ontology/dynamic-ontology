<template>
  <div class="object-behavior-workspace">
    <ObjectBehaviorCategoryPanel
      :tree-data="categoryTree"
      :selected-node-id="selectedCategoryId"
      @select-node="selectObjectBehaviorCategory"
      @create="openCategoryCreate"
      @edit="openCategoryEdit"
      @delete="openCategoryDelete"
    />
    <section class="object-behavior-workspace__main">
      <div v-if="status === 'loading'" class="object-behavior-workspace__state" role="status"><AircasLoading>正在加载对象行为…</AircasLoading></div>
      <div v-else-if="status === 'error'" class="object-behavior-workspace__state" role="alert">
        <span>{{ errorMessage }}</span
        ><el-button class="aircas-button aircas-button--tone-primary" @click="loadObjectBehaviorWorkspace">重试</el-button>
      </div>
      <el-empty v-else-if="status === 'empty'" description="暂无可用行为数据" /><ObjectBehaviorListPanel
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
        @query="applyObjectBehaviorFilters"
        @reset="resetObjectBehaviorFilters"
        @create="openBehaviorCreate"
        @view="openBehaviorView"
        @edit="openBehaviorEdit"
        @status="openBehaviorStatus"
        @delete="openBehaviorDelete"
        @page-change="page = $event"
        @page-size-change="changePageSize"
      />
    </section>
    <ObjectBehaviorCategoryFormDialog
      v-model="categoryFormVisible"
      :mode="categoryFormMode"
      :parent-label="categoryParentLabel"
      :initial-name="categoryName"
      @submit="saveCategory"
    /><ObjectBehaviorCategoryDeleteDialog
      v-model="categoryDeleteVisible"
      :category-name="categoryName"
      :blocked="categoryDeleteBlocked"
      @confirm="removeCategory"
    />
    <ObjectBehaviorFormDialog
      v-model="behaviorFormVisible"
      :mode="behaviorFormMode"
      :behavior="activeBehavior"
      :category-options="categoryOptions"
      :default-category-id="selectedCategoryId"
      @submit="saveBehavior"
      @save-copy="saveBehaviorCopy"
    /><ObjectBehaviorDetailDrawer v-model="behaviorDetailVisible" :behavior="activeBehavior" /><ObjectBehaviorStatusDialog
      v-model="behaviorStatusVisible"
      :behavior="activeBehavior"
      @submit="saveBehaviorStatus"
    /><ObjectBehaviorDeleteDialog v-model="behaviorDeleteVisible" :behavior="activeBehavior" @confirm="removeBehavior" />
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";
import type { SpaceBehaviorDraft, SpaceBehaviorItem, SpaceBehaviorStatusChangeDraft } from "@/types";
import { ROOT_SPACE_BEHAVIOR_CATEGORY_ID } from "@/types";
import AircasLoading from "@/components/AircasLoading.vue";
import { useObjectBehaviorWorkspace } from "../composables/useObjectBehaviorWorkspace";
import { findObjectBehaviorCategoryNode, flattenObjectBehaviorCategoryOptions } from "../utils/objectBehaviorOperations";
import ObjectBehaviorCategoryDeleteDialog from "./ObjectBehaviorCategoryDeleteDialog.vue";
import ObjectBehaviorCategoryFormDialog from "./ObjectBehaviorCategoryFormDialog.vue";
import ObjectBehaviorCategoryPanel from "./ObjectBehaviorCategoryPanel.vue";
import ObjectBehaviorDeleteDialog from "./ObjectBehaviorDeleteDialog.vue";
import ObjectBehaviorDetailDrawer from "./ObjectBehaviorDetailDrawer.vue";
import ObjectBehaviorFormDialog from "./ObjectBehaviorFormDialog.vue";
import ObjectBehaviorListPanel from "./ObjectBehaviorListPanel.vue";
import ObjectBehaviorStatusDialog from "./ObjectBehaviorStatusDialog.vue";
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
  loadObjectBehaviorWorkspace,
  selectObjectBehaviorCategory,
  applyObjectBehaviorFilters,
  resetObjectBehaviorFilters,
  createObjectBehaviorCategory,
  renameObjectBehaviorCategory,
  deleteObjectBehaviorCategory,
  createObjectBehavior,
  updateObjectBehavior,
  changeObjectBehaviorStatus,
  deleteObjectBehavior,
} = useObjectBehaviorWorkspace();
const categoryFormVisible = ref(false);
const categoryDeleteVisible = ref(false);
const categoryFormMode = ref<"create" | "edit">("create");
const categoryParentId = ref(ROOT_SPACE_BEHAVIOR_CATEGORY_ID);
const categoryId = ref("");
const categoryName = ref("");
const categoryDeleteBlocked = ref(false);
const behaviorFormVisible = ref(false);
const behaviorFormMode = ref<"create" | "edit">("create");
const behaviorDetailVisible = ref(false);
const behaviorStatusVisible = ref(false);
const behaviorDeleteVisible = ref(false);
const activeBehavior = ref<SpaceBehaviorItem | null>(null);
const categoryOptions = computed(() => flattenObjectBehaviorCategoryOptions(categoryTree.value));
const categoryParentLabel = computed(() => findObjectBehaviorCategoryNode(categoryTree.value, categoryParentId.value)?.label ?? "行为分类");
/** @description 打开新建分类弹窗。 @param parentId 父分类标识。 */ function openCategoryCreate(parentId: string): void {
  categoryFormMode.value = "create";
  categoryParentId.value = parentId || ROOT_SPACE_BEHAVIOR_CATEGORY_ID;
  categoryName.value = "";
  categoryFormVisible.value = true;
}
/** @description 打开分类编辑弹窗。 @param id 分类标识。 */ function openCategoryEdit(id: string): void {
  const node = findObjectBehaviorCategoryNode(categoryTree.value, id);
  if (!node) return;
  categoryFormMode.value = "edit";
  categoryId.value = id;
  categoryName.value = node.label;
  categoryFormVisible.value = true;
}
/** @description 打开分类删除弹窗。 @param id 分类标识。 */ function openCategoryDelete(id: string): void {
  const node = findObjectBehaviorCategoryNode(categoryTree.value, id);
  if (!node) return;
  categoryId.value = id;
  categoryName.value = node.label;
  categoryDeleteBlocked.value = node.children.length > 0 || node.count > 0;
  categoryDeleteVisible.value = true;
}
/** @description 保存分类。 @param name 分类名称。 */ function saveCategory(name: string): void {
  const ok =
    categoryFormMode.value === "create" ? createObjectBehaviorCategory(categoryParentId.value, name) : renameObjectBehaviorCategory(categoryId.value, name);
  if (ok) {
    categoryFormVisible.value = false;
    ElMessage.success("分类已保存");
  } else ElMessage.error("分类保存失败");
}
/** @description 删除当前分类。 */ function removeCategory(): void {
  const result = deleteObjectBehaviorCategory(categoryId.value);
  if (result.ok) {
    categoryDeleteVisible.value = false;
    ElMessage.success("分类已删除");
  } else ElMessage.error("分类不可删除");
}
/** @description 打开行为创建弹窗。 */ function openBehaviorCreate(): void {
  behaviorFormMode.value = "create";
  activeBehavior.value = null;
  behaviorFormVisible.value = true;
}
/** @description 查看行为详情。 @param item 行为记录。 */ function openBehaviorView(item: SpaceBehaviorItem): void {
  activeBehavior.value = item;
  behaviorDetailVisible.value = true;
}
/** @description 编辑行为。 @param item 行为记录。 */ function openBehaviorEdit(item: SpaceBehaviorItem): void {
  behaviorFormMode.value = "edit";
  activeBehavior.value = item;
  behaviorFormVisible.value = true;
}
/** @description 管理行为状态。 @param item 行为记录。 */ function openBehaviorStatus(item: SpaceBehaviorItem): void {
  activeBehavior.value = item;
  behaviorStatusVisible.value = true;
}
/** @description 删除行为。 @param item 行为记录。 */ function openBehaviorDelete(item: SpaceBehaviorItem): void {
  activeBehavior.value = item;
  behaviorDeleteVisible.value = true;
}
/** @description 保存行为。 @param draft 行为草稿。 */ function saveBehavior(draft: SpaceBehaviorDraft): void {
  const ok =
    behaviorFormMode.value === "create"
      ? (createObjectBehavior({ ...draft, status: "draft" }), true)
      : activeBehavior.value
        ? updateObjectBehavior(activeBehavior.value.id, draft)
        : false;
  if (ok) {
    behaviorFormVisible.value = false;
    ElMessage.success("行为已保存");
  } else ElMessage.error("行为保存失败");
}
/** @description 将行为另存为草稿。 @param draft 行为草稿。 */ function saveBehaviorCopy(draft: SpaceBehaviorDraft): void {
  createObjectBehavior({ ...draft, status: "draft" });
  behaviorFormVisible.value = false;
  ElMessage.success("已另存为草稿副本");
}
/** @description 保存行为状态。 @param draft 状态变更。 */ function saveBehaviorStatus(draft: SpaceBehaviorStatusChangeDraft): void {
  if (activeBehavior.value && changeObjectBehaviorStatus(activeBehavior.value.id, draft)) {
    behaviorStatusVisible.value = false;
    ElMessage.success("状态已更新");
  } else ElMessage.error("状态变更失败");
}
/** @description 删除当前行为。 */ function removeBehavior(): void {
  if (activeBehavior.value && deleteObjectBehavior(activeBehavior.value.id)) {
    behaviorDeleteVisible.value = false;
    ElMessage.success("行为已删除");
  } else ElMessage.error("行为删除失败");
}
/** @description 修改每页数量并回到第一页。 @param size 每页数量。 */ function changePageSize(size: number): void {
  pageSize.value = size;
  page.value = 1;
}
</script>
<style scoped lang="scss">
.object-behavior-workspace {
  display: grid;
  width: 100%;
  min-width: 0;
  min-height: 0;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 8px;
}
.object-behavior-workspace__main {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
}
.object-behavior-workspace__state {
  display: grid;
  min-height: 260px;
  gap: 12px;
  color: var(--aircas-color-text-secondary);
  place-content: center;
}
@media (max-width: 960px) {
  .object-behavior-workspace {
    grid-template-columns: 1fr;
  }
  .object-behavior-workspace__main {
    min-height: 520px;
  }
}
</style>
