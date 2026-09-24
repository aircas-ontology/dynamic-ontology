<template>
  <section class="object-workspace-panel" aria-label="本体对象工作区">
    <div v-if="status === 'loading'" class="object-workspace-panel__state" role="status"><AircasLoading>正在加载本体对象…</AircasLoading></div>
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
      :category-tree="workspaceTree"
      :parent-options="parentOptions"
      :submitting="objectCreateSubmitting"
      :error="objectCreateError"
      :editing-item="editingObject"
      @submit-manual="createOntologyObject"
      @submit-import="importOntologyObjects"
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
    <OntologyObjectExportDialog
      v-model="objectExportVisible"
      :object-name="exportingObject?.displayName ?? ''"
      :submitting="objectExporting"
      :error="objectExportError"
      @confirm="confirmExportOntologyObject"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { storeToRefs } from "pinia";
import type { OntologyConceptNode, OntologyObjectItem, OntologyObjectLocationTarget, OntologyObjectViewMode } from "@/types";
import AircasLoading from "@/components/AircasLoading.vue";
import ConceptHierarchyTree from "./ConceptHierarchyTree.vue";
import CategoryTreeCreateDialog from "./CategoryTreeCreateDialog.vue";
import CategoryTreeChildDialog from "./CategoryTreeChildDialog.vue";
import CategoryTreeRenameDialog from "./CategoryTreeRenameDialog.vue";
import CategoryTreeDeleteDialog from "./CategoryTreeDeleteDialog.vue";
import OntologyObjectCreateDialog from "./OntologyObjectCreateDialog.vue";
import OntologyObjectDeleteDialog from "./OntologyObjectDeleteDialog.vue";
import OntologyObjectExportDialog from "./OntologyObjectExportDialog.vue";
import OntologyObjectList from "./OntologyObjectList.vue";
import { useObjectWorkspaceCategoryActions } from "../composables/useObjectWorkspaceCategoryActions";
import { useObjectWorkspaceObjectActions } from "../composables/useObjectWorkspaceObjectActions";
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
const categoryActions = useObjectWorkspaceCategoryActions({ spaceId, load });
const objectActions = useObjectWorkspaceObjectActions({ spaceId, workspace, load, onOpenLlmBuilder: openOntologyLlmBuilderPage });
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
} = categoryActions;
const {
  objectCreateVisible,
  objectCreateSubmitting,
  objectCreateError,
  editingObject,
  objectDeleteVisible,
  objectDeleteSubmitting,
  objectDeleteError,
  deletingObject,
  objectExportVisible,
  objectExporting,
  objectExportError,
  exportingObject,
  parentOptions,
  openOntologyObjectCreateDialog,
  openOntologyObjectEditDialog,
  openOntologyObjectDeleteDialog,
  importOntologyObjects,
  createOntologyObject,
  updateOntologyObject,
  confirmDeleteOntologyObject,
  openOntologyObjectExportDialog,
  confirmExportOntologyObject,
  openOntologyLlmBuilder,
} = objectActions;
const selectedNodeId = ref("");
const viewMode = ref<OntologyObjectViewMode>("card");
const locationTarget = ref<OntologyObjectLocationTarget | null>(null);
let locationRequestId = 0;

/**
 * @description 更新右侧对象列表的分类锚点定位请求。
 * @param categoryId 被选中的分类 id。
 */
function locateCategory(categoryId: string) {
  locationTarget.value = makeCategoryLocationTarget(categoryId, ++locationRequestId);
}

/**
 * @description 选择分类树节点并定位到对应的对象分区。
 * @param node 被选中的分类树节点。
 */
function selectNode(node: OntologyConceptNode) {
  selectedNodeId.value = node.id;
  if (node.targetCategoryId) locateCategory(node.targetCategoryId);
}

/**
 * @description 将对象卡片的父本体定位到其所属分类分区。
 * @param item 需要定位的本体对象。
 */
function locateParent(item: OntologyObjectItem) {
  selectedNodeId.value = item.categoryId;
  locateCategory(item.categoryId);
}

/**
 * @description 关闭对象创建弹窗并进入当前空间的大模型构建页。
 */
function openOntologyLlmBuilderPage() {
  void router.push({ name: "OntologyLlmBuilder", params: { spaceId: spaceId.value } });
}

/**
 * @description 根据对象列表动作打开弹窗、进入详情或提示未接入动作。
 * @param action 对象列表动作标识。
 * @param item 当前对象。
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
  if (action === "export" && item) {
    openOntologyObjectExportDialog(item);
    return;
  }
  if (action === "view" && item) {
    const query: Record<string, string> = {};
    if (spaceId.value) query.spaceId = spaceId.value;
    if (spaceDisplayName.value.trim()) query.spaceName = spaceDisplayName.value.trim();
    if (item.displayName.trim()) query.objectName = item.displayName.trim();
    void router.push({ name: "OntologyObjectDetail", params: { objectId: item.id }, query });
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
  gap: 8px;
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
  background: linear-gradient(135deg, var(--aircas-color-overlay), var(--aircas-color-overlay-deep));
  box-shadow: inset 0 0 20px var(--aircas-color-page-glow);
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
