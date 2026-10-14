import { computed, ref, type Ref } from "vue";
import { ElMessage } from "element-plus";
import {
  createOntologyObjectInterface,
  deleteOntologyObjectInterface,
  getExportOntologyInterface,
  postImportOntologiesInterface,
  updateOntologyObjectInterface,
} from "@/apis";
import type { OntologyExportType, OntologyObjectCreateDraft, OntologyObjectItem, OntologyObjectWorkspace } from "@/types";
import { downloadOntologyFile } from "../utils/downloadOntologyFile";
import { collectCategoryOptions } from "../utils/objectWorkspace";
import { resolveExportOntologyFileName } from "../utils/resolveExportOntologyFileName";

/**
 * @description 对象工作区本体对象交互：创建、导入、编辑、导出与删除。
 * @param options.spaceId 当前空间 id
 * @param options.workspace 当前工作区数据
 * @param options.load 成功后刷新分类树与对象列表
 * @param options.onOpenLlmBuilder 可选的大模型构建页面跳转回调
 * @returns 对象弹窗状态与操作方法
 */
export function useObjectWorkspaceObjectActions(options: {
  spaceId: Ref<string>;
  workspace: Ref<OntologyObjectWorkspace | undefined>;
  load: () => Promise<void>;
  onOpenLlmBuilder?: () => void;
}) {
  const { spaceId, workspace, load, onOpenLlmBuilder } = options;
  const objectCreateVisible = ref(false);
  const objectCreateSubmitting = ref(false);
  const objectCreateError = ref("");
  const editingObject = ref<OntologyObjectItem | null>(null);
  const objectDeleteVisible = ref(false);
  const objectDeleteSubmitting = ref(false);
  const objectDeleteError = ref("");
  const deletingObject = ref<OntologyObjectItem | null>(null);
  const objectExportVisible = ref(false);
  const objectExporting = ref(false);
  const objectExportError = ref("");
  const exportingObject = ref<OntologyObjectItem | null>(null);

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
   * @description 通过导入文件批量创建本体对象；成功后关闭弹窗、提示并刷新列表。
   * @param file 导入文件。
   */
  async function importOntologyObjects(file: File) {
    if (objectCreateSubmitting.value) return;
    objectCreateSubmitting.value = true;
    objectCreateError.value = "";
    try {
      const response = await postImportOntologiesInterface({ file });
      if (response.code !== 200) throw new Error(response.message || "导入失败，请重试。");
      objectCreateVisible.value = false;
      ElMessage.success("导入成功");
      await load();
    } catch (cause) {
      objectCreateError.value = cause instanceof Error && cause.message.trim() ? cause.message : "导入失败，请重试。";
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
        ...(draft.iconUrl ? { iconUrl: draft.iconUrl } : {}),
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

  /**
   * @description 打开本体对象导出确认弹窗；缺少标识时不打开。
   * @param item 待导出的本体对象。
   */
  function openOntologyObjectExportDialog(item: OntologyObjectItem) {
    if (objectExporting.value) return;
    if (!item.id.trim()) {
      ElMessage.error("缺少本体对象标识，无法导出。");
      return;
    }
    objectExportError.value = "";
    exportingObject.value = item;
    objectExportVisible.value = true;
  }

  /**
   * @description 确认导出当前本体对象，按所选类型下载接口返回的文件。
   * @param exportType 导出类型。SCHEMA 表示仅结构，INSTANCE 表示含实例数据。
   */
  async function confirmExportOntologyObject(exportType: OntologyExportType) {
    const item = exportingObject.value;
    if (!item || objectExporting.value) return;
    const uniqueIdentifier = item.id.trim();
    if (!uniqueIdentifier) {
      objectExportError.value = "缺少本体对象标识，无法导出。";
      return;
    }
    objectExporting.value = true;
    objectExportError.value = "";
    try {
      const file = await getExportOntologyInterface({ uniqueIdentifier, exportType });
      const fileName = resolveExportOntologyFileName({
        contentDisposition: file.contentDisposition,
        contentType: file.contentType,
        apiName: item.apiName,
        uniqueIdentifier,
      });
      downloadOntologyFile(fileName, file.blob);
      objectExportVisible.value = false;
      exportingObject.value = null;
      ElMessage.success("导出文件已生成");
    } catch (cause) {
      objectExportError.value = cause instanceof Error && cause.message.trim() ? cause.message : "导出失败，请重试。";
    } finally {
      objectExporting.value = false;
    }
  }

  /** @description 保留原型的大模型构建入口，在当前项目尚未接入流程时给出明确反馈。 */
  function openOntologyLlmBuilder() {
    objectCreateVisible.value = false;
    if (onOpenLlmBuilder) {
      onOpenLlmBuilder();
      return;
    }
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
    objectExportVisible,
    objectExporting,
    objectExportError,
    exportingObject,
    categoryOptions,
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
  };
}
