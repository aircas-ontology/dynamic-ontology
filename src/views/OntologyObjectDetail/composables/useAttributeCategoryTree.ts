import { computed, ref, type Ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRoute } from "vue-router";
import {
  createOntologyObjectArrTypeTreeInterface,
  deleteOntologyObjectArrTypeTreeInterface,
  getOntologyObjectArrTypeTreeInterface,
  updateOntologyObjectArrTypeTreeInterface,
} from "@/apis";
import type { OntologyAttributeCategoryNode, OntologyAttributeTreeNode } from "@/types";
import { filterCategoryNode, findCategory, findCategoryParent, mapCategoryTreeNode } from "../utils/attributePanelHelpers";

/**
 * @description 属性分类树状态与交互：加载分类、搜索过滤、创建/编辑/删除分类弹窗。
 * @param options.selectedCategoryId 当前选中的分类 id（与属性列表共享）
 * @param options.attributes 当前属性列表，用于叶子节点数量统计
 * @param options.onCategorySelected 选中分类后的回调（通常用于刷新属性列表）
 * @returns 分类树模板所需状态与操作方法
 */
export function useAttributeCategoryTree(options: { selectedCategoryId: Ref<string>; onCategorySelected: () => void; onCategoryChanged: () => void }) {
  const { selectedCategoryId, onCategorySelected, onCategoryChanged } = options;
  const route = useRoute();
  const categories = ref<OntologyAttributeCategoryNode[]>([]);
  const treeProps = { children: "children", label: "label" };
  const categorySearch = ref("");
  const categoryTreeLoading = ref(false);
  const categoryTreeError = ref("");
  const categoryTreeEmpty = ref(false);
  const categoryDialogVisible = ref(false);
  const categorySubmitting = ref(false);
  const categoryError = ref("");
  const categoryEditDialogVisible = ref(false);
  const categoryEditSubmitting = ref(false);
  const categoryEditError = ref("");
  const categoryEditId = ref("");
  const categoryEditName = ref("");
  const categoryName = ref("");
  const categoryParentId = ref("all");
  const categoryParentName = ref("无");
  const selectedCategoryName = computed(() => findCategory(categories.value, selectedCategoryId.value)?.label ?? "全部属性");

  /** @description 查询当前本体对象的属性分类树并更新左侧分类状态。 */
  async function loadAttributeCategoryTree() {
    const ontologyUniqueIdentifier = String(route.params.objectId || "").trim();
    if (!ontologyUniqueIdentifier) {
      categoryTreeError.value = "缺少本体对象标识，无法加载属性分类。";
      return;
    }
    categoryTreeLoading.value = true;
    categoryTreeError.value = "";
    categoryTreeEmpty.value = false;
    try {
      const response = await getOntologyObjectArrTypeTreeInterface({ ontologyUniqueIdentifier });
      if (response.code !== 200) throw new Error(response.message || "属性分类查询失败");
      if (!response.data) {
        categories.value = [];
        selectedCategoryId.value = "all";
        categoryTreeEmpty.value = true;
        onCategoryChanged();
        return;
      }
      const root = mapCategoryTreeNode(response.data);
      categories.value = [root];
      onCategoryChanged();
    } catch (cause) {
      categoryTreeError.value = cause instanceof Error && cause.message.trim() ? cause.message : "属性分类查询失败，请重试。";
      ElMessage.error(categoryTreeError.value);
    } finally {
      categoryTreeLoading.value = false;
    }
  }

  /**
   * @description 选中属性分类并通知属性列表刷新。
   * @param data 被选中的分类节点
   */
  function selectCategory(data: OntologyAttributeTreeNode) {
    if (data.nodeType !== "category") return;
    selectedCategoryId.value = data.id;
    onCategorySelected();
  }

  /**
   * @description 打开分类编辑弹窗并回显父分类和当前名称。
   * @param data 待编辑分类
   */
  function openCategoryEdit(data: OntologyAttributeCategoryNode) {
    categoryEditId.value = data.id;
    categoryEditName.value = data.label;
    categoryParentName.value = findCategoryParent(categories.value, data.id)?.label ?? "无";
    categoryEditError.value = "";
    categoryEditDialogVisible.value = true;
  }

  /** @description 校验并调用编辑接口保存分类名称。 */
  async function saveCategoryEdit() {
    const name = categoryEditName.value.trim();
    if (!name) {
      categoryEditError.value = "请输入分类名称";
      return;
    }
    const ontologyIdentifier = String(route.params.objectId || "").trim();
    const categoryId = Number(categoryEditId.value);
    if (!ontologyIdentifier || !Number.isFinite(categoryId)) {
      categoryEditError.value = "缺少分类标识，无法编辑分类。";
      return;
    }
    categoryEditSubmitting.value = true;
    categoryEditError.value = "";
    try {
      const response = await updateOntologyObjectArrTypeTreeInterface({ ontologyIdentifier, categoryId, name });
      if (response.code !== 200) throw new Error(response.message || "属性分类编辑失败");
      categoryEditDialogVisible.value = false;
      ElMessage.success("属性分类编辑成功");
      await loadAttributeCategoryTree();
    } catch (cause) {
      categoryEditError.value = cause instanceof Error && cause.message.trim() ? cause.message : "属性分类编辑失败，请重试。";
      ElMessage.error(categoryEditError.value);
    } finally {
      categoryEditSubmitting.value = false;
    }
  }

  /**
   * @description 打开属性子分类创建弹窗。
   * @param parent 父分类节点
   */
  function openCategoryCreate(parent: OntologyAttributeCategoryNode) {
    categoryParentId.value = parent.id;
    categoryParentName.value = parent.label;
    categoryName.value = "";
    categoryError.value = "";
    categoryDialogVisible.value = true;
  }

  /** @description 打开根属性分类创建弹窗。 */
  function openRootCategoryCreate() {
    categoryParentId.value = "0";
    categoryParentName.value = "无";
    categoryName.value = "";
    categoryError.value = "";
    categoryDialogVisible.value = true;
  }

  /** @description 校验并通过接口保存属性分类表单。 */
  async function saveCategoryDraft() {
    const name = categoryName.value.trim();
    if (!name) {
      categoryError.value = "请输入分类名称";
      return;
    }
    const ontologyUniqueIdentifier = String(route.params.objectId || "").trim();
    if (!ontologyUniqueIdentifier) {
      categoryError.value = "缺少本体对象标识，无法创建分类。";
      return;
    }
    categorySubmitting.value = true;
    categoryError.value = "";
    try {
      const response = await createOntologyObjectArrTypeTreeInterface({
        ontologyIdentifier: ontologyUniqueIdentifier,
        parentId: Number(categoryParentId.value) || 0,
        name,
      });
      if (response.code !== 200) throw new Error(response.message || "属性分类创建失败");
      categoryDialogVisible.value = false;
      ElMessage.success("属性分类创建成功");
      await loadAttributeCategoryTree();
    } catch (cause) {
      categoryError.value = cause instanceof Error && cause.message.trim() ? cause.message : "属性分类创建失败，请重试。";
      ElMessage.error(categoryError.value);
    } finally {
      categorySubmitting.value = false;
    }
  }

  /**
   * @description 删除属性分类并提示结果。
   * @param data 待删除分类
   */
  async function removeCategory(data: OntologyAttributeCategoryNode) {
    if (data.isRoot) return;
    try {
      await ElMessageBox.confirm(`确认删除属性分类「${data.label}」吗？`, "删除属性分类", { type: "warning" });
      const ontologyIdentifier = String(route.params.objectId || "").trim();
      const categoryId = Number(data.id);
      if (!ontologyIdentifier || !Number.isFinite(categoryId)) throw new Error("缺少分类标识，无法删除分类。");
      const response = await deleteOntologyObjectArrTypeTreeInterface({ ontologyIdentifier, categoryId });
      if (response.code !== 200) throw new Error(response.message || "属性分类删除失败");
      ElMessage.success("属性分类删除成功");
      await loadAttributeCategoryTree();
    } catch (cause) {
      if (cause instanceof Error && cause.message.trim()) ElMessage.error(cause.message);
    }
  }

  return {
    categories,
    treeProps,
    categorySearch,
    categoryTreeLoading,
    categoryTreeError,
    categoryTreeEmpty,
    categoryDialogVisible,
    categorySubmitting,
    categoryError,
    categoryEditDialogVisible,
    categoryEditSubmitting,
    categoryEditError,
    categoryEditName,
    categoryName,
    categoryParentName,
    selectedCategoryName,
    filterCategoryNode,
    loadAttributeCategoryTree,
    selectCategory,
    openCategoryEdit,
    saveCategoryEdit,
    openCategoryCreate,
    openRootCategoryCreate,
    saveCategoryDraft,
    removeCategory,
  };
}
