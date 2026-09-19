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
import type { OntologyConceptNode, OntologyObjectCreateDraft, OntologyObjectItem, OntologyObjectLocationTarget, OntologyObjectViewMode } from "@/types";
import {
  createOntologyObjectInterface,
  deleteOntologyCategoryTreeInterface,
  deleteOntologyObjectInterface,
  postCreateOntologyCategoryTreeInterface,
  putUpdateOntologyCategoryNameInterface,
  updateOntologyObjectInterface,
} from "@/apis";
import ConceptHierarchyTree from "./ConceptHierarchyTree.vue";
import CategoryTreeCreateDialog from "./CategoryTreeCreateDialog.vue";
import CategoryTreeChildDialog from "./CategoryTreeChildDialog.vue";
import CategoryTreeRenameDialog from "./CategoryTreeRenameDialog.vue";
import CategoryTreeDeleteDialog from "./CategoryTreeDeleteDialog.vue";
import OntologyObjectCreateDialog from "./OntologyObjectCreateDialog.vue";
import OntologyObjectDeleteDialog from "./OntologyObjectDeleteDialog.vue";
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
const objectCreateVisible = ref(false);
const objectCreateSubmitting = ref(false);
const objectCreateError = ref("");
const editingObject = ref<OntologyObjectItem | null>(null);
const objectDeleteVisible = ref(false);
const objectDeleteSubmitting = ref(false);
const objectDeleteError = ref("");
const deletingObject = ref<OntologyObjectItem | null>(null);
let locationRequestId = 0;

const categoryOptions = computed(() => {
  const options: Array<{ id: string; name: string }> = [];

  /** @description 递归收集分类树选项。 @param nodes 当前分类节点。 */
  function visit(nodes: OntologyConceptNode[]) {
    nodes.forEach((node) => {
      options.push({ id: node.targetCategoryId ?? node.id, name: node.label || `分类 ${node.id}` });
      visit(node.children);
    });
  }
  visit(workspaceTree.value);
  return options;
});

const parentOptions = computed(() => workspaceSections.value.flatMap((section) => section.items));

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
  if (node.targetCategoryId) {
    locateCategory(node.targetCategoryId);
  }
}

function locateParent(item: OntologyObjectItem) {
  selectedNodeId.value = item.categoryId;
  locateCategory(item.categoryId);
}

/**
 * @description 打开本体对象创建弹框并清理上次提交错误。
 */
function openOntologyObjectCreateDialog() {
  objectCreateError.value = "";
  editingObject.value = null;
  objectCreateVisible.value = true;
}

/**
 * @description 打开本体对象编辑弹框并回显当前对象信息。
 * @param item 待编辑的本体对象。
 */
function openOntologyObjectEditDialog(item: OntologyObjectItem) {
  objectCreateError.value = "";
  editingObject.value = item;
  objectCreateVisible.value = true;
}

/**
 * @description 打开本体对象删除确认弹框并记录待删除对象。
 * @param item 待删除的本体对象。
 */
function openOntologyObjectDeleteDialog(item: OntologyObjectItem) {
  objectDeleteError.value = "";
  deletingObject.value = item;
  objectDeleteVisible.value = true;
}

/**
 * @description 将本地创建的本体对象追加到当前分类分区，并同步分类树计数。
 * @param drafts 本体对象创建草稿列表。
 * @returns 创建流程完成后的 Promise。
 */
async function createOntologyObjects(drafts: OntologyObjectCreateDraft[]) {
  if (objectCreateSubmitting.value) return;
  if (!workspace.value || !drafts.length) return;
  const currentWorkspace = workspace.value;
  objectCreateSubmitting.value = true;
  objectCreateError.value = "";
  try {
    const now = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    drafts.forEach((draft) => {
      const section = currentWorkspace.sections.find((item) => item.categoryId === draft.categoryId);
      if (!section) throw new Error("所选分类不存在，请刷新后重试。");
      section.items.push({
        id: `local-${Date.now()}-${draft.apiName}`,
        categoryId: draft.categoryId,
        displayName: draft.displayName,
        apiName: draft.apiName,
        description: draft.description,
        parentDisplayName: parentOptions.value.find((item) => item.id === draft.parentId)?.displayName ?? "无",
        createdAt: now,
        iconUrl: draft.iconUrl,
        metrics: { attribute: 0, relation: 0, behavior: 0 },
      });
      incrementCategoryCount(currentWorkspace.tree, draft.categoryId);
    });
    objectCreateVisible.value = false;
    ElMessage.success(drafts.length > 1 ? "本体已批量创建" : "本体已创建");
  } catch (cause) {
    objectCreateError.value = cause instanceof Error ? cause.message : "本体创建失败，请重试。";
  } finally {
    objectCreateSubmitting.value = false;
  }
}

/**
 * @description 调用本体对象手动创建接口；成功后关闭弹框、提示并刷新当前分类树列表。
 * @param draft 本体对象创建草稿。
 */
async function createOntologyObject(draft: OntologyObjectCreateDraft) {
  if (objectCreateSubmitting.value) return;
  const numericSpaceId = Number(spaceId.value.trim());
  const numericCategoryId = Number(draft.categoryId);
  const numericParentId = draft.parentId ? Number(draft.parentId) : undefined;
  if (!Number.isInteger(numericSpaceId) || !Number.isInteger(numericCategoryId)) {
    objectCreateError.value = "缺少有效的空间或分类 id，无法创建本体。";
    return;
  }
  if (draft.parentId && !Number.isInteger(numericParentId)) {
    objectCreateError.value = "继承本体 id 无效，无法创建本体。";
    return;
  }
  objectCreateSubmitting.value = true;
  objectCreateError.value = "";
  try {
    const response = await createOntologyObjectInterface({
      spaceId: numericSpaceId,
      displayName: draft.displayName,
      apiName: draft.apiName,
      ...(draft.iconUrl ? { icon: draft.iconUrl } : {}),
      ...(draft.description ? { description: draft.description } : {}),
      ...(numericParentId === undefined ? {} : { parentOntologyUniqueIdentifier: numericParentId }),
      categoryId: numericCategoryId,
      groupIds: [],
    });
    if (response.code !== 200) throw new Error(response.message || "本体创建失败");
    objectCreateVisible.value = false;
    ElMessage.success("本体创建成功");
    await load();
  } catch (cause) {
    objectCreateError.value = cause instanceof Error && cause.message.trim() ? cause.message : "本体创建失败，请重试。";
  } finally {
    objectCreateSubmitting.value = false;
  }
}

/**
 * @description 调用本体对象修改接口；成功后关闭弹框、提示并刷新分类树列表。
 * @param draft 编辑后的本体对象草稿。
 */
async function updateOntologyObject(draft: OntologyObjectCreateDraft) {
  if (objectCreateSubmitting.value) return;
  const categoryId = Number(draft.categoryId);
  if (!editingObject.value?.id || !draft.displayName.trim() || !Number.isInteger(categoryId)) {
    objectCreateError.value = "请填写有效的本体名称和分类。";
    return;
  }
  objectCreateSubmitting.value = true;
  objectCreateError.value = "";
  try {
    const response = await updateOntologyObjectInterface({
      ontologyIdentifier: editingObject.value.id,
      displayName: draft.displayName.trim(),
      groupIds: [],
      icon: draft.iconUrl,
      description: draft.description,
      categoryId,
    });
    if (response.code !== 200) throw new Error(response.message || "本体修改失败");
    objectCreateVisible.value = false;
    editingObject.value = null;
    ElMessage.success("本体修改成功");
    await load();
  } catch (cause) {
    objectCreateError.value = cause instanceof Error && cause.message.trim() ? cause.message : "本体修改失败，请重试。";
  } finally {
    objectCreateSubmitting.value = false;
  }
}

/**
 * @description 调用本体对象删除接口；成功后关闭确认弹框、提示并刷新分类树列表。
 */
async function confirmDeleteOntologyObject() {
  if (objectDeleteSubmitting.value) return;
  const ontologyIdentifier = deletingObject.value?.id.trim() ?? "";
  if (!ontologyIdentifier) {
    objectDeleteError.value = "缺少本体对象 id，无法删除。";
    return;
  }
  objectDeleteSubmitting.value = true;
  objectDeleteError.value = "";
  try {
    const response = await deleteOntologyObjectInterface({ ontologyIdentifier });
    if (response.code !== 200) throw new Error(response.message || "本体删除失败");
    objectDeleteVisible.value = false;
    deletingObject.value = null;
    ElMessage.success("本体删除成功");
    await load();
  } catch (cause) {
    objectDeleteError.value = cause instanceof Error && cause.message.trim() ? cause.message : "本体删除失败，请重试。";
  } finally {
    objectDeleteSubmitting.value = false;
  }
}

/**
 * @description 递归增加分类节点中的对象数量。
 * @param nodes 当前分类树节点。
 * @param categoryId 目标分类 id。
 * @returns 是否找到目标分类。
 */
function incrementCategoryCount(nodes: OntologyConceptNode[], categoryId: string): boolean {
  for (const node of nodes) {
    if ((node.targetCategoryId ?? node.id) === categoryId) {
      node.count += 1;
      return true;
    }
    if (incrementCategoryCount(node.children, categoryId)) return true;
  }
  return false;
}

/**
 * @description 保留原型的大模型构建入口，在当前项目尚未接入流程时给出明确反馈。
 */
function openOntologyLlmBuilder() {
  objectCreateVisible.value = false;
  ElMessage.info("大模型构建流程尚未接入。");
}

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
