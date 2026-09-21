import { computed, reactive, ref, type Ref } from "vue";
import { ElMessage, ElMessageBox, type FormRules } from "element-plus";
import { useRoute } from "vue-router";
import {
  createOntologyPropertyInterface,
  deleteOntologyPropertyInterface,
  getOntologyPropertyByCategoryIdInterface,
  getOntologyPropertyByOntologyIdInterface,
  updateOntologyPropertyInterface,
} from "@/apis";
import type {
  CreateOntologyPropertyParams,
  OntologyAttributeCategoryNode,
  OntologyAttributeDraft,
  OntologyAttributeItem,
  OntologyAttributeStorageGroupOption,
  UpdateOntologyPropertyParams,
} from "@/types";
import { flattenCategoryOptions, isAttributeItem, mapOntologyPropertyItem, normalizeStorageGroupValue } from "../utils/attributePanelHelpers";

/**
 * @description 属性列表状态与交互：按分类加载属性、搜索、新增/编辑表单与删除。
 * @param options.selectedCategoryId 当前选中的分类 id
 * @param options.getCategories 读取分类树，用于属性表单分类下拉
 * @returns 属性列表模板所需状态与操作方法
 */
export function useAttributePropertyList(options: { selectedCategoryId: Ref<string>; getCategories: () => OntologyAttributeCategoryNode[] }) {
  const { selectedCategoryId, getCategories } = options;
  const route = useRoute();
  const dataTypes = ["String", "整数", "小数", "日期", "布尔"];
  const storageGroups: OntologyAttributeStorageGroupOption[] = [{ label: "主存储", value: "main" }];
  const attributes = ref<OntologyAttributeItem[]>([]);
  const attributeLoading = ref(false);
  const attributeError = ref("");
  const attributeCommandError = ref("");
  let attributesRequestId = 0;
  const attributeSearch = ref("");
  const attributeDialogVisible = ref(false);
  const savingAttribute = ref(false);
  const editingAttributeId = ref<string | null>(null);
  const draft = reactive<OntologyAttributeDraft>({
    displayName: "",
    apiName: "",
    categoryId: "",
    dataType: "String",
    storageGroup: "main",
    defaultValue: "",
    description: "",
    isPrimary: false,
    isNameKey: false,
  });
  const attributeRules: FormRules<OntologyAttributeDraft> = {
    displayName: [{ required: true, message: "请输入属性名称", trigger: "blur" }],
    apiName: [{ required: true, message: "请输入 API 名称", trigger: "blur" }],
    categoryId: [{ required: true, message: "请选择属性分类", trigger: "change" }],
    dataType: [{ required: true, message: "请选择数据类型", trigger: "change" }],
    storageGroup: [{ required: true, message: "请选择存储分组", trigger: "change" }],
  };
  const visibleAttributes = computed(() =>
    attributes.value.filter((item) => {
      const keyword = attributeSearch.value.trim().toLowerCase();
      return !keyword || `${item.displayName} ${item.apiName} ${item.description}`.toLowerCase().includes(keyword);
    }),
  );
  const categoryOptions = computed(() => flattenCategoryOptions(getCategories()));

  /** @description 查询当前选中范围的本体对象属性并更新列表。 */
  async function loadAttributesForSelection() {
    const ontologyUniqueIdentifier = String(route.params.objectId || "").trim();
    if (!ontologyUniqueIdentifier) {
      attributeError.value = "缺少本体对象标识，无法加载属性。";
      return;
    }
    const requestId = ++attributesRequestId;
    attributeLoading.value = true;
    attributeError.value = "";
    try {
      const response =
        selectedCategoryId.value === "all"
          ? await getOntologyPropertyByOntologyIdInterface({ ontologyUniqueIdentifier })
          : await getOntologyPropertyByCategoryIdInterface({ categoryId: Number(selectedCategoryId.value) });
      if (response.code !== 200) throw new Error(response.message || "属性查询失败");
      if (requestId === attributesRequestId) attributes.value = (response.data ?? []).map((item) => mapOntologyPropertyItem(item, ontologyUniqueIdentifier));
    } catch (cause) {
      if (requestId !== attributesRequestId) return;
      attributeError.value = cause instanceof Error && cause.message.trim() ? cause.message : "属性查询失败，请重试。";
      attributes.value = [];
      ElMessage.error(attributeError.value);
    } finally {
      if (requestId === attributesRequestId) attributeLoading.value = false;
    }
  }

  /** @description 打开数据源关联入口。 */
  function openDataSource() {
    ElMessage.info("数据源关联入口已准备");
  }

  /** @description 将表单分类标识转换为接口需要的数字。 */
  function getDraftCategoryId(): number | undefined {
    const categoryId = Number(draft.categoryId);
    return Number.isFinite(categoryId) && categoryId > 0 ? categoryId : undefined;
  }

  /**
   * @description 组装创建属性接口请求参数，补齐页面未展示的字段。
   * @param ontologyIdentifier 本体对象标识
   * @returns 创建属性请求参数
   */
  function buildCreatePropertyParams(ontologyIdentifier: string): CreateOntologyPropertyParams {
    const categoryId = getDraftCategoryId();
    return {
      ontologyIdentifier,
      schemaName: "",
      datasourceId: "",
      datasourceColumnName: "",
      dataType: draft.dataType,
      description: draft.description,
      displayName: draft.displayName,
      apiName: draft.apiName,
      isPrimaryKey: draft.isPrimary,
      isTitleKey: draft.isNameKey,
      defaultValue: draft.defaultValue,
      storageGroup: draft.storageGroup,
      ...(categoryId === undefined ? {} : { categoryId }),
    };
  }

  /**
   * @description 组装编辑属性接口请求参数，补齐页面未展示的字段。
   * @param uniqueIdentifier 属性唯一标识
   * @returns 编辑属性请求参数
   */
  function buildUpdatePropertyParams(uniqueIdentifier: string): UpdateOntologyPropertyParams {
    const categoryId = getDraftCategoryId();
    return {
      uniqueIdentifier,
      datasource: {},
      schemaName: "",
      datasourceId: "",
      datasourceColumnName: "",
      displayName: draft.displayName,
      dataType: draft.dataType,
      description: draft.description,
      isTitleKey: draft.isNameKey,
      isPrimaryKey: draft.isPrimary,
      defaultValue: draft.defaultValue,
      storageGroup: draft.storageGroup,
      ...(categoryId === undefined ? {} : { categoryId }),
      metadata: {},
    };
  }

  /** @description 重置属性表单草稿。 */
  function resetDraft() {
    Object.assign(draft, {
      displayName: "",
      apiName: "",
      categoryId: selectedCategoryId.value === "all" ? "" : selectedCategoryId.value,
      dataType: "String",
      storageGroup: "main",
      defaultValue: "",
      description: "",
      isPrimary: false,
      isNameKey: false,
    });
    attributeCommandError.value = "";
  }

  /** @description 打开新增属性表单。 */
  function openCreateAttribute() {
    editingAttributeId.value = null;
    resetDraft();
    attributeDialogVisible.value = true;
  }

  /**
   * @description 打开属性编辑表单并回显当前数据。
   * @param value 表格行数据
   */
  function openEditAttribute(value: unknown) {
    if (!isAttributeItem(value)) return;
    const item = value;
    editingAttributeId.value = item.uniqueIdentifier;
    Object.assign(draft, {
      displayName: item.displayName,
      apiName: item.apiName,
      categoryId: item.categoryId,
      dataType: item.dataType,
      storageGroup: normalizeStorageGroupValue(item.storageGroup),
      defaultValue: item.defaultValue,
      description: item.description,
      isPrimary: item.isPrimary,
      isNameKey: item.isNameKey,
    });
    attributeCommandError.value = "";
    attributeDialogVisible.value = true;
  }

  /** @description 保存新增或编辑后的属性草稿。 */
  async function saveAttributeDraft() {
    if (savingAttribute.value) return;
    const ontologyIdentifier = String(route.params.objectId || "").trim();
    if (!ontologyIdentifier) {
      attributeCommandError.value = "缺少本体对象标识，无法保存属性。";
      return;
    }
    savingAttribute.value = true;
    attributeCommandError.value = "";
    try {
      if (editingAttributeId.value === null) {
        const response = await createOntologyPropertyInterface(buildCreatePropertyParams(ontologyIdentifier));
        if (response.code !== 200) throw new Error(response.message || "属性创建失败");
        ElMessage.success("属性添加成功");
      } else {
        const response = await updateOntologyPropertyInterface(buildUpdatePropertyParams(editingAttributeId.value));
        if (response.code !== 200) throw new Error(response.message || "属性编辑失败");
        ElMessage.success("属性编辑成功");
      }
      attributeDialogVisible.value = false;
      await loadAttributesForSelection();
    } catch (cause) {
      attributeCommandError.value = cause instanceof Error && cause.message.trim() ? cause.message : "属性保存失败，请重试。";
      ElMessage.error(attributeCommandError.value);
    } finally {
      savingAttribute.value = false;
    }
  }

  /**
   * @description 删除属性并刷新当前列表。
   * @param value 表格行数据
   */
  async function removeAttribute(value: unknown) {
    if (!isAttributeItem(value)) return;
    const item = value;
    try {
      await ElMessageBox.confirm(`确认删除属性「${item.apiName || item.displayName}」吗？此操作不可恢复。`, "删除属性", { type: "warning" });
    } catch {
      return;
    }
    try {
      const response = await deleteOntologyPropertyInterface({ propertyUniqueIdentifier: item.uniqueIdentifier });
      if (response.code !== 200) throw new Error(response.message || "属性删除失败");
      ElMessage.success("属性删除成功");
      await loadAttributesForSelection();
    } catch (cause) {
      const message = cause instanceof Error && cause.message.trim() ? cause.message : "属性删除失败，请重试。";
      ElMessage.error(message);
    }
  }

  return {
    dataTypes,
    storageGroups,
    attributes,
    attributeLoading,
    attributeError,
    attributeCommandError,
    attributeSearch,
    attributeDialogVisible,
    savingAttribute,
    editingAttributeId,
    draft,
    attributeRules,
    visibleAttributes,
    categoryOptions,
    loadAttributesForSelection,
    openDataSource,
    openCreateAttribute,
    openEditAttribute,
    saveAttributeDraft,
    removeAttribute,
  };
}
