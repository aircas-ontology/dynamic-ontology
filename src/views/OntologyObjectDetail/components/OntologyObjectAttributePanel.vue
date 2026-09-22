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
  putBatchUpdateOntologyPropertiesInterface,
} from "@/apis";
import type { BatchUpdateOntologyPropertiesParams, GetOntologyDatasourceColumnsData, GetOntologyDatasourceTablesData } from "@/types";
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
const dataSourceCatalog = ref<DataSourceDatabase[]>([]);
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
    dataSource: null,
  })),
);

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

/** @description 打开数据源关联弹窗并加载当前本体空间的数据源表。 */
function openDataSource() {
  dataSourceDialogVisible.value = true;
  void loadDataSourceTables();
}

/** @description 查询当前本体空间的数据源表列表。 */
async function loadDataSourceTables() {
  const spaceId = Number(route.query.spaceId);
  if (!Number.isFinite(spaceId)) {
    dataSourceTableError.value = "缺少本体空间标识，无法加载数据源。";
    return;
  }
  dataSourceTableLoading.value = true;
  dataSourceTableError.value = "";
  try {
    const response = await getOntologyDatasourceTablesInterface({ spaceId, keyword: "", pageNum: 1, pageSize: 1000 });
    if (response.code !== 200) throw new Error(response.message || "数据源查询失败");
    dataSourceCatalog.value = mapDatasourceTables(response.data);
  } catch (cause) {
    dataSourceCatalog.value = [];
    dataSourceTableError.value = cause instanceof Error && cause.message.trim() ? cause.message : "数据源查询失败，请重试。";
    ElMessage.error(dataSourceTableError.value);
  } finally {
    dataSourceTableLoading.value = false;
  }
}

/** @description 按选中的数据源表查询字段信息。 */
async function loadDataSourceColumns(_databaseId: string, tableId: string) {
  const spaceId = Number(route.query.spaceId);
  if (!Number.isFinite(spaceId) || !tableId) return;
  const table = dataSourceCatalog.value[0]?.tables.find((item) => item.id === tableId);
  if (!table) return;
  dataSourceColumnLoading.value = true;
  dataSourceColumnError.value = "";
  try {
    const response = await getOntologyDatasourceColumnsInterface({ spaceId, dataSourceId: table.dataSourceId });
    if (response.code !== 200) throw new Error(response.message || "字段查询失败");
    table.fields = mapDatasourceColumns(response.data);
  } catch (cause) {
    dataSourceColumnError.value = cause instanceof Error && cause.message.trim() ? cause.message : "字段查询失败，请重试。";
    ElMessage.error(dataSourceColumnError.value);
  } finally {
    dataSourceColumnLoading.value = false;
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
  grid-template-columns: minmax(260px, 28%) minmax(0, 1fr);
  gap: 8px;
}

@media (max-width: 980px) {
  .ontology-object-attribute-panel {
    grid-template-columns: 230px minmax(0, 1fr);
  }
}

@media (max-width: 720px) {
  .ontology-object-attribute-panel {
    grid-template-columns: 1fr;
    overflow: auto;
  }
}
</style>
