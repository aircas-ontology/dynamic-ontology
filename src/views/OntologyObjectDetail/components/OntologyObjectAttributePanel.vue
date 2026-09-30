<template>
  <section class="ontology-object-attribute-panel" aria-label="本体对象属性">
    <AttributeCategoryTree
      :categories="categories"
      :tree-props="treeProps"
      :category-search="categorySearch"
      :category-tree-loading="categoryTreeLoading"
      :category-tree-error="categoryTreeError"
      :category-tree-empty="categoryTreeEmpty"
      :selected-category-id="selectedCategoryId"
      :filter-category-node="filterCategoryNode"
      @update:category-search="categorySearch = $event"
      @select-category="selectCategory"
      @create-root="openRootCategoryCreate"
      @create-category="openCategoryCreate"
      @edit-category="openCategoryEdit"
      @remove-category="removeCategory"
    />
    <AttributePropertyTable
      :selected-category-name="selectedCategoryName"
      :attribute-search="attributeSearch"
      :attribute-loading="attributeLoading"
      :attribute-error="attributeError"
      :data-source-opening="dataSourceOpening"
      :visible-attributes="visibleAttributes"
      @update:attribute-search="attributeSearch = $event"
      @open-data-source="openDataSource"
      @create-attribute="openCreateAttribute"
      @edit-attribute="openEditAttribute"
      @remove-attribute="removeAttribute"
    />
    <AttributeCategoryCreateDialog
      :visible="categoryDialogVisible"
      :parent-name="categoryParentName"
      :name="categoryName"
      :submitting="categorySubmitting"
      :error="categoryError"
      @update:visible="categoryDialogVisible = $event"
      @update:name="categoryName = $event"
      @confirm="saveCategoryDraft"
    />
    <AttributeCategoryEditDialog
      :visible="categoryEditDialogVisible"
      :parent-name="categoryParentName"
      :name="categoryEditName"
      :submitting="categoryEditSubmitting"
      :error="categoryEditError"
      @update:visible="categoryEditDialogVisible = $event"
      @update:name="categoryEditName = $event"
      @confirm="saveCategoryEdit"
    />
    <AttributePropertyFormDialog
      :visible="attributeDialogVisible"
      :editing-attribute-id="editingAttributeId"
      :draft="draft"
      :rules="attributeRules"
      :category-options="categoryOptions"
      :data-types="dataTypes"
      :storage-groups="storageGroups"
      :command-error="attributeCommandError"
      :saving="savingAttribute"
      @update:visible="attributeDialogVisible = $event"
      @confirm="saveAttributeDraft"
    />
    <DataSourceAssociateDialog
      ref="dataSourceDialogRef"
      v-model="dataSourceDialogVisible"
      :catalog="dataSourceCatalog"
      :properties="ontologyPropertyMappings"
      :table-loading="dataSourceTableLoading"
      :field-loading="dataSourceColumnLoading"
      :table-error="dataSourceTableError"
      :field-error="dataSourceColumnError"
      :auto-associate-loading="autoDataSourceSubmitting"
      @auto-associate="handleAutoDataSourceAssociate"
      @table-change="loadDataSourceColumns"
      @submit="handleDataSourceSubmit"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  autoBindOntologyPropertyDatasourceInterface,
  getOntologyDatasourceColumnsInterface,
  getOntologyDatasourceTablesInterface,
  getOntologyPropertyDetailByOntologyIdInterface,
  putBatchUpdateOntologyPropertiesInterface,
} from "@/apis";
import type {
  BatchUpdateOntologyPropertiesParams,
  GetOntologyDatasourceColumnsData,
  GetOntologyDatasourceTablesData,
  GetOntologyPropertyDetailByOntologyIdData,
} from "@/types";
import { useRoute } from "vue-router";
import { useAttributeCategoryTree } from "../composables/useAttributeCategoryTree";
import { useAttributePropertyList } from "../composables/useAttributePropertyList";
import { collectPropertyItemsFromTree, findCategory, filterCategoryNode } from "../utils/attributePanelHelpers";
import AttributeCategoryCreateDialog from "./AttributeCategoryCreateDialog.vue";
import AttributeCategoryEditDialog from "./AttributeCategoryEditDialog.vue";
import AttributeCategoryTree from "./AttributeCategoryTree.vue";
import AttributePropertyFormDialog from "./AttributePropertyFormDialog.vue";
import AttributePropertyTable from "./AttributePropertyTable.vue";
import DataSourceAssociateDialog from "./DataSourceAssociateDialog.vue";

interface DataSourceField {
  id: string;
  name: string;
  dataType: string;
}

interface DataSourceTable {
  id: string;
  name: string;
  schemaName: string;
  dataSourceId: string;
  fields: DataSourceField[];
}

interface DataSourceDatabase {
  id: string;
  name: string;
  tables: DataSourceTable[];
}

interface PropertyDataSourceBind {
  databaseId: string;
  databaseName: string;
  schemaName: string;
  tableId: string;
  tableName: string;
  fieldId: string;
  fieldName: string;
}

interface OntologyPropertyMappingItem {
  id: string;
  displayName: string;
  apiName: string;
  categoryName: string;
  dataSource: PropertyDataSourceBind | null;
}

interface PropertyBindPayload {
  id: string;
  dataSource: PropertyDataSourceBind | null;
}

const route = useRoute();
const selectedCategoryId = ref("all");
let categoryApi: ReturnType<typeof useAttributeCategoryTree>;

const propertyApi = useAttributePropertyList({
  selectedCategoryId,
  getCategories: () => categoryApi?.categories.value ?? [],
  onPropertyChanged: async () => {
    await categoryApi.loadAttributeCategoryTree();
  },
});

categoryApi = useAttributeCategoryTree({
  selectedCategoryId,
  onCategorySelected: () => {
    void propertyApi.loadAttributesForSelection();
  },
  onCategoryChanged: () => {
    void propertyApi.loadAttributesForSelection();
  },
});

const {
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
  selectCategory,
  openCategoryEdit,
  saveCategoryEdit,
  openCategoryCreate,
  openRootCategoryCreate,
  saveCategoryDraft,
  removeCategory,
  loadAttributeCategoryTree,
} = categoryApi;

const {
  dataTypes,
  storageGroups,
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
  removeAttribute,
} = propertyApi;

const dataSourceDialogVisible = ref(false);
const dataSourceDialogRef = ref<InstanceType<typeof DataSourceAssociateDialog> | null>(null);
const dataSourceOpening = ref(false);
const dataSourceCatalog = ref<DataSourceDatabase[]>([]);
const ontologyPropertyDetails = ref<GetOntologyPropertyDetailByOntologyIdData>([]);
const dataSourceTableLoading = ref(false);
const dataSourceTableError = ref("");
const dataSourceColumnLoading = ref(false);
const dataSourceColumnError = ref("");
const autoDataSourceSubmitting = ref(false);
const allAttributes = computed(() => collectPropertyItemsFromTree(categories.value, String(route.params.objectId || "")));
const ontologyPropertyMappings = computed<OntologyPropertyMappingItem[]>(() =>
  allAttributes.value.map((item) => ({
    id: item.uniqueIdentifier,
    displayName: item.displayName,
    apiName: item.apiName,
    categoryName: findCategory(categories.value, item.categoryId)?.label ?? "未分类",
    dataSource: resolvePropertyDataSourceBind(item.uniqueIdentifier),
  })),
);

/**
 * @description 将属性信息中的数据源表和字段信息转换为关联弹窗连接。
 * @param propertyId 属性唯一标识。
 * @returns 可回显的属性数据源连接；属性信息或目录不完整时返回 null。
 */
function resolvePropertyDataSourceBind(propertyId: string): PropertyDataSourceBind | null {
  const detail = ontologyPropertyDetails.value.find((item) => item.uniqueIdentifier === propertyId);
  const dataSourceId = detail?.datasourceId?.trim() ?? "";
  const columnName = detail?.datasourceColumnName?.trim() ?? "";
  if (!detail || !dataSourceId || !columnName) return null;
  for (const database of dataSourceCatalog.value) {
    const table = database.tables.find((item) => item.dataSourceId === dataSourceId);
    const field = table?.fields.find((item) => item.name === columnName);
    if (!table || !field) continue;
    return {
      databaseId: database.id,
      databaseName: database.name,
      schemaName: table.schemaName,
      tableId: table.id,
      tableName: table.name,
      fieldId: field.id,
      fieldName: field.name,
    };
  }
  return null;
}

/** @description 将数据源表分页记录转换为关联弹窗目录。 */
function mapDatasourceTables(response: GetOntologyDatasourceTablesData): DataSourceDatabase[] {
  return [
    {
      id: "ontology-datasource",
      name: "本体空间数据源",
      tables: response.records.map((record) => ({
        id: `${record.schemaName}.${record.tableName}`,
        name: record.tableName,
        schemaName: record.schemaName,
        dataSourceId: record.tableName,
        fields: [],
      })),
    },
  ];
}

/** @description 将接口字段记录转换为关联弹窗字段选项。 */
function mapDatasourceColumns(data: GetOntologyDatasourceColumnsData): DataSourceField[] {
  return data.map((column) => ({ id: column.columnName, name: column.columnName, dataType: column.type || column.description || "" }));
}

/**
 * @description 查询属性信息并整合已有数据源关联，完成初始连线后打开弹窗。
 * @returns 查询和初始化完成后的 Promise。
 */
async function openDataSource() {
  if (dataSourceOpening.value) return;
  const ontologyUniqueIdentifier = String(route.params.objectId || "").trim();
  if (!ontologyUniqueIdentifier) {
    ElMessage.error("缺少本体对象标识，无法加载属性数据源关联。");
    return;
  }
  dataSourceOpening.value = true;
  dataSourceTableError.value = "";
  dataSourceColumnError.value = "";
  try {
    const infoResponse = await getOntologyPropertyDetailByOntologyIdInterface({ ontologyUniqueIdentifier });
    if (infoResponse.code !== 200) throw new Error(infoResponse.message || "属性信息查询失败");
    ontologyPropertyDetails.value = infoResponse.data;
    const tableLoaded = await loadDataSourceTables();
    if (!tableLoaded) throw new Error(dataSourceTableError.value || "数据源查询失败");
    await loadAssociatedDataSourceColumns();
    dataSourceDialogVisible.value = true;
  } catch (cause) {
    ontologyPropertyDetails.value = [];
    ElMessage.error(cause instanceof Error && cause.message.trim() ? cause.message : "属性数据源关联查询失败，请重试。");
  } finally {
    dataSourceOpening.value = false;
  }
}

/**
 * @description 查询当前本体空间的数据源表列表。
 * @returns 是否成功获得数据源表目录。
 */
async function loadDataSourceTables(): Promise<boolean> {
  const spaceId = Number(route.query.spaceId);
  if (!Number.isFinite(spaceId)) {
    dataSourceTableError.value = "缺少本体空间标识，无法加载数据源。";
    return false;
  }
  dataSourceTableLoading.value = true;
  dataSourceTableError.value = "";
  try {
    const response = await getOntologyDatasourceTablesInterface({ spaceId, keyword: "", pageNum: 1, pageSize: 1000 });
    if (response.code !== 200) throw new Error(response.message || "数据源查询失败");
    dataSourceCatalog.value = mapDatasourceTables(response.data);
    return true;
  } catch (cause) {
    dataSourceCatalog.value = [];
    dataSourceTableError.value = cause instanceof Error && cause.message.trim() ? cause.message : "数据源查询失败，请重试。";
    return false;
  } finally {
    dataSourceTableLoading.value = false;
  }
}

/**
 * @description 按选中的数据源表查询字段信息。
 * @param _databaseId 数据源目录标识，当前目录只有一个分组。
 * @param tableId 数据源表标识。
 * @param showError 查询失败时是否立即显示消息。
 * @returns 是否成功获得字段列表。
 */
async function loadDataSourceColumns(_databaseId: string, tableId: string, showError = true): Promise<boolean> {
  const spaceId = Number(route.query.spaceId);
  if (!Number.isFinite(spaceId) || !tableId) return false;
  const table = dataSourceCatalog.value[0]?.tables.find((item) => item.id === tableId);
  if (!table) return false;
  dataSourceColumnLoading.value = true;
  dataSourceColumnError.value = "";
  try {
    const response = await getOntologyDatasourceColumnsInterface({ spaceId, dataSourceId: table.dataSourceId });
    if (response.code !== 200) throw new Error(response.message || "字段查询失败");
    table.fields = mapDatasourceColumns(response.data);
    return true;
  } catch (cause) {
    dataSourceColumnError.value = cause instanceof Error && cause.message.trim() ? cause.message : "字段查询失败，请重试。";
    if (showError) ElMessage.error(dataSourceColumnError.value);
    return false;
  } finally {
    dataSourceColumnLoading.value = false;
  }
}

/**
 * @description 加载属性信息中已有连接所涉及的全部数据源表字段。
 * @returns 全部已关联数据源字段完成加载后的 Promise。
 */
async function loadAssociatedDataSourceColumns(): Promise<void> {
  const dataSourceIds = [...new Set(ontologyPropertyDetails.value.map((detail) => detail.datasourceId?.trim() ?? "").filter(Boolean))];
  for (const dataSourceId of dataSourceIds) {
    const database = dataSourceCatalog.value.find((item) => item.tables.some((table) => table.dataSourceId === dataSourceId));
    const table = database?.tables.find((item) => item.dataSourceId === dataSourceId);
    if (!database || !table) throw new Error(`未找到已关联的数据源表「${dataSourceId}」`);
    const columnLoaded = await loadDataSourceColumns(database.id, table.id, false);
    if (!columnLoaded) throw new Error(dataSourceColumnError.value || `数据源表「${dataSourceId}」字段查询失败`);
  }
}

/** @description 调用后端自动关联当前本体属性数据源并保留弹窗。 */
async function handleAutoDataSourceAssociate() {
  if (autoDataSourceSubmitting.value) return;
  const ontologyIdentifier = String(route.params.objectId || "").trim();
  if (!ontologyIdentifier) {
    ElMessage.error("缺少本体对象标识，无法自动关联数据源。");
    return;
  }
  autoDataSourceSubmitting.value = true;
  try {
    const response = await autoBindOntologyPropertyDatasourceInterface({ ontologyIdentifier });
    if (response.code !== 200) throw new Error(response.message || "自动关联数据源失败");
    ElMessage.success("自动关联数据源成功");
  } catch (cause) {
    ElMessage.error(cause instanceof Error && cause.message.trim() ? cause.message : "自动关联数据源失败，请重试。");
  } finally {
    autoDataSourceSubmitting.value = false;
  }
}

/** @description 处理手动数据源关联弹窗提交。 */
async function handleDataSourceSubmit(payloads: PropertyBindPayload[]) {
  const params: BatchUpdateOntologyPropertiesParams = [];
  for (const payload of payloads) {
    const attribute = allAttributes.value.find((item) => item.uniqueIdentifier === payload.id);
    if (!attribute) {
      dataSourceDialogRef.value?.setLoading(false);
      ElMessage.error("未找到待关联的本体属性，请重新打开弹窗后再试。");
      return;
    }
    params.push({
      uniqueIdentifier: attribute.uniqueIdentifier,
      displayName: attribute.displayName,
      dataType: attribute.dataType,
      isTitleKey: attribute.isNameKey,
      isPrimaryKey: attribute.isPrimary,
      storageGroup: attribute.storageGroup,
      ...(payload.dataSource
        ? {
            datasource: {
              schemaName: payload.dataSource.schemaName,
              datasourceId: payload.dataSource.tableName,
              datasourceColumnName: payload.dataSource.fieldName,
            },
          }
        : {}),
    });
  }
  try {
    const response = await putBatchUpdateOntologyPropertiesInterface(params);
    if (response.code !== 200) throw new Error(response.message || "数据源关联保存失败");
    dataSourceDialogRef.value?.completeSubmit();
    ElMessage.success("数据源关联保存成功");
  } catch (cause) {
    dataSourceDialogRef.value?.setLoading(false);
    ElMessage.error(cause instanceof Error && cause.message.trim() ? cause.message : "数据源关联保存失败，请重试。");
  }
}

onMounted(async () => {
  await loadAttributeCategoryTree();
});
</script>

<style scoped lang="scss">
.ontology-object-attribute-panel {
  display: grid;
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 8px;
}

@media (max-width: 720px) {
  .ontology-object-attribute-panel {
    grid-template-columns: 1fr;
    overflow: auto;
  }
}
</style>
