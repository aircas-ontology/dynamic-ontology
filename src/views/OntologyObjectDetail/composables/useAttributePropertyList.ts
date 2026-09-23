import { computed, reactive, ref, type Ref } from "vue";
import { ElMessage, ElMessageBox, type FormRules } from "element-plus";
import { useRoute } from "vue-router";
import { createOntologyPropertyInterface, deleteOntologyPropertyInterface, updateOntologyPropertyInterface } from "@/apis";
import type {
  CreateOntologyPropertyParams,
  OntologyAttributeCategoryNode,
  OntologyAttributeDraft,
  OntologyAttributeItem,
  OntologyAttributeStorageGroupOption,
  UpdateOntologyPropertyParams,
} from "@/types";
import {
  collectPropertyItemsFromTree,
  findConflictingAttributeKey,
  flattenCategoryOptions,
  findCategory,
  formatAttributeKeyConflictMessage,
  isAttributeItem,
  mapOntologyPropertyItem,
  normalizeStorageGroupValue,
  parseAttributeCategoryId,
  resolveAttributeFormCategoryId,
  type AttributeKeyKind,
} from "../utils/attributePanelHelpers";

/**
 * @description 属性列表状态与交互：从分类树读取属性、新增/编辑表单与删除。
 * @param options.selectedCategoryId 当前选中的分类 id
 * @param options.getCategories 读取包含属性节点的分类树
 * @param options.onPropertyChanged 属性命令成功后的刷新回调
 * @returns 属性列表模板所需状态与操作方法
 */
export function useAttributePropertyList(options: {
  selectedCategoryId: Ref<string>;
  getCategories: () => OntologyAttributeCategoryNode[];
  onPropertyChanged: () => Promise<void> | void;
}) {
  const { selectedCategoryId, getCategories, onPropertyChanged } = options;
  const route = useRoute();
  const dataTypes = [
    "Boolean",
    "Integer",
    "Long",
    "Float",
    "Short",
    "Byte",
    "Double",
    "Decimal",
    "String",
    "Date",
    "Array",
    "Map",
    "Vector",
    "Timestamp",
    "MediaReference",
    "TimeSeries",
    "Attachment",
    "Geohash",
    "Geoshape",
    "Cipher",
    "Ontology",
  ];
  const storageGroupPattern = /^[A-Za-z0-9_]+$/;
  const attributes = ref<OntologyAttributeItem[]>([]);
  const attributeLoading = ref(false);
  const attributeError = ref("");
  const attributeCommandError = ref("");
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
    dataType: [{ required: true, message: "请选择数据类型", trigger: "change" }],
    categoryId: [{ required: true, message: "请选择属性分类", trigger: "change" }],
    storageGroup: [
      { required: true, message: "请输入存储分组", trigger: ["blur", "change"] },
      { pattern: storageGroupPattern, message: "存储分组只能包含字母、数字和下划线", trigger: ["blur", "change"] },
    ],
  };
  const visibleAttributes = computed(() => {
    const keyword = attributeSearch.value.trim().toLowerCase();
    return attributes.value.filter((item) => !keyword || `${item.displayName} ${item.apiName} ${item.description}`.toLowerCase().includes(keyword));
  });
  const categoryOptions = computed(() => flattenCategoryOptions(getCategories()));

  /**
   * @description 从当前本体对象的全部属性中提取非空存储分组并去重，同时保留新增属性默认使用的 main 选项。
   * @returns 存储分组下拉选项
   */
  function getStorageGroupOptions(): OntologyAttributeStorageGroupOption[] {
    const ontologyUniqueIdentifier = String(route.params.objectId || "").trim();
    const propertyStorageGroups = collectPropertyItemsFromTree(getCategories(), ontologyUniqueIdentifier)
      .map((item) => normalizeStorageGroupValue(item.storageGroup).trim())
      .filter((value) => storageGroupPattern.test(value));
    return [...new Set(["main", ...propertyStorageGroups])].map((value) => ({
      label: value,
      value,
    }));
  }

  const storageGroups = computed<OntologyAttributeStorageGroupOption[]>(getStorageGroupOptions);

  /** @description 根据当前分类选择从树节点递归提取属性。 */
  async function loadAttributesForSelection() {
    const ontologyUniqueIdentifier = String(route.params.objectId || "").trim();
    if (!ontologyUniqueIdentifier) {
      attributeError.value = "缺少本体对象标识，无法加载属性。";
      return;
    }
    attributeLoading.value = true;
    attributeError.value = "";
    try {
      const categories = getCategories();
      const selectedCategory = selectedCategoryId.value === "all" ? undefined : findCategory(categories, selectedCategoryId.value);
      const source = selectedCategoryId.value === "all" ? categories : selectedCategory ? [selectedCategory] : [];
      attributes.value = collectPropertyItemsFromTree(source, ontologyUniqueIdentifier);
    } catch (cause) {
      attributeError.value = cause instanceof Error && cause.message.trim() ? cause.message : "属性查询失败，请重试。";
      attributes.value = [];
      ElMessage.error(attributeError.value);
    } finally {
      attributeLoading.value = false;
    }
  }

  /** @description 将表单分类标识转换为接口需要的数字。 */
  function getDraftCategoryId(): number | undefined {
    return parseAttributeCategoryId(draft.categoryId);
  }

  /** @description 组装创建属性接口请求参数。 */
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

  /** @description 组装编辑属性接口请求参数，仅提交页面字段和唯一标识。 */
  function buildUpdatePropertyParams(uniqueIdentifier: string): UpdateOntologyPropertyParams {
    const categoryId = getDraftCategoryId();
    return {
      uniqueIdentifier,
      displayName: draft.displayName,
      apiName: draft.apiName,
      dataType: draft.dataType,
      description: draft.description,
      isTitleKey: draft.isNameKey,
      isPrimaryKey: draft.isPrimary,
      defaultValue: draft.defaultValue,
      storageGroup: draft.storageGroup,
      ...(categoryId === undefined ? {} : { categoryId }),
    };
  }

  /** @description 重置属性表单草稿。 */
  function resetDraft() {
    Object.assign(draft, {
      displayName: "",
      apiName: "",
      categoryId: resolveAttributeFormCategoryId(getCategories()),
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

  /** @description 打开属性编辑表单并回显当前数据。 */
  function openEditAttribute(value: unknown) {
    if (!isAttributeItem(value)) return;
    editingAttributeId.value = value.uniqueIdentifier;
    Object.assign(draft, {
      displayName: value.displayName,
      apiName: value.apiName,
      categoryId: resolveAttributeFormCategoryId(getCategories(), value.categoryId),
      dataType: value.dataType,
      storageGroup: normalizeStorageGroupValue(value.storageGroup),
      defaultValue: value.defaultValue,
      description: value.description,
      isPrimary: value.isPrimary,
      isNameKey: value.isNameKey,
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
    if (draft.isPrimary && rejectDuplicateAttributeKey("primary")) return;
    if (draft.isNameKey && rejectDuplicateAttributeKey("name")) return;
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
      await onPropertyChanged();
    } catch (cause) {
      attributeCommandError.value = cause instanceof Error && cause.message.trim() ? cause.message : "属性保存失败，请重试。";
      ElMessage.error(attributeCommandError.value);
    } finally {
      savingAttribute.value = false;
    }
  }

  /** @description 删除属性并刷新当前分类树和列表。 */
  async function removeAttribute(value: unknown) {
    if (!isAttributeItem(value)) return;
    try {
      await ElMessageBox.confirm(`确认删除属性「${value.apiName || value.displayName}」吗？此操作不可恢复。`, "删除属性", { type: "warning" });
    } catch {
      return;
    }
    try {
      const response = await deleteOntologyPropertyInterface({ propertyUniqueIdentifier: value.uniqueIdentifier });
      if (response.code !== 200) throw new Error(response.message || "属性删除失败");
      ElMessage.success("属性删除成功");
      await onPropertyChanged();
    } catch (cause) {
      ElMessage.error(cause instanceof Error && cause.message.trim() ? cause.message : "属性删除失败，请重试。");
    }
  }

  /**
   * @description 判断当前对象是否已有其他属性占用主键或名称键。
   * @param kind 要设置的键类型。
   * @returns 已存在冲突并已提示时返回 true。
   */
  function rejectDuplicateAttributeKey(kind: AttributeKeyKind): boolean {
    const ontologyUniqueIdentifier = String(route.params.objectId || "").trim();
    const conflict = findConflictingAttributeKey(collectPropertyItemsFromTree(getCategories(), ontologyUniqueIdentifier), kind, editingAttributeId.value);
    if (!conflict) return false;
    ElMessage.warning(formatAttributeKeyConflictMessage(kind, conflict));
    return true;
  }

  /**
   * @description 设置属性草稿的主键；对象里已有其他主键时提示并保持关闭。
   * @param enabled 是否设为主键。
   */
  function updateDraftPrimaryKey(enabled: boolean) {
    if (!enabled) {
      draft.isPrimary = false;
      return;
    }
    if (rejectDuplicateAttributeKey("primary")) return;
    draft.isPrimary = true;
  }

  /**
   * @description 设置属性草稿的名称键；对象里已有其他名称键时提示并保持关闭。
   * @param enabled 是否设为名称键。
   */
  function updateDraftNameKey(enabled: boolean) {
    if (!enabled) {
      draft.isNameKey = false;
      return;
    }
    if (rejectDuplicateAttributeKey("name")) return;
    draft.isNameKey = true;
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
    openCreateAttribute,
    openEditAttribute,
    saveAttributeDraft,
    updateDraftPrimaryKey,
    updateDraftNameKey,
    removeAttribute,
  };
}
