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
    <OntologyObjectCreateDialog
      v-model="objectCreateVisible"
      :categories="categoryOptions"
      :parent-options="parentOptions"
      :submitting="objectCreateSubmitting"
      :error="objectCreateError"
      :editing-item="editingObject"
      @submit-manual="createOntologyObject"
      @submit-import="createOntologyObjects"
      @submit-edit="updateOntologyObject"
      @open-llm="openOntologyLlmBuilder"
    />
    <OntologyObjectDeleteDialog
      v-model="objectDeleteVisible"
      :object-name="deletingObject?.displayName ?? ''"
      :submitting="objectDeleteSubmitting"
      :error="objectDeleteError"
      @confirm="confirmDeleteOntologyObject"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { storeToRefs } from "pinia";
import type { OntologyConceptNode, OntologyObjectItem, OntologyObjectLocationTarget, OntologyObjectViewMode } from "@/types";
import ConceptHierarchyTree from "./ConceptHierarchyTree.vue";
import CategoryTreeCreateDialog from "./CategoryTreeCreateDialog.vue";
import CategoryTreeChildDialog from "./CategoryTreeChildDialog.vue";
import CategoryTreeRenameDialog from "./CategoryTreeRenameDialog.vue";
import CategoryTreeDeleteDialog from "./CategoryTreeDeleteDialog.vue";
import OntologyObjectCreateDialog from "./OntologyObjectCreateDialog.vue";
import OntologyObjectDeleteDialog from "./OntologyObjectDeleteDialog.vue";
import OntologyObjectList from "./OntologyObjectList.vue";
import { useOntologyObjectWorkspace } from "../composables/useOntologyObjectWorkspace";
import { useObjectWorkspaceCategoryActions } from "../composables/useObjectWorkspaceCategoryActions";
import { useObjectWorkspaceObjectActions } from "../composables/useObjectWorkspaceObjectActions";
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
const selectedNodeId = ref("");
const viewMode = ref<OntologyObjectViewMode>("card");
const locationTarget = ref<OntologyObjectLocationTarget | null>(null);
let locationRequestId = 0;

const {
  categoryTreeDialogVisible,
  categoryChildDialogVisible,
  categoryChildSubmitting,
  categoryChildError,
  categoryRenameVisible,
  categoryRenameSubmitting,
  categoryRenameError,
  categoryRenameName,
  categoryDeleteVisible,
  categoryDeleteSubmitting,
  categoryDeleteError,
  categoryDeleteName,
  categoryTreeSubmitting,
  categoryTreeError,
  openCategoryTreeCreateDialog,
  openCategoryChildDialog,
  openCategoryRenameDialog,
  confirmRenameCategory,
  openCategoryDeleteDialog,
  confirmDeleteCategory,
  submitCreateOntologyCategoryChild,
  submitCreateOntologyCategoryTree,
} = useObjectWorkspaceCategoryActions({
  spaceId,
  load,
});

const {
  objectCreateVisible,
  objectCreateSubmitting,
  objectCreateError,
  editingObject,
  objectDeleteVisible,
  objectDeleteSubmitting,
  objectDeleteError,
  deletingObject,
  categoryOptions,
  parentOptions,
  openOntologyObjectCreateDialog,
  openOntologyObjectEditDialog,
  openOntologyObjectDeleteDialog,
  createOntologyObjects,
  createOntologyObject,
  updateOntologyObject,
  confirmDeleteOntologyObject,
  openOntologyLlmBuilder,
} = useObjectWorkspaceObjectActions({
  spaceId,
  workspace,
  load,
});

/**
 * @description 定位右侧对象列表到指定分类分区。
 * @param categoryId 分类 id
 */
function locateCategory(categoryId: string) {
  locationTarget.value = makeCategoryLocationTarget(categoryId, ++locationRequestId);
}

/**
 * @description 选中左侧分类节点并定位右侧列表。
 * @param node 分类树节点
 */
function selectNode(node: OntologyConceptNode) {
  selectedNodeId.value = node.id;
  if (node.targetCategoryId) {
    locateCategory(node.targetCategoryId);
  }
}

/**
 * @description 从对象卡片定位到其所属分类。
 * @param item 本体对象
 */
function locateParent(item: OntologyObjectItem) {
  selectedNodeId.value = item.categoryId;
  locateCategory(item.categoryId);
}

/**
 * @description 分发对象列表工具栏与卡片操作。
 * @param action 操作标识
 * @param item 可选的操作对象
 */
function handleAction(action: string, item?: OntologyObjectItem) {
  if (action === "create") {
    openOntologyObjectCreateDialog();
    return;
  }
  if (action === "edit" && item) {
    openOntologyObjectEditDialog(item);
    return;
  }
  if (action === "delete" && item) {
    openOntologyObjectDeleteDialog(item);
    return;
  }
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

@media (max-width: 1100px) {
  .object-workspace-panel__layout {
    grid-template-columns: 280px minmax(0, 1fr);
  }
}

@media (max-width: 860px) {
  .object-workspace-panel__layout {
    grid-template-columns: 1fr;
    overflow: auto;
  }
}
</style>
