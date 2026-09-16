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
  save: (draft: OntologySpaceDraft, id?: string) => void;
  remove: (id: string) => void;
}

export function useSpaceManagementActions(options: SpaceManagementActionOptions) {
  const router = useRouter();
  const activeSpace = ref<OntologySpaceItem | null>(null);
  const formVisible = ref(false);
  const deleteVisible = ref(false);
  const exportVisible = ref(false);
  const actionStatus = ref<OntologySpaceCommandStatus>("idle");
  const actionError = ref("");
  const actionBusy = computed(() => actionStatus.value === "submitting");

  function resetCommandState() {
    actionStatus.value = "idle";
    actionError.value = "";
  }

  function openForm(space: OntologySpaceItem | null = null) {
    activeSpace.value = space;
    resetCommandState();
    formVisible.value = true;
  }

  function handleAction(action: OntologySpaceAction, space: OntologySpaceItem) {
    activeSpace.value = space;
    resetCommandState();
    if (action === "enter") {
      void router.push({ name: "OntologySpaceManagementDetailOverview", params: { spaceId: space.id } });
    } else if (action === "edit") {
      openForm(space);
    } else if (action === "delete") {
      deleteVisible.value = true;
    } else if (action === "export") {
      exportVisible.value = true;
    } else {
      ElMessage.info("子空间创建页面尚未接入。");
    }
  }

  function handleSave(draft: OntologySpaceDraft) {
    if (actionBusy.value) return;
    actionStatus.value = "submitting";
    actionError.value = "";
    try {
      options.save(draft, activeSpace.value?.id);
      formVisible.value = false;
      options.keyword.value = "";
      actionStatus.value = "success";
      ElMessage.success(activeSpace.value ? "空间已更新" : "空间已创建");
    } catch (cause) {
      actionStatus.value = "error";
      actionError.value = cause instanceof Error ? cause.message : "保存失败，请重试。";
    }
  }

  function confirmDelete() {
    if (!activeSpace.value || actionBusy.value) return;
    actionStatus.value = "submitting";
    actionError.value = "";
    try {
      options.remove(activeSpace.value.id);
      deleteVisible.value = false;
      actionStatus.value = "success";
      ElMessage.success("空间已删除");
    } catch (cause) {
      actionStatus.value = "error";
      actionError.value = cause instanceof Error ? cause.message : "删除失败，请重试。";
    }
  }

  function confirmExport() {
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
    openForm,
    handleAction,
    handleSave,
    confirmDelete,
    confirmExport,
  };
}
