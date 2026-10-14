import { ref, type Ref } from "vue";
import { ElMessage } from "element-plus";
import { deleteOntologyCategoryTreeInterface, postCreateOntologyCategoryTreeInterface, putUpdateOntologyCategoryNameInterface } from "@/apis";

/**
 * @description 对象工作区分类树弹窗交互：创建主分类、子分类、改名与删除。
 * @param options.spaceId 当前空间 id
 * @param options.load 成功后刷新分类树与对象列表
 * @returns 分类弹窗状态与操作方法
 */
export function useObjectWorkspaceCategoryActions(options: { spaceId: Ref<string>; load: () => Promise<void> }) {
  const { spaceId, load } = options;
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

  /** @description 打开添加分类树弹框，供输入主分类名称。 */
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

  /** @description 以当前空间 id 和分类 id 调用删除分类接口；成功后关闭确认框并重新加载分类树。 */
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

  return {
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
  };
}
