import { computed, ref, type Ref } from "vue";
import { ElMessage } from "element-plus";
import { createOntologyObjectInterface, deleteOntologyObjectInterface, updateOntologyObjectInterface } from "@/apis";
import type { OntologyObjectCreateDraft, OntologyObjectItem, OntologyObjectWorkspace } from "@/types";
import { collectCategoryOptions, incrementCategoryCount } from "../utils/objectWorkspace";

/**
 * @description 对象工作区本体对象弹窗交互：创建、导入、编辑与删除。
 * @param options.spaceId 当前空间 id
 * @param options.workspace 当前工作区数据
 * @param options.load 成功后刷新分类树与对象列表
 * @returns 对象弹窗状态与操作方法
 */
export function useObjectWorkspaceObjectActions(options: {
  spaceId: Ref<string>;
  workspace: Ref<OntologyObjectWorkspace | undefined>;
  load: () => Promise<void>;
}) {
  const { spaceId, workspace, load } = options;
  const objectCreateVisible = ref(false);
  const objectCreateSubmitting = ref(false);
  const objectCreateError = ref("");
  const editingObject = ref<OntologyObjectItem | null>(null);
  const objectDeleteVisible = ref(false);
  const objectDeleteSubmitting = ref(false);
  const objectDeleteError = ref("");
  const deletingObject = ref<OntologyObjectItem | null>(null);

  const categoryOptions = computed(() => collectCategoryOptions(workspace.value?.tree ?? []));
  const parentOptions = computed(() => (workspace.value?.sections ?? []).flatMap((section) => section.items));

  /** @description 打开本体对象创建弹框并清理上次提交错误。 */
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
    if (!Number.isInteger(numericSpaceId) || !Number.isInteger(numericCategoryId)) {
      objectCreateError.value = "缺少有效的空间或分类 id，无法创建本体。";
      return;
    }
    const parentOntologyUniqueIdentifier = draft.parentId?.trim();
    if (draft.parentId !== undefined && !parentOntologyUniqueIdentifier) {
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
        ...(parentOntologyUniqueIdentifier ? { parentOntologyUniqueIdentifier } : {}),
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
        groupIds: [null],
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

  /** @description 调用本体对象删除接口；成功后关闭确认弹框、提示并刷新分类树列表。 */
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

  /** @description 保留原型的大模型构建入口，在当前项目尚未接入流程时给出明确反馈。 */
  function openOntologyLlmBuilder() {
    objectCreateVisible.value = false;
    ElMessage.info("大模型构建流程尚未接入。");
  }

  return {
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
  };
}
