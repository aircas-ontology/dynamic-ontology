<template>
  <section class="object-profile-standard-usage" aria-label="属性列表">
    <aside class="object-profile-standard-usage__tree-panel" aria-label="属性分类树">
      <header class="object-profile-standard-usage__panel-header">
        <h2>属性分类树</h2>
      </header>
      <el-input v-model="categorySearch" clearable placeholder="搜索属性分类" ariaLabel="搜索属性分类" />
      <p v-if="treeLoading" class="object-profile-standard-usage__state" role="status">
        <AircasLoading>正在加载属性分类...</AircasLoading>
      </p>
      <p v-else-if="treeError" class="object-profile-standard-usage__state is-error" role="alert">
        {{ treeError }}
        <el-button size="small" @click="loadAttributeCategoryTree">重试</el-button>
      </p>
      <el-empty v-else-if="treeEmpty" class="object-profile-standard-usage__empty" description="暂无分类树数据" />
      <el-tree
        v-else
        ref="treeRef"
        class="object-profile-standard-usage__tree"
        :data="categories"
        node-key="id"
        :props="treeProps"
        default-expand-all
        highlight-current
        :current-node-key="selectedCategoryId"
        :expand-on-click-node="false"
        :filter-node-method="filterCategoryNode"
        @node-click="handleCategoryClick"
      >
        <template #default="{ data: node }">
          <span v-if="isCategoryNode(node)" class="object-profile-standard-usage__tree-label">
            <el-icon><FolderOpened /></el-icon>
            <span>{{ node.label }}</span>
            <em>{{ node.propertyCount }}</em>
          </span>
          <span v-else class="object-profile-standard-usage__tree-property" :title="node.label">
            <span class="object-profile-standard-usage__tree-property-dot" aria-hidden="true"></span>
            <span>{{ node.label }}</span>
          </span>
        </template>
      </el-tree>
    </aside>

    <div class="object-profile-standard-usage__main">
      <header class="object-profile-standard-usage__main-header">
        <div class="object-profile-standard-usage__title-block">
          <h3>{{ selectedCategoryName }}</h3>
          <div class="object-profile-standard-usage__summary" role="group" aria-label="标准应用情况">
            <article class="object-profile-standard-usage__badge">
              <span>属性总数</span>
              <strong>{{ summary.total }}</strong>
            </article>
            <article class="object-profile-standard-usage__badge">
              <span>标准引用数</span>
              <strong>{{ summary.referenced }}</strong>
            </article>
            <article class="object-profile-standard-usage__badge">
              <span>标准符合度</span>
              <strong>{{ summary.complianceLabel }}</strong>
            </article>
          </div>
        </div>
        <el-input v-model="attributeSearch" class="object-profile-standard-usage__search" clearable placeholder="搜索属性 API 或描述" ariaLabel="搜索属性" />
      </header>

      <p v-if="treeLoading" class="object-profile-standard-usage__state" role="status">
        <AircasLoading>正在加载属性...</AircasLoading>
      </p>
      <p v-else-if="treeError" class="object-profile-standard-usage__state is-error" role="alert">{{ treeError }}</p>
      <div v-else class="object-profile-standard-usage__table-wrap">
        <el-table
          :data="displayRows"
          class="object-profile-standard-usage__table aircas-table--accent-header"
          height="100%"
          stripe
          row-key="id"
          empty-text="暂无匹配属性"
        >
          <el-table-column prop="name" label="属性名称" min-width="120" show-overflow-tooltip />
          <el-table-column prop="dataType" label="数据类型" width="100" />
          <el-table-column prop="description" label="属性描述" min-width="180" show-overflow-tooltip />
          <el-table-column label="是否引用标准" width="120">
            <template #default="{ row }">{{ row.referencesStandard ? "是" : "否" }}</template>
          </el-table-column>
          <el-table-column label="标准名称" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">{{ row.standardName || "—" }}</template>
          </el-table-column>
          <el-table-column label="标准符合度" width="120">
            <template #default="{ row }">{{ formatCompliance(row.compliancePercent) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { FolderOpened } from "@element-plus/icons-vue";
import type { ElTree } from "element-plus";
import { getOntologyObjectArrTypeTreeInterface } from "@/apis";
import AircasLoading from "@/components/AircasLoading.vue";
import type { OntologyAttributeCategoryNode, OntologyAttributeItem, OntologyAttributeTreeNode } from "@/types";
import {
  collectPropertyItemsFromTree,
  filterCategoryNode,
  findCategory,
  isCategoryNode,
  mapCategoryTreeNode,
} from "@/views/OntologyObjectAttributePanel/utils/attributePanelHelpers";

const props = defineProps<{
  objectId: string;
}>();

const treeProps = { children: "children", label: "label" } as const;
const treeRef = ref<InstanceType<typeof ElTree>>();
const categories = ref<OntologyAttributeCategoryNode[]>([]);
const categorySearch = ref("");
const attributeSearch = ref("");
const selectedCategoryId = ref("all");
const treeLoading = ref(false);
const treeError = ref("");
const treeEmpty = ref(false);
let loadGeneration = 0;

const selectedCategoryName = computed(() => {
  if (selectedCategoryId.value === "all") return "全部属性";
  return findCategory(categories.value, selectedCategoryId.value)?.label ?? "全部属性";
});

const attributes = computed(() => {
  const ontologyUniqueIdentifier = props.objectId.trim();
  if (!ontologyUniqueIdentifier || !categories.value.length) return [] as OntologyAttributeItem[];
  if (selectedCategoryId.value === "all") {
    return collectPropertyItemsFromTree(categories.value, ontologyUniqueIdentifier);
  }
  const selected = findCategory(categories.value, selectedCategoryId.value);
  return selected ? collectPropertyItemsFromTree([selected], ontologyUniqueIdentifier) : [];
});

const visibleAttributes = computed(() => {
  const keyword = attributeSearch.value.trim().toLowerCase();
  if (!keyword) return attributes.value;
  return attributes.value.filter((item) => `${item.displayName} ${item.apiName} ${item.description}`.toLowerCase().includes(keyword));
});

/** 标准应用表格行：属性基础字段来自接口，标准侧暂无接口时留空。 */
interface StandardDisplayRow {
  id: string;
  name: string;
  dataType: string;
  description: string;
  referencesStandard: boolean;
  standardName: string;
  compliancePercent: number | null;
}

const displayRows = computed<StandardDisplayRow[]>(() =>
  visibleAttributes.value.map((item) => ({
    id: item.uniqueIdentifier || `${item.apiName}:${item.displayName}`,
    name: item.displayName || item.apiName || "—",
    dataType: item.dataType || "—",
    description: item.description || "",
    referencesStandard: false,
    standardName: "",
    compliancePercent: null,
  })),
);

const summary = computed(() => ({
  total: displayRows.value.length,
  referenced: 0,
  complianceLabel: "—",
}));

/**
 * @description 格式化标准符合度；无数据时展示占位符。
 * @param value 符合度数值。
 * @returns 展示文案。
 */
function formatCompliance(value: number | null): string {
  return value == null ? "—" : `${value}%`;
}

/**
 * @description 查询当前对象的属性分类树并更新左侧分类与右侧属性列表。
 */
async function loadAttributeCategoryTree() {
  const ontologyUniqueIdentifier = props.objectId.trim();
  const current = ++loadGeneration;
  if (!ontologyUniqueIdentifier) {
    categories.value = [];
    selectedCategoryId.value = "all";
    treeEmpty.value = true;
    treeError.value = "缺少对象标识，无法加载属性分类。";
    treeLoading.value = false;
    return;
  }
  treeLoading.value = true;
  treeError.value = "";
  treeEmpty.value = false;
  try {
    const response = await getOntologyObjectArrTypeTreeInterface({ ontologyUniqueIdentifier });
    if (current !== loadGeneration) return;
    if (response.code !== 200) throw new Error(response.message || "属性分类查询失败");
    if (!response.data) {
      categories.value = [];
      selectedCategoryId.value = "all";
      treeEmpty.value = true;
      return;
    }
    const root = mapCategoryTreeNode(response.data);
    categories.value = [root];
    selectedCategoryId.value = root.isRoot ? "all" : root.id;
    treeEmpty.value = false;
  } catch (cause) {
    if (current !== loadGeneration) return;
    categories.value = [];
    selectedCategoryId.value = "all";
    treeEmpty.value = false;
    treeError.value = cause instanceof Error && cause.message.trim() ? cause.message : "属性分类查询失败，请重试。";
  } finally {
    if (current === loadGeneration) treeLoading.value = false;
  }
}

/**
 * @description 仅允许选中分类节点并刷新右侧属性列表。
 * @param node 树节点。
 */
function handleCategoryClick(node: OntologyAttributeTreeNode) {
  if (!isCategoryNode(node)) return;
  selectedCategoryId.value = node.isRoot ? "all" : node.id;
}

watch(categorySearch, (value) => {
  treeRef.value?.filter(value);
});

watch(
  () => props.objectId,
  async () => {
    categorySearch.value = "";
    attributeSearch.value = "";
    selectedCategoryId.value = "all";
    await loadAttributeCategoryTree();
    await nextTick();
    treeRef.value?.filter("");
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.object-profile-standard-usage {
  display: grid;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 8px;
}

.object-profile-standard-usage__tree-panel,
.object-profile-standard-usage__main {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
}

.object-profile-standard-usage__panel-header h2,
.object-profile-standard-usage__main-header h3 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.object-profile-standard-usage__main-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.object-profile-standard-usage__title-block {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 8px;
}

.object-profile-standard-usage__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.object-profile-standard-usage__badge {
  display: flex;
  min-width: 110px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--aircas-color-effect-primary-soft) 70%, transparent);
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.object-profile-standard-usage__badge strong {
  color: var(--aircas-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.object-profile-standard-usage__search {
  width: min(280px, 100%);
}

.object-profile-standard-usage__tree {
  min-height: 0;
  flex: 1;
  overflow: auto;
  background: transparent;
}

.object-profile-standard-usage__tree-label,
.object-profile-standard-usage__tree-property {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--aircas-color-text-primary);
  font-size: 13px;
}

.object-profile-standard-usage__tree-label em {
  color: var(--aircas-color-text-secondary);
  font-style: normal;
  font-size: 12px;
}

.object-profile-standard-usage__tree-property-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--aircas-color-primary);
}

.object-profile-standard-usage__table-wrap {
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.object-profile-standard-usage__table {
  width: 100%;
}

.object-profile-standard-usage__state,
.object-profile-standard-usage__empty {
  display: flex;
  min-height: 120px;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
}

.object-profile-standard-usage__state.is-error {
  color: var(--aircas-color-danger);
}
</style>
