<template>
  <section class="object-workspace-panel" aria-label="本体对象工作区">
    <div v-if="status === 'loading'" class="object-workspace-panel__state" role="status">正在加载本体对象…</div>
    <div v-else-if="status === 'error'" class="object-workspace-panel__state" role="alert">
      <span>{{ error }}</span>
      <el-button class="aircas-button" type="primary" @click="load">重试</el-button>
    </div>
    <div v-else class="object-workspace-panel__layout">
      <ConceptHierarchyTree
        :tree="workspaceTree"
        :selected-node-id="selectedNodeId"
        @select="selectNode"
        @create="openCategoryTreeCreateDialog"
        @create-child="openCategoryChildDialog"
        @rename="openCategoryRenameDialog"
        @delete="openCategoryDeleteDialog"
      />
      <OntologyObjectList
        :sections="workspaceSections"
        :view-mode="viewMode"
        :location-target="locationTarget"
        @update:view-mode="viewMode = $event"
        @locate-parent="locateParent"
        @action="handleAction"
      />
    </div>
    <CategoryTreeCreateDialog
      v-model="categoryTreeDialogVisible"
      :submitting="categoryTreeSubmitting"
      :error="categoryTreeError"
      @submit="submitCreateOntologyCategoryTree"
    />
    <CategoryTreeChildDialog
      v-model="categoryChildDialogVisible"
      :submitting="categoryChildSubmitting"
      :error="categoryChildError"
      @submit="submitCreateOntologyCategoryChild"
    />
    <CategoryTreeRenameDialog
      v-model="categoryRenameVisible"
      :initial-name="categoryRenameName"
      :submitting="categoryRenameSubmitting"
      :error="categoryRenameError"
      @submit="confirmRenameCategory"
    />
    <CategoryTreeDeleteDialog
      v-model="categoryDeleteVisible"
      :category-name="categoryDeleteName"
      :submitting="categoryDeleteSubmitting"
      :error="categoryDeleteError"
      @confirm="confirmDeleteCategory"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { storeToRefs } from "pinia";
import type { OntologyConceptNode, OntologyObjectItem, OntologyObjectLocationTarget, OntologyObjectViewMode } from "@/types";
import { deleteOntologyCategoryTreeInterface, postCreateOntologyCategoryTreeInterface, putUpdateOntologyCategoryNameInterface } from "@/apis";
import ConceptHierarchyTree from "./ConceptHierarchyTree.vue";
import CategoryTreeCreateDialog from "./CategoryTreeCreateDialog.vue";
import CategoryTreeChildDialog from "./CategoryTreeChildDialog.vue";
import CategoryTreeRenameDialog from "./CategoryTreeRenameDialog.vue";
import CategoryTreeDeleteDialog from "./CategoryTreeDeleteDialog.vue";
import OntologyObjectList from "./OntologyObjectList.vue";
import { useOntologyObjectWorkspace } from "../composables/useOntologyObjectWorkspace";
import { useOntologySpaceDetailStore } from "@/stores/useOntologySpaceDetailStore";
import { makeCategoryLocationTarget } from "../utils/objectWorkspace";

const route = useRoute();
const router = useRouter();
const spaceId = computed(() => String(route.params.spaceId || ""));
const detailStore = useOntologySpaceDetailStore();
const { displayName: spaceDisplayName } = storeToRefs(detailStore);
const { status, error, workspace, load } = useOntologyObjectWorkspace(spaceId);
const workspaceTree = computed(() => workspace.value?.tree ?? []);
const workspaceSections = computed(() => workspace.value?.sections ?? []);
const categoryTreeDialogVisible = ref(false);
const categoryChildDialogVisible = ref(false);
const categoryChildParentId = ref("");
const categoryChildSubmitting = ref(false);
const categoryChildError = ref("");
const categoryRenameVisible = ref(false);
const categoryRenameSubmitting = ref(false);
const categoryRenameError = ref("");
const categoryRenameId = ref("");
const categoryRenameName = ref("");
const categoryDeleteVisible = ref(false);
const categoryDeleteSubmitting = ref(false);
const categoryDeleteError = ref("");
const categoryDeleteId = ref("");
const categoryDeleteName = ref("");
const categoryTreeSubmitting = ref(false);
const categoryTreeError = ref("");
const selectedNodeId = ref("");
const viewMode = ref<OntologyObjectViewMode>("card");
const locationTarget = ref<OntologyObjectLocationTarget | null>(null);
let locationRequestId = 0;

/**
 * @description 打开添加分类树弹框，供输入主分类名称。
 */
function openCategoryTreeCreateDialog() {
  categoryTreeError.value = "";
  categoryTreeDialogVisible.value = true;
}

/**
 * @description 打开新建子分类弹框，记录父节点 categoryId。
 * @param categoryId 父节点分类 id。
 */
function openCategoryChildDialog(categoryId: string) {
  categoryChildError.value = "";
  categoryChildParentId.value = categoryId;
  categoryChildDialogVisible.value = true;
}

/**
 * @description 打开修改分类名称弹框，并带入当前分类名称。
 * @param categoryId 当前分类 id。
 * @param name 当前分类名称。
 */
function openCategoryRenameDialog(categoryId: string, name: string) {
  categoryRenameError.value = "";
  categoryRenameId.value = categoryId;
  categoryRenameName.value = name;
  categoryRenameVisible.value = true;
}

/**
 * @description 以当前空间 id、分类 id 和新名称调用修改分类名称接口；成功后关闭弹框并重新加载分类树。
 * @param name 填写后的分类名称。
 */
async function confirmRenameCategory(name: string) {
  if (categoryRenameSubmitting.value) return;
  const space = spaceId.value.trim();
  const numericSpaceId = Number(space);
  const numericCategoryId = Number(categoryRenameId.value);
  if (!space || !Number.isInteger(numericSpaceId) || !Number.isInteger(numericCategoryId)) {
    categoryRenameError.value = "缺少空间或分类 id，无法修改分类名称。";
    return;
  }
  categoryRenameSubmitting.value = true;
  categoryRenameError.value = "";
  try {
    const response = await putUpdateOntologyCategoryNameInterface({
      spaceId: numericSpaceId,
      categoryId: numericCategoryId,
      name,
    });
    if (response.code !== 200) {
      throw new Error(response.message || "修改分类名称失败");
    }
    categoryRenameVisible.value = false;
    ElMessage.success("分类名称已修改");
    await load();
  } catch (cause) {
    categoryRenameError.value = cause instanceof Error && cause.message.trim() ? cause.message : "修改分类名称失败，请重试。";
  } finally {
    categoryRenameSubmitting.value = false;
  }
}

/**
 * @description 打开删除分类确认框。
 * @param categoryId 当前分类 id。
 * @param name 当前分类名称。
 */
function openCategoryDeleteDialog(categoryId: string, name: string) {
  categoryDeleteError.value = "";
  categoryDeleteId.value = categoryId;
  categoryDeleteName.value = name;
  categoryDeleteVisible.value = true;
}

/**
 * @description 以当前空间 id 和分类 id 调用删除分类接口；成功后关闭确认框并重新加载分类树。
 */
async function confirmDeleteCategory() {
  if (categoryDeleteSubmitting.value) return;
  const space = spaceId.value.trim();
  const numericSpaceId = Number(space);
  const numericCategoryId = Number(categoryDeleteId.value);
  if (!space || !Number.isInteger(numericSpaceId) || !Number.isInteger(numericCategoryId)) {
    categoryDeleteError.value = "缺少空间或分类 id，无法删除分类。";
    return;
  }
  categoryDeleteSubmitting.value = true;
  categoryDeleteError.value = "";
  try {
    const response = await deleteOntologyCategoryTreeInterface({
      spaceId: numericSpaceId,
      categoryId: numericCategoryId,
    });
    if (response.code !== 200) {
      throw new Error(response.message || "删除分类失败");
    }
    categoryDeleteVisible.value = false;
    ElMessage.success("分类已删除");
    await load();
  } catch (cause) {
    categoryDeleteError.value = cause instanceof Error && cause.message.trim() ? cause.message : "删除分类失败，请重试。";
  } finally {
    categoryDeleteSubmitting.value = false;
  }
}

/**
 * @description 以当前空间 id、父节点 categoryId 和子分类名称调用创建分类树接口。
 * @param name 子分类名称。
 */
async function submitCreateOntologyCategoryChild(name: string) {
  if (categoryChildSubmitting.value) return;
  const space = spaceId.value.trim();
  const numericSpaceId = Number(space);
  const numericParentId = Number(categoryChildParentId.value);
  if (!space || !Number.isInteger(numericSpaceId) || !Number.isInteger(numericParentId)) {
    categoryChildError.value = "缺少空间或父分类 id，无法创建子分类。";
    return;
  }
  categoryChildSubmitting.value = true;
  categoryChildError.value = "";
  try {
    const response = await postCreateOntologyCategoryTreeInterface({
      spaceId: numericSpaceId,
      parentId: numericParentId,
      name,
    });
    if (response.code !== 200) {
      throw new Error(response.message || "创建子分类失败");
    }
    categoryChildDialogVisible.value = false;
    ElMessage.success("子分类已创建");
    await load();
  } catch (cause) {
    categoryChildError.value = cause instanceof Error && cause.message.trim() ? cause.message : "创建子分类失败，请重试。";
  } finally {
    categoryChildSubmitting.value = false;
  }
}

/**
 * @description 以数字空间 id、固定父级 0 和主分类名称创建分类树；成功后关闭弹框并重新加载。
 * @param name 主分类名称。
 */
async function submitCreateOntologyCategoryTree(name: string) {
  if (categoryTreeSubmitting.value) return;
  const space = spaceId.value.trim();
  const numericSpaceId = Number(space);
  if (!space || !Number.isInteger(numericSpaceId)) {
    categoryTreeError.value = "缺少空间 id，无法创建分类树。";
    return;
  }
  categoryTreeSubmitting.value = true;
  categoryTreeError.value = "";
  try {
    const response = await postCreateOntologyCategoryTreeInterface({
      spaceId: numericSpaceId,
      parentId: 0,
      name,
    });
    if (response.code !== 200) {
      throw new Error(response.message || "创建分类树失败");
    }
    categoryTreeDialogVisible.value = false;
    ElMessage.success("分类树已创建");
    await load();
  } catch (cause) {
    categoryTreeError.value = cause instanceof Error && cause.message.trim() ? cause.message : "创建分类树失败，请重试。";
  } finally {
    categoryTreeSubmitting.value = false;
  }
}

function locateCategory(categoryId: string) {
  locationTarget.value = makeCategoryLocationTarget(categoryId, ++locationRequestId);
}

function selectNode(node: OntologyConceptNode) {
  selectedNodeId.value = node.id;
  if (node.targetCategoryId) locateCategory(node.targetCategoryId);
}

function locateParent(item: OntologyObjectItem) {
  selectedNodeId.value = `category-${item.categoryId}`;
  locateCategory(item.categoryId);
}

function handleAction(action: string, item?: OntologyObjectItem) {
  if (action === "view" && item) {
    const query: Record<string, string> = {};
    if (spaceId.value) query.spaceId = spaceId.value;
    if (spaceDisplayName.value.trim()) query.spaceName = spaceDisplayName.value.trim();
    if (item.displayName.trim()) query.objectName = item.displayName.trim();
    void router.push({
      name: "OntologyObjectDetail",
      params: { objectId: item.id },
      query,
    });
    return;
  }
  const subject = item ? `“${item.displayName}”` : "本体";
  const labels: Record<string, string> = { create: "新建", edit: "编辑", export: "导出", delete: "删除" };
  ElMessage.info(`${subject}${labels[action] ?? "操作"}功能尚未接入。`);
}
</script>

<style scoped lang="scss">
.object-workspace-panel {
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  flex-direction: column;
}
.object-workspace-panel__layout {
  display: grid;
  min-width: 0;
  min-height: 0;
  height: 100%;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 10px;
}
.object-workspace-panel__state {
  display: flex;
  min-height: 280px;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  color: var(--aircas-color-text-muted);
  background: var(--aircas-color-panel-background);
}

@media (max-width: 1000px) {
  .object-workspace-panel {
    overflow-y: auto;
  }
  .object-workspace-panel__layout {
    height: auto;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(280px, 38vh) minmax(520px, auto);
  }
}
</style>
