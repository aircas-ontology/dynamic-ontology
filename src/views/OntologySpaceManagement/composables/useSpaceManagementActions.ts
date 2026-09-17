import { computed, ref, type Ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import type {
  OntologySpaceAction,
  OntologySpaceCommandStatus,
  OntologySpaceDraft,
  OntologySpaceItem,
} from "@/types";
import { downloadSpaceJson } from "../utils/downloadSpaceJson";
import { serializeSpace } from "../utils/spaceOperations";

interface SpaceManagementActionOptions {
  keyword: Ref<string>;
  saveOntologySpace: (draft: OntologySpaceDraft, id?: string) => void;
  removeOntologySpace: (id: string) => void;
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
   * @description 提交本体空间表单草稿并关闭弹窗；失败时写入错误状态。
   * @param draft 表单草稿。
   */
  function submitOntologySpaceForm(draft: OntologySpaceDraft) {
    if (actionBusy.value) return;
    actionStatus.value = "submitting";
    actionError.value = "";
    try {
      options.saveOntologySpace(draft, activeSpace.value?.id);
      formVisible.value = false;
      options.keyword.value = "";
      actionStatus.value = "success";
      ElMessage.success(activeSpace.value ? "空间已更新" : "空间已创建");
    } catch (cause) {
      actionStatus.value = "error";
      actionError.value = cause instanceof Error ? cause.message : "保存失败，请重试。";
    }
  }

  /**
   * @description 确认删除当前选中的本体空间。
   */
  function confirmDeleteOntologySpace() {
    if (!activeSpace.value || actionBusy.value) return;
    actionStatus.value = "submitting";
    actionError.value = "";
    try {
      options.removeOntologySpace(activeSpace.value.id);
      deleteVisible.value = false;
      actionStatus.value = "success";
      ElMessage.success("空间已删除");
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
