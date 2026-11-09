<template>
  <section class="object-profile-standard-usage" aria-label="标准应用情况">
    <aside class="object-profile-standard-usage__tree-panel" aria-label="属性分类树">
      <header class="object-profile-standard-usage__panel-header">
        <h2>属性分类树</h2>
      </header>
      <el-input v-model="categorySearch" clearable placeholder="搜索属性分类" ariaLabel="搜索属性分类" />
      <el-tree
        ref="treeRef"
        class="object-profile-standard-usage__tree"
        :data="data.categories"
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
          <span class="object-profile-standard-usage__tree-label">
            <span>{{ node.label }}</span>
            <em>{{ node.propertyCount }}</em>
          </span>
        </template>
      </el-tree>
    </aside>

    <div class="object-profile-standard-usage__main">
      <header class="object-profile-standard-usage__main-header">
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
      </header>

      <div class="object-profile-standard-usage__table-wrap">
        <el-table
          v-if="filteredRows.length"
          :data="filteredRows"
          stripe
          height="100%"
          class="object-profile-standard-usage__table aircas-table--accent-header"
        >
          <el-table-column prop="name" label="属性名称" min-width="120" show-overflow-tooltip />
          <el-table-column prop="dataType" label="数据类型" width="100" />
          <el-table-column prop="description" label="属性描述" min-width="180" show-overflow-tooltip />
          <el-table-column label="是否引用标准" width="120">
            <template #default="{ row }">{{ row.referencesStandard ? "是" : "否" }}</template>
          </el-table-column>
          <el-table-column label="标准名称" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <button
                v-if="row.referencesStandard && row.standardDetail"
                type="button"
                class="object-profile-standard-usage__std-link"
                @click="openStandardDetail(row)"
              >
                {{ row.standardName }}
              </button>
              <span v-else>{{ row.standardName }}</span>
            </template>
          </el-table-column>
          <el-table-column label="标准符合度" width="120">
            <template #default="{ row }">
              {{ formatCompliance(row.compliancePercent) }}
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无属性数据" />
      </div>
    </div>

    <el-dialog
      v-model="detailVisible"
      :title="detailDialogTitle"
      width="560px"
      destroy-on-close
      append-to-body
    >
      <dl v-if="activeDetail" class="object-profile-standard-usage__detail">
        <div><dt>所属标准</dt><dd>{{ activeDetail.standardFullName }}</dd></div>
        <div><dt>数据元统一标识符</dt><dd>{{ activeDetail.identifier }}</dd></div>
        <div><dt>数据元名称</dt><dd>{{ activeDetail.name }}</dd></div>
        <div><dt>数据元简称</dt><dd>{{ activeDetail.shortName }}</dd></div>
        <div><dt>数据元定义</dt><dd>{{ activeDetail.definition }}</dd></div>
        <div><dt>数据元值的数据类型</dt><dd>{{ activeDetail.valueDataType }}</dd></div>
        <div><dt>参数</dt><dd>{{ activeDetail.parameter }}</dd></div>
        <div><dt>计量单位</dt><dd>{{ activeDetail.unit }}</dd></div>
        <div><dt>组成模式代码</dt><dd>{{ activeDetail.compositionCode }}</dd></div>
        <div><dt>交换格式</dt><dd>{{ activeDetail.exchangeFormat }}</dd></div>
        <div><dt>数据元的值域</dt><dd>{{ activeDetail.valueDomain }}</dd></div>
        <div><dt>数据元取多值标识</dt><dd>{{ activeDetail.multiValue }}</dd></div>
      </dl>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import type { ElTree } from "element-plus";
import { resolveEntityBrowsingObjectProfileStandardUsage } from "@/mocks/entityBrowsingObjectProfileMock/entityBrowsingObjectProfileStandardUsageMock";
import type {
  EntityBrowsingObjectProfileStandardAttrRow,
  EntityBrowsingObjectProfileStandardDetail,
} from "@/types";

const props = defineProps<{
  objectId: string;
}>();

const data = computed(() => resolveEntityBrowsingObjectProfileStandardUsage(props.objectId));
const treeProps = { children: "children", label: "label" } as const;
const treeRef = ref<InstanceType<typeof ElTree>>();
const categorySearch = ref("");
const selectedCategoryId = ref("all");
const detailVisible = ref(false);
const activeDetail = ref<EntityBrowsingObjectProfileStandardDetail | null>(null);
const activeRowName = ref("");

const filteredRows = computed(() => {
  const rows = data.value.rows;
  if (selectedCategoryId.value === "all") return rows;
  return rows.filter((row) => row.categoryId === selectedCategoryId.value);
});

const summary = computed(() => {
  const rows = filteredRows.value;
  const total = rows.length;
  const referenced = rows.filter((row) => row.referencesStandard).length;
  const rates = rows
    .map((row) => row.compliancePercent)
    .filter((value): value is number => typeof value === "number");
  const avg = rates.length ? Math.round(rates.reduce((sum, n) => sum + n, 0) / rates.length) : 0;
  return {
    total,
    referenced,
    complianceLabel: rates.length ? `${avg}%` : "—",
  };
});

const detailDialogTitle = computed(() =>
  activeRowName.value ? `${activeRowName.value} · 标准详情` : "标准详情",
);

function formatCompliance(value: number | null): string {
  return value == null ? "—" : `${value}%`;
}

function filterCategoryNode(value: string, data: unknown): boolean {
  if (!value.trim()) return true;
  if (!data || typeof data !== "object" || !("label" in data)) return false;
  const label = String((data as { label?: unknown }).label ?? "");
  return label.toLowerCase().includes(value.trim().toLowerCase());
}

function handleCategoryClick(node: unknown): void {
  if (!node || typeof node !== "object" || !("id" in node)) return;
  selectedCategoryId.value = String((node as { id: unknown }).id);
}

function openStandardDetail(row: unknown): void {
  const typed = row as EntityBrowsingObjectProfileStandardAttrRow;
  if (!typed.standardDetail) return;
  activeDetail.value = typed.standardDetail;
  activeRowName.value = typed.name;
  detailVisible.value = true;
}

watch(categorySearch, (value) => {
  treeRef.value?.filter(value);
});

watch(
  () => props.objectId,
  async () => {
    selectedCategoryId.value = "all";
    categorySearch.value = "";
    detailVisible.value = false;
    await nextTick();
    treeRef.value?.filter("");
  },
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

.object-profile-standard-usage__panel-header h2 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.object-profile-standard-usage__tree {
  min-height: 0;
  flex: 1;
  overflow: auto;
  background: transparent;
}

.object-profile-standard-usage__tree-label {
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

.object-profile-standard-usage__main-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
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

.object-profile-standard-usage__table-wrap {
  min-width: 0;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.object-profile-standard-usage__table {
  width: 100%;
}

.object-profile-standard-usage__std-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--aircas-color-primary);
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
}

.object-profile-standard-usage__std-link:hover {
  color: var(--aircas-color-text-primary);
}

.object-profile-standard-usage__detail {
  display: flex;
  margin: 0;
  flex-direction: column;
  gap: 10px;
}

.object-profile-standard-usage__detail > div {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 8px 12px;
  align-items: start;
}

.object-profile-standard-usage__detail dt {
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
}

.object-profile-standard-usage__detail dd {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}

@media (max-width: 960px) {
  .object-profile-standard-usage {
    grid-template-columns: 1fr;
    overflow: auto;
  }

  .object-profile-standard-usage__tree-panel {
    min-height: 220px;
  }
}
</style>
