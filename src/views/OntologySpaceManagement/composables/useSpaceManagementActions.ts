import { computed, ref, type Ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import type { OntologySpaceAction, OntologySpaceCommandStatus, OntologySpaceDraft, OntologySpaceItem } from "@/types";
import { createOntologySpaceInterface, deleteOntologySpaceInterface, updateOntologySpaceInterface } from "@/apis";
import { downloadSpaceJson } from "../utils/downloadSpaceJson";
import { serializeSpace } from "../utils/spaceOperations";

interface SpaceManagementActionOptions {
  keyword: Ref<string>;
  saveOntologySpace: (draft: OntologySpaceDraft, id?: string) => void;
  removeOntologySpace: (id: string) => void;
  loadOntologySpaces: () => Promise<void> | void;
}

/**
 * @description 编排本体空间页的进入、表单、删除与导出等命令操作。
 * @param options 关键词与空间增删回调。
 * @returns 弹窗状态与命令处理方法。
 */
export function useSpaceManagementActions(options: SpaceManagementActionOptions) {
  const router = useRouter();
  const activeSpace = ref<OntologySpaceItem | null>(null);
  const formVisible = ref(false);
  const deleteVisible = ref(false);
  const exportVisible = ref(false);
  const actionStatus = ref<OntologySpaceCommandStatus>("idle");
  const actionError = ref("");
  const actionBusy = computed(() => actionStatus.value === "submitting");

  /**
   * @description 重置命令操作状态为 idle，并清空错误信息。
   */
  function resetOntologySpaceCommandState() {
    actionStatus.value = "idle";
    actionError.value = "";
  }

  /**
   * @description 打开新建或编辑本体空间表单；传入 space 为编辑，缺省为新建。
   * @param space 待编辑空间；新建时传 null。
   */
  function openOntologySpaceForm(space: OntologySpaceItem | null = null) {
    activeSpace.value = space;
    resetOntologySpaceCommandState();
    formVisible.value = true;
  }

  /**
   * @description 处理空间列表行操作：进入、编辑、删除、导出或子空间提示。
   * @param action 操作类型。
   * @param space 目标空间。
   */
  function handleOntologySpaceAction(action: OntologySpaceAction, space: OntologySpaceItem) {
    activeSpace.value = space;
    resetOntologySpaceCommandState();
    if (action === "enter") {
      void router.push({ name: "OntologySpaceManagementDetailOverview", params: { spaceId: space.id } });
    } else if (action === "edit") {
      openOntologySpaceForm(space);
    } else if (action === "delete") {
      deleteVisible.value = true;
    } else if (action === "export") {
      exportVisible.value = true;
    } else {
      ElMessage.info("子空间创建页面尚未接入。");
    }
  }

  /**
   * @description 提交本体空间表单草稿：新建走创建接口，编辑走编辑接口；失败时保留弹窗并展示错误。
   * @param draft 表单草稿。
   */
  async function submitOntologySpaceForm(draft: OntologySpaceDraft) {
    if (actionBusy.value) return;
    actionStatus.value = "submitting";
    actionError.value = "";
    if (activeSpace.value == null) {
      try {
        const response = await createOntologySpaceInterface({
          displayName: draft.displayName,
          apiName: draft.apiName,
          icon: draft.iconUrl,
          description: draft.description,
        });
        if (response.code === 200) {
          formVisible.value = false;
          actionError.value = "";
          actionStatus.value = "success";
          ElMessage.success("创建成功");
          await options.loadOntologySpaces();
          options.keyword.value = "";
          return;
        }
        actionStatus.value = "error";
        actionError.value = response.message;
      } catch (cause) {
        actionStatus.value = "error";
        actionError.value = cause instanceof Error ? cause.message : "创建失败，请重试。";
      }
      return;
    }
    try {
      const response = await updateOntologySpaceInterface({
        spaceId: Number(activeSpace.value!.id),
        displayName: draft.displayName,
        icon: draft.iconUrl,
        description: draft.description,
      });
      if (response.code === 200) {
        formVisible.value = false;
        actionError.value = "";
        actionStatus.value = "success";
        ElMessage.success("更新成功");
        await options.loadOntologySpaces();
        options.keyword.value = "";
        return;
      }
      actionStatus.value = "error";
      actionError.value = response.message;
    } catch (cause) {
      actionStatus.value = "error";
      actionError.value = cause instanceof Error ? cause.message : "更新失败，请重试。";
    }
  }

  /**
   * @description 确认删除当前选中的本体空间。
   */
  async function confirmDeleteOntologySpace() {
    if (!activeSpace.value || actionBusy.value) return;
    actionStatus.value = "submitting";
    actionError.value = "";
    try {
      const response = await deleteOntologySpaceInterface({ spaceId: Number(activeSpace.value.id) });
      if (response.code === 200) {
        deleteVisible.value = false;
        actionError.value = "";
        actionStatus.value = "success";
        ElMessage.success("删除成功");
        await options.loadOntologySpaces();
        return;
      }
      actionStatus.value = "error";
      actionError.value = response.message;
    } catch (cause) {
      actionStatus.value = "error";
      actionError.value = cause instanceof Error ? cause.message : "删除失败，请重试。";
    }
  }

  /**
   * @description 确认导出当前选中本体空间的 JSON 文件。
   */
  function confirmExportOntologySpace() {
    if (!activeSpace.value || actionBusy.value) return;
    actionStatus.value = "submitting";
    actionError.value = "";
    try {
      downloadSpaceJson(`${activeSpace.value.apiName}.json`, serializeSpace(activeSpace.value));
      exportVisible.value = false;
      actionStatus.value = "success";
      ElMessage.success("导出文件已生成");
    } catch {
      actionStatus.value = "error";
      actionError.value = "导出失败，请重试。";
    }
  }

  return {
    activeSpace,
    formVisible,
    deleteVisible,
    exportVisible,
    actionBusy,
    actionError,
    openOntologySpaceForm,
    handleOntologySpaceAction,
    submitOntologySpaceForm,
    confirmDeleteOntologySpace,
    confirmExportOntologySpace,
  };
}
