<template>
  <section class="ontology-object-attribute-panel" aria-label="本体对象属性">
    <aside class="ontology-object-attribute-panel__categories" aria-label="属性分类树">
      <header class="ontology-object-attribute-panel__section-header">
        <div>
          <h1>属性分类树 <small>/ Property Category</small></h1>
          <p>按分类浏览当前本体对象的属性</p>
        </div>
      </header>
      <el-input v-model="categorySearch" class="aircas-input" clearable placeholder="搜索属性分类" ariaLabel="搜索属性分类" />
      <p v-if="categoryTreeLoading" class="ontology-object-attribute-panel__tree-state"><AircasLoading>正在加载属性分类...</AircasLoading></p>
      <p v-else-if="categoryTreeError" class="ontology-object-attribute-panel__tree-state is-error" role="alert">{{ categoryTreeError }}</p>
      <div v-else-if="categoryTreeEmpty" class="ontology-object-attribute-panel__tree-empty">
        <p class="ontology-object-attribute-panel__tree-state">暂无分类树数据</p>
        <el-button class="aircas-button" type="primary" @click="openRootCategoryCreate">创建分类</el-button>
      </div>
      <el-tree
        v-else
        ref="treeRef"
        class="ontology-object-attribute-panel__tree"
        :data="categories"
        node-key="id"
        :props="treeProps"
        default-expand-all
        highlight-current
        :current-node-key="selectedCategoryId"
        :expand-on-click-node="false"
        :filter-node-method="filterCategoryNode"
        @node-click="selectCategory"
      >
        <template #default="{ data }">
          <div class="ontology-object-attribute-panel__tree-node">
            <template v-if="isCategoryNode(data)">
              <span class="ontology-object-attribute-panel__tree-label">
                <el-icon><FolderOpened v-if="data.children?.length" /><CollectionTag v-else /></el-icon>
                {{ data.label }}
                <em>{{ data.propertyCount }}</em>
              </span>
            </template>
            <template v-else>
              <span class="ontology-object-attribute-panel__tree-property-node" :title="data.label">
                <span class="ontology-object-attribute-panel__tree-property-dot" aria-hidden="true"></span>
                <span class="ontology-object-attribute-panel__tree-property-name">{{ data.label }}</span>
              </span>
            </template>
            <span v-if="isCategoryNode(data)" class="ontology-object-attribute-panel__tree-actions" @click.stop>
              <el-tooltip content="添加子分类" placement="top" :show-after="200">
                <button type="button" class="ontology-object-attribute-panel__tree-action" aria-label="添加子分类" @click="openCategoryCreate(data)">
                  <el-icon><Plus /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip content="编辑分类" placement="top" :show-after="200">
                <button type="button" class="ontology-object-attribute-panel__tree-action is-edit" aria-label="编辑分类" @click="openCategoryEdit(data)">
                  <el-icon><EditPen /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip content="删除分类" placement="top" :show-after="200">
                <button type="button" class="ontology-object-attribute-panel__tree-action is-danger" aria-label="删除分类" @click="removeCategory(data)">
                  <el-icon><Delete /></el-icon>
                </button>
              </el-tooltip>
            </span>
          </div>
        </template>
      </el-tree>
    </aside>

    <main class="ontology-object-attribute-panel__content">
      <header class="ontology-object-attribute-panel__content-header">
        <div>
          <h2>{{ selectedCategoryName }}</h2>
          <p>{{ visibleAttributes.length }} 个属性类</p>
        </div>
        <div class="ontology-object-attribute-panel__toolbar">
          <el-input
            v-model="attributeSearch"
            class="aircas-input ontology-object-attribute-panel__search"
            clearable
            placeholder="搜索属性 API 或描述"
            ariaLabel="搜索属性"
          />
          <el-button class="aircas-button" @click="openDataSource"
            ><el-icon><Connection /></el-icon>关联数据源</el-button
          >
          <el-button class="aircas-button" type="primary" @click="openCreateAttribute"
            ><el-icon><Plus /></el-icon>添加</el-button
          >
        </div>
      </header>

      <p v-if="attributeLoading" class="ontology-object-attribute-panel__table-state"><AircasLoading>正在加载属性...</AircasLoading></p>
      <p v-else-if="attributeError" class="ontology-object-attribute-panel__table-state is-error" role="alert">{{ attributeError }}</p>
      <div v-else-if="visibleAttributes.length" class="ontology-object-attribute-panel__table-wrap">
        <el-table
          :data="visibleAttributes"
          stripe
          height="100%"
          row-key="uniqueIdentifier"
          class="aircas-table aircas-table--flat ontology-object-attribute-panel__table"
        >
          <el-table-column prop="displayName" label="属性名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="apiName" label="API" min-width="150" show-overflow-tooltip />
          <el-table-column prop="dataType" label="数据类型" width="110" show-overflow-tooltip />
          <el-table-column prop="storageGroup" label="存储分组" width="120" show-overflow-tooltip />
          <el-table-column label="默认值" min-width="110" show-overflow-tooltip>
            <template #default="{ row }">{{ row.defaultValue || "—" }}</template>
          </el-table-column>
          <el-table-column prop="description" label="属性描述" min-width="210" show-overflow-tooltip />
          <el-table-column label="主键" width="72" show-overflow-tooltip
            ><template #default="{ row }">{{ row.isPrimary ? "是" : "否" }}</template></el-table-column
          >
          <el-table-column label="名称键" width="72" show-overflow-tooltip
            ><template #default="{ row }">{{ row.isNameKey ? "是" : "否" }}</template></el-table-column
          >
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <div class="ontology-object-attribute-panel__row-actions">
                <el-button class="aircas-button" size="small" @click="openEditAttribute(row)">编辑</el-button>
                <el-button class="aircas-button" type="danger" size="small" @click="removeAttribute(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-empty v-else class="ontology-object-attribute-panel__empty" description="暂无匹配属性" />
    </main>

    <el-dialog v-model="categoryDialogVisible" class="aircas-dialog" title="创建分类" width="min(480px, 94vw)" append-to-body destroy-on-close>
      <el-form class="aircas-form" label-position="top">
        <el-form-item label="父分类">
          <el-input v-model="categoryParentName" class="aircas-input" readonly ariaLabel="父分类" />
        </el-form-item>
        <el-form-item label="输入分类名称" required>
          <el-input
            v-model="categoryName"
            class="aircas-input"
            maxlength="64"
            ariaLabel="输入分类名称"
            placeholder="请输入分类名称"
            :disabled="categorySubmitting"
          />
        </el-form-item>
      </el-form>
      <p v-if="categoryError" class="ontology-object-attribute-panel__dialog-error" role="alert">{{ categoryError }}</p>
      <template #footer>
        <el-button class="aircas-button" :disabled="categorySubmitting" @click="categoryDialogVisible = false">取消</el-button>
        <el-button class="aircas-button" type="primary" :loading="categorySubmitting" @click="saveCategoryDraft">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="categoryEditDialogVisible" class="aircas-dialog" title="编辑分类" width="min(480px, 94vw)" append-to-body destroy-on-close>
      <el-form class="aircas-form" label-position="top">
        <el-form-item label="父分类">
          <el-input v-model="categoryParentName" class="aircas-input" readonly ariaLabel="父分类" />
        </el-form-item>
        <el-form-item label="分类名称" required>
          <el-input
            v-model="categoryEditName"
            class="aircas-input"
            maxlength="64"
            ariaLabel="分类名称"
            placeholder="请输入分类名称"
            :disabled="categoryEditSubmitting"
          />
        </el-form-item>
      </el-form>
      <p v-if="categoryEditError" class="ontology-object-attribute-panel__dialog-error" role="alert">{{ categoryEditError }}</p>
      <template #footer>
        <el-button class="aircas-button" :disabled="categoryEditSubmitting" @click="categoryEditDialogVisible = false">取消</el-button>
        <el-button class="aircas-button" type="primary" :loading="categoryEditSubmitting" @click="saveCategoryEdit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="attributeDialogVisible"
      class="aircas-dialog"
      :title="editingAttributeId === null ? '添加属性' : '编辑属性'"
      width="min(760px, 94vw)"
      append-to-body
      destroy-on-close
    >
      <el-form ref="attributeFormRef" :model="draft" :rules="attributeRules" class="aircas-form" label-position="top">
        <div class="ontology-object-attribute-panel__form-grid">
          <el-form-item label="属性名称" prop="displayName"
            ><el-input v-model="draft.displayName" class="aircas-input" placeholder="例如：任务优先级"
          /></el-form-item>
          <el-form-item label="API" prop="apiName"><el-input v-model="draft.apiName" class="aircas-input" placeholder="例如：priority" /></el-form-item>
          <el-form-item label="属性分类" prop="categoryId" class="ontology-object-attribute-panel__form-full"
            ><el-select v-model="draft.categoryId" class="aircas-select" popper-class="aircas-select-popper" placeholder="请选择属性分类"
              ><el-option v-for="category in categoryOptions" :key="category.id" :label="category.label" :value="category.id" /></el-select
          ></el-form-item>
          <el-form-item label="数据类型" prop="dataType"
            ><el-select v-model="draft.dataType" class="aircas-select" popper-class="aircas-select-popper" placeholder="请选择数据类型"
              ><el-option v-for="type in dataTypes" :key="type" :label="type" :value="type" /></el-select
          ></el-form-item>
          <el-form-item label="存储分组" prop="storageGroup"
            ><el-select v-model="draft.storageGroup" class="aircas-select" popper-class="aircas-select-popper" placeholder="请选择存储分组"
              ><el-option v-for="group in storageGroups" :key="group.value" :label="group.label" :value="group.value" /></el-select
          ></el-form-item>
          <el-form-item label="默认值" class="ontology-object-attribute-panel__form-full"
            ><el-input v-model="draft.defaultValue" class="aircas-input" placeholder="可选"
          /></el-form-item>
        </div>
        <el-form-item label="属性描述" class="ontology-object-attribute-panel__form-full"
          ><el-input v-model="draft.description" class="aircas-input" type="textarea" :rows="3" placeholder="请输入属性描述"
        /></el-form-item>
        <div class="ontology-object-attribute-panel__switches">
          <div class="ontology-object-attribute-panel__switch-field">
            <span>主键</span>
            <el-switch
              class="aircas-switch"
              :model-value="draft.isPrimary"
              inline-prompt
              active-text="是"
              inactive-text="否"
              @update:model-value="draft.isPrimary = $event === true"
            />
          </div>
          <div class="ontology-object-attribute-panel__switch-field">
            <span>名称键</span>
            <el-switch
              class="aircas-switch"
              :model-value="draft.isNameKey"
              inline-prompt
              active-text="是"
              inactive-text="否"
              @update:model-value="draft.isNameKey = $event === true"
            />
          </div>
        </div>
      </el-form>
      <p v-if="attributeCommandError" class="ontology-object-attribute-panel__dialog-error" role="alert">{{ attributeCommandError }}</p>
      <template #footer>
        <el-button class="aircas-button" @click="attributeDialogVisible = false">取消</el-button>
        <el-button class="aircas-button" type="primary" :loading="savingAttribute" @click="saveAttributeDraft">保存</el-button>
      </template>
    </el-dialog>

    <DataSourceAssociateDialog
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
import { computed, onMounted, reactive, ref, watch } from "vue";
import { CollectionTag, Connection, Delete, EditPen, FolderOpened, Plus } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import {
  autoBindOntologyPropertyDatasourceInterface,
  createOntologyPropertyInterface,
  createOntologyObjectArrTypeTreeInterface,
  deleteOntologyPropertyInterface,
  deleteOntologyObjectArrTypeTreeInterface,
  getOntologyDatasourceColumnsInterface,
  getOntologyDatasourceTablesInterface,
  getOntologyObjectArrTypeTreeInterface,
  updateOntologyPropertyInterface,
  updateOntologyObjectArrTypeTreeInterface,
} from "@/apis";
import type {
  CreateOntologyPropertyParams,
  GetOntologyDatasourceColumnsData,
  GetOntologyDatasourceTablesData,
  GetOntologyObjectArrTypeTreeData,
  OntologyPropertyInfo,
  UpdateOntologyPropertyParams,
} from "@/types";
import AircasLoading from "@/components/AircasLoading.vue";
import { useRoute } from "vue-router";
import DataSourceAssociateDialog from "./DataSourceAssociateDialog.vue";

interface CategoryNode {
  nodeType: "category";
  id: string;
  label: string;
  propertyCount: number;
  isRoot?: boolean;
  children?: TreeNode[];
}

interface AttributeTreeNode {
  nodeType: "property";
  id: string;
  label: string;
  source: OntologyPropertyInfo;
}

type TreeNode = CategoryNode | AttributeTreeNode;

interface AttributeItem {
  uniqueIdentifier: string;
  ontologyUniqueIdentifier: string;
  displayName: string;
  apiName: string;
  dataType: string;
  categoryId: string;
  storageGroup: string;
  defaultValue: string;
  description: string;
  isPrimary: boolean;
  isNameKey: boolean;
}

interface AttributeDraft {
  displayName: string;
  apiName: string;
  categoryId: string;
  dataType: string;
  storageGroup: string;
  defaultValue: string;
  description: string;
  isPrimary: boolean;
  isNameKey: boolean;
}
const route = useRoute();
const dataTypes = ["String", "整数", "小数", "日期", "布尔"];
const storageGroups = [{ label: "主存储", value: "main" }];
const categories = ref<CategoryNode[]>([]);
const attributes = ref<AttributeItem[]>([]);
const treeProps = { children: "children", label: "label" };
const treeRef = ref<{ filter: (value: string) => void }>();
const categorySearch = ref("");
const categoryTreeLoading = ref(false);
const categoryTreeError = ref("");
const categoryTreeEmpty = ref(false);
const attributeLoading = ref(false);
const attributeError = ref("");
const attributeCommandError = ref("");
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
const attributeSearch = ref("");
const selectedCategoryId = ref("all");
const attributeDialogVisible = ref(false);
const dataSourceDialogVisible = ref(false);
const autoDataSourceSubmitting = ref(false);

interface DataSourceField {
  id: string;
  name: string;
  dataType: string;
}
interface DataSourceTable {
  id: string;
  name: string;
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

const dataSourceCatalog = ref<DataSourceDatabase[]>([]);
const dataSourceTableLoading = ref(false);
const dataSourceTableError = ref("");
const dataSourceColumnLoading = ref(false);
const dataSourceColumnError = ref("");
const allAttributes = ref<AttributeItem[]>([]);
const savingAttribute = ref(false);
const editingAttributeId = ref<string | null>(null);
const attributeFormRef = ref<FormInstance>();
const draft = reactive<AttributeDraft>({
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
const attributeRules: FormRules<AttributeDraft> = {
  displayName: [{ required: true, message: "请输入属性名称", trigger: "blur" }],
  apiName: [{ required: true, message: "请输入 API 名称", trigger: "blur" }],
  categoryId: [{ required: true, message: "请选择属性分类", trigger: "change" }],
  dataType: [{ required: true, message: "请选择数据类型", trigger: "change" }],
  storageGroup: [{ required: true, message: "请选择存储分组", trigger: "change" }],
};
const selectedCategoryName = computed(() => findCategory(categories.value, selectedCategoryId.value)?.label ?? "全部属性");
const ontologyPropertyMappings = computed<OntologyPropertyMappingItem[]>(() =>
  allAttributes.value.map((item) => ({
    id: item.uniqueIdentifier,
    displayName: item.displayName,
    apiName: item.apiName,
    categoryName: findCategory(categories.value, item.categoryId)?.label ?? "未分类",
    dataSource: null,
  })),
);
const visibleAttributes = computed(() =>
  attributes.value.filter((item) => {
    const keyword = attributeSearch.value.trim().toLowerCase();
    return !keyword || `${item.displayName} ${item.apiName} ${item.description}`.toLowerCase().includes(keyword);
  }),
);
const categoryOptions = computed(() => flattenCategoryOptions(categories.value));

/** @description 将接口分类树节点适配为属性页树节点。 */
function mapCategoryTreeNode(node: GetOntologyObjectArrTypeTreeData): CategoryNode {
  const categoryChildren = node.children?.map(mapCategoryTreeNode) ?? [];
  const propertyChildren = (node.propertyInfos ?? []).map(mapPropertyTreeNode);
  const children = [...categoryChildren, ...propertyChildren];
  return {
    nodeType: "category",
    id: String(node.categoryId),
    label: node.name || "未命名分类",
    propertyCount: propertyChildren.length,
    isRoot: true,
    children: children?.length ? children : undefined,
  };
}

/** @description 将接口属性记录适配为分类树的属性树叶节点，保留原始数据供后续筛选直接使用。 */
function mapPropertyTreeNode(item: OntologyPropertyInfo): AttributeTreeNode {
  const label = item.displayName || item.apiName || "未命名属性";
  const uniqueIdentifier = item.uniqueIdentifier?.trim();
  return {
    nodeType: "property",
    id: `property:${uniqueIdentifier || `${item.categoryId ?? ""}:${label}`}`,
    label,
    source: item,
  };
}
/** @description 将接口属性记录适配为属性页列表项。 */
function mapOntologyPropertyItem(item: OntologyPropertyInfo): AttributeItem {
  const metadataApiName = typeof item.metadata?.apiName === "string" ? item.metadata.apiName : "";
  return {
    uniqueIdentifier: item.uniqueIdentifier ?? "",
    ontologyUniqueIdentifier: item.ontologyUniqueIdentifier ?? String(route.params.objectId || ""),
    displayName: item.displayName ?? "",
    apiName: item.apiName ?? metadataApiName,
    dataType: item.propertyType ?? "",
    categoryId: item.categoryId === undefined ? "" : String(item.categoryId),
    storageGroup: item.storageGroup ?? "",
    defaultValue: item.defaultValue ?? "",
    description: item.description ?? "",
    isPrimary: item.isPrimaryKey === true,
    isNameKey: item.isTitleKey === true,
  };
}
/** @description 将服务端存储分组显示名称转换为表单使用的存储分组值。 */
function normalizeStorageGroupValue(value: string): string {
  return value === "主存储" ? "main" : value;
}
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
      allAttributes.value = [];
      selectedCategoryId.value = "all";
      categoryTreeEmpty.value = true;
      return;
    }
    const root = mapCategoryTreeNode(response.data);
    categories.value = [root];
    selectedCategoryId.value = "all";
    refreshAttributesFromTree();
  } catch (cause) {
    categoryTreeError.value = cause instanceof Error && cause.message.trim() ? cause.message : "属性分类查询失败，请重试。";
    ElMessage.error(categoryTreeError.value);
  } finally {
    categoryTreeLoading.value = false;
  }
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
        dataSourceId: record.tableName,
        fields: [],
      })),
    },
  ];
}

/** @description 将接口字段记录转换为关联弹窗字段选项。 */
function mapDatasourceColumns(data: GetOntologyDatasourceColumnsData): DataSourceField[] {
  return data.map((column) => ({
    id: column.columnName,
    name: column.columnName,
    dataType: column.type || column.description || "",
  }));
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
  return items;
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

/** @description 从指定分类节点递归收集属性树节点，映射为属性列表项，不再调用后端接口。 */
function collectPropertyItemsFromTree(nodes: TreeNode[]): AttributeItem[] {
  const items: AttributeItem[] = [];
  for (const node of nodes) {
    if (node.nodeType === "property") {
      items.push(mapOntologyPropertyItem(node.source));
    } else if (node.children?.length) {
      items.push(...collectPropertyItemsFromTree(node.children));
    }
  }
  return items;
}

/** @description 根据当前选中的分类节点，从已加载的分类树中直接提取属性列表。 */
function refreshAttributesFromTree() {
  const categoryId = selectedCategoryId.value;
  attributeError.value = "";
  allAttributes.value = collectPropertyItemsFromTree(categories.value);
  if (categoryId === "all") {
    attributes.value = allAttributes.value;
    return;
  }
  const selectedCategory = findCategory(categories.value, categoryId);
  if (!selectedCategory) {
    attributes.value = [];
    return;
  }
  attributes.value = collectPropertyItemsFromTree([selectedCategory]);
}

/** @description 判断树节点是否为属性分类节点。 */
function isCategoryNode(value: unknown): value is CategoryNode {
  return Boolean(value && typeof value === "object" && "nodeType" in value && value.nodeType === "category");
}

/** @description 在分类树中递归查找指定分类节点。 */
function findCategory(nodes: TreeNode[], id: string): CategoryNode | undefined {
  for (const node of nodes) {
    if (!isCategoryNode(node)) continue;
    if (node.id === id) return node;
    const found = node.children ? findCategory(node.children, id) : undefined;
    if (found) return found;
  }
  return undefined;
}

/** @description 将属性分类树扁平化为属性表单下拉选项。 */
function flattenCategoryOptions(nodes: TreeNode[]): CategoryNode[] {
  return nodes.flatMap((node) => (isCategoryNode(node) ? [node, ...(node.children ? flattenCategoryOptions(node.children) : [])] : []));
}
/** @description 根据分类搜索词过滤树节点。 */
function filterCategoryNode(value: string, data: unknown): boolean {
  if (!data || typeof data !== "object" || !("label" in data) || typeof data.label !== "string") return false;
  return !value.trim() || data.label.includes(value.trim());
}

/** @description 选中属性分类并刷新右侧列表。 */
function selectCategory(data: unknown) {
  if (!isCategoryNode(data)) return;
  selectedCategoryId.value = data.id;
  refreshAttributesFromTree();
}
/** @description 查找分类节点的父分类。 */
function findCategoryParent(nodes: TreeNode[], id: string, parent?: CategoryNode): CategoryNode | undefined {
  for (const node of nodes) {
    if (!isCategoryNode(node)) continue;
    if (node.id === id) return parent;
    const found = node.children ? findCategoryParent(node.children, id, node) : undefined;
    if (found) return found;
  }
  return undefined;
}
/** @description 打开分类编辑弹窗并回显父分类和当前名称。 */
function openCategoryEdit(value: unknown) {
  if (!isCategoryNode(value)) return;
  const data = value;
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
/** @description 打开指定分类下的新建子分类弹窗。 */
function openCategoryCreate(value: unknown) {
  if (!isCategoryNode(value)) return;
  const parent = value;
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
/** @description 删除属性分类并提示结果。 */
async function removeCategory(value: unknown) {
  if (!isCategoryNode(value)) return;
  const data = value;
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
/** @description 打开数据源关联弹窗。 */
function openDataSource() {
  dataSourceDialogVisible.value = true;
  void loadDataSourceTables();
}

/** @description 调用后端自动关联当前本体的全部属性数据源，并保留关联弹窗。 */
async function handleAutoDataSourceAssociate(): Promise<void> {
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

interface PropertyBindPayload {
  id: string;
  dataSource: PropertyDataSourceBind | null;
}

/** @description 处理数据源关联弹窗提交，预览关联变更并关闭弹窗。 */
async function handleDataSourceSubmit(payloads: PropertyBindPayload[]): Promise<void> {
  const summary = payloads
    .map((payload) => {
      const target = ontologyPropertyMappings.value.find((item) => item.id === payload.id)?.apiName ?? payload.id;
      if (!payload.dataSource) return `${target}：解除关联`;
      return `${target} → ${payload.dataSource.tableName}.${payload.dataSource.fieldName}`;
    })
    .join("\n");
  ElMessage.success(`提交 ${payloads.length} 项关联变更\n${summary}`);
  dataSourceDialogVisible.value = false;
}
/** @description 将表单分类标识转换为接口需要的数字。 */
function getDraftCategoryId(): number | undefined {
  const categoryId = Number(draft.categoryId);
  return Number.isFinite(categoryId) && categoryId > 0 ? categoryId : undefined;
}
/** @description 组装创建属性接口请求参数，补齐页面未展示的字段。 */
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
/** @description 组装编辑属性接口请求参数，仅提交唯一标识和页面可编辑字段。 */
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
/** @description 打开属性编辑表单并回显当前数据。 */
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
  const valid = await attributeFormRef.value?.validate().catch(() => false);
  if (!valid) return;
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
    refreshAttributesFromTree();
    await loadAttributeCategoryTree();
  } catch (cause) {
    attributeCommandError.value = cause instanceof Error && cause.message.trim() ? cause.message : "属性保存失败，请重试。";
    ElMessage.error(attributeCommandError.value);
  } finally {
    savingAttribute.value = false;
  }
}
/** @description 删除属性并刷新当前列表。 */
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
    refreshAttributesFromTree();
    await loadAttributeCategoryTree();
  } catch (cause) {
    const message = cause instanceof Error && cause.message.trim() ? cause.message : "属性删除失败，请重试。";
    ElMessage.error(message);
  }
}
/** @description 判断表格行是否符合属性数据结构。 */
function isAttributeItem(value: unknown): value is AttributeItem {
  if (!value || typeof value !== "object") return false;
  return "uniqueIdentifier" in value && typeof value.uniqueIdentifier === "string";
}
watch(categorySearch, (value) => treeRef.value?.filter(value));
onMounted(() => {
  void loadAttributeCategoryTree();
  refreshAttributesFromTree();
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
.ontology-object-attribute-panel__categories {
  display: flex;
  min-width: 0;
  min-height: 0;
  padding: 16px 12px;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-section-background), var(--aircas-color-panel-background-deep));
  box-shadow: inset 0 0 20px var(--aircas-color-divider);
}
.ontology-object-attribute-panel__content {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}
.ontology-object-attribute-panel__section-header h1,
.ontology-object-attribute-panel__content-header h2 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
}
.ontology-object-attribute-panel__section-header h1 small {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
  font-weight: 400;
}
.ontology-object-attribute-panel__section-header p,
.ontology-object-attribute-panel__content-header p {
  margin: 4px 0 0;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}
.ontology-object-attribute-panel__tree {
  min-height: 0;
  padding-right: 4px;
  flex: 1;
  overflow: auto;
  color: var(--aircas-color-text-secondary);
  background: var(--aircas-color-transparent);
}
.ontology-object-attribute-panel__tree-state {
  display: grid;
  min-height: 120px;
  margin: 0;
  place-items: center;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
  text-align: center;
}
.ontology-object-attribute-panel__tree-state.is-error {
  color: var(--aircas-color-danger);
}
.ontology-object-attribute-panel__tree-empty {
  display: grid;
  min-height: 120px;
  place-items: center;
  gap: 12px;
}
.ontology-object-attribute-panel__tree-empty .ontology-object-attribute-panel__tree-state {
  min-height: auto;
}
.ontology-object-attribute-panel__tree :deep(.el-tree-node__content) {
  min-height: 32px;
  height: auto;
  padding: 4px 0;
  border-radius: 4px;
}
.ontology-object-attribute-panel__tree :deep(.el-tree-node__content:hover) {
  background: var(--aircas-color-hover-background);
}
.ontology-object-attribute-panel__tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-selected-background);
}
.ontology-object-attribute-panel__tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
}
.ontology-object-attribute-panel__tree-label {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: 6px;
  color: var(--aircas-color-text-secondary);
}
.ontology-object-attribute-panel__tree-property-node {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  color: var(--aircas-color-text-secondary);
}
.ontology-object-attribute-panel__tree-property-dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--aircas-color-accent-cyan);
}
.ontology-object-attribute-panel__tree-property-name {
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ontology-object-attribute-panel__tree-label em {
  padding: 0 6px;
  border-radius: 10px;
  color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-accent-cyan-soft);
  font-size: 11px;
  font-style: normal;
}
.ontology-object-attribute-panel__tree-actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  flex-shrink: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}
.ontology-object-attribute-panel__tree :deep(.el-tree-node__content:hover) .ontology-object-attribute-panel__tree-actions,
.ontology-object-attribute-panel__tree :deep(.el-tree-node__content:focus-within) .ontology-object-attribute-panel__tree-actions {
  opacity: 1;
  pointer-events: auto;
}
.ontology-object-attribute-panel__tree-action {
  display: inline-grid;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  place-items: center;
  color: var(--aircas-color-text-inverse);
  background: var(--aircas-color-button-primary-background);
  cursor: pointer;
}
.ontology-object-attribute-panel__tree-action.is-edit {
  background: var(--aircas-color-accent-blue);
}
.ontology-object-attribute-panel__tree-action.is-danger {
  background: var(--aircas-color-danger);
}
.ontology-object-attribute-panel__tree-action:focus-visible {
  outline: 1px solid var(--aircas-color-border);
  outline-offset: 1px;
}
.ontology-object-attribute-panel__content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 52px;
  padding: 8px 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-section-background), var(--aircas-color-panel-background-deep));
  box-shadow: inset 0 0 18px var(--aircas-color-divider);
}
.ontology-object-attribute-panel__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ontology-object-attribute-panel__search {
  width: 240px;
}
.ontology-object-attribute-panel__table-wrap {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
}
.ontology-object-attribute-panel__table {
  width: 100%;
}
.ontology-object-attribute-panel__row-actions {
  display: inline-flex;
  gap: 8px;
}
.ontology-object-attribute-panel__empty {
  flex: 1;
}
.ontology-object-attribute-panel__table-state {
  display: grid;
  min-height: 120px;
  margin: 0;
  flex: 1;
  place-items: center;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
  text-align: center;
}
.ontology-object-attribute-panel__table-state.is-error {
  color: var(--aircas-color-danger);
}
.ontology-object-attribute-panel__dialog-error {
  margin: 8px 0 0;
  color: var(--aircas-color-danger);
  font-size: 12px;
}
.ontology-object-attribute-panel__form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}
.ontology-object-attribute-panel__form-full {
  grid-column: 1 / -1;
}
.ontology-object-attribute-panel__switches {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 4px;
}
.ontology-object-attribute-panel__switch-field {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
}
@media (max-width: 980px) {
  .ontology-object-attribute-panel {
    grid-template-columns: 230px minmax(0, 1fr);
  }
  .ontology-object-attribute-panel__content-header {
    flex-direction: column;
  }
  .ontology-object-attribute-panel__toolbar,
  .ontology-object-attribute-panel__search {
    width: 100%;
  }
}
@media (max-width: 720px) {
  .ontology-object-attribute-panel {
    grid-template-columns: 1fr;
    overflow: auto;
  }
  .ontology-object-attribute-panel__categories {
    min-height: 280px;
  }
  .ontology-object-attribute-panel__content {
    min-height: 520px;
  }
  .ontology-object-attribute-panel__toolbar {
    flex-wrap: wrap;
  }
  .ontology-object-attribute-panel__form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
