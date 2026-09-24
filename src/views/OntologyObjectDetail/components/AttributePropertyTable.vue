<template>
  <main class="ontology-object-attribute-panel__content">
    <header class="ontology-object-attribute-panel__content-header">
      <div>
        <h2>{{ selectedCategoryName }}</h2>
        <p>{{ visibleAttributes.length }} 个属性类</p>
      </div>
      <div class="ontology-object-attribute-panel__toolbar">
        <el-input
          class="aircas-input ontology-object-attribute-panel__search"
          :model-value="attributeSearch"
          clearable
          placeholder="搜索属性 API 或描述"
          ariaLabel="搜索属性"
          @update:model-value="$emit('update:attributeSearch', $event)"
        />
        <el-button class="aircas-button aircas-button--tone-ghost" :loading="dataSourceOpening" @click="$emit('open-data-source')">
          <el-icon><Connection /></el-icon>关联数据源
        </el-button>
        <el-button class="aircas-button aircas-button--tone-primary" @click="$emit('create-attribute')">
          <el-icon><Plus /></el-icon>添加
        </el-button>
      </div>
    </header>

    <p v-if="attributeLoading" class="ontology-object-attribute-panel__table-state"><AircasLoading>正在加载属性...</AircasLoading></p>
    <p v-else-if="attributeError" class="ontology-object-attribute-panel__table-state is-error" role="alert">{{ attributeError }}</p>
    <div v-else-if="visibleAttributes.length" class="ontology-object-attribute-panel__table-wrap">
      <el-table
        :data="visibleAttributes"
        class="aircas-table aircas-table--flat ontology-object-attribute-panel__table"
        height="100%"
        stripe
        row-key="uniqueIdentifier"
      >
        <el-table-column prop="displayName" label="属性名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="apiName" label="API" min-width="150" show-overflow-tooltip />
        <el-table-column prop="dataType" label="数据类型" width="110" />
        <el-table-column prop="storageGroup" label="存储分组" width="120" />
        <el-table-column label="默认值" min-width="110" show-overflow-tooltip>
          <template #default="{ row }">{{ row.defaultValue || "—" }}</template>
        </el-table-column>
        <el-table-column prop="description" label="属性描述" min-width="210" show-overflow-tooltip />
        <el-table-column label="主键" width="72">
          <template #default="{ row }">{{ row.isPrimary ? "是" : "否" }}</template>
        </el-table-column>
        <el-table-column label="名称键" width="72">
          <template #default="{ row }">{{ row.isNameKey ? "是" : "否" }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <div class="ontology-object-attribute-panel__row-actions">
              <el-button class="aircas-button aircas-button--tone-secondary" size="small" @click="$emit('edit-attribute', row)">编辑</el-button>
              <el-button class="aircas-button aircas-button--tone-danger" type="danger" size="small" @click="$emit('remove-attribute', row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-empty v-else class="ontology-object-attribute-panel__empty" description="暂无匹配属性" />
  </main>
</template>

<script setup lang="ts">
import { Connection, Plus } from "@element-plus/icons-vue";
import type { OntologyAttributeItem } from "@/types";
import AircasLoading from "@/components/AircasLoading.vue";

defineProps<{
  selectedCategoryName: string;
  attributeSearch: string;
  attributeLoading: boolean;
  attributeError: string;
  dataSourceOpening: boolean;
  visibleAttributes: OntologyAttributeItem[];
}>();

defineEmits<{
  "update:attributeSearch": [value: string];
  "open-data-source": [];
  "create-attribute": [];
  "edit-attribute": [row: unknown];
  "remove-attribute": [row: unknown];
}>();
</script>

<style scoped lang="scss">
.ontology-object-attribute-panel__content {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
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
  background: linear-gradient(135deg, var(--aircas-color-overlay), var(--aircas-color-overlay-deep));
  box-shadow: inset 0 0 18px var(--aircas-color-page-glow);
}

:root[theme="light"] .ontology-object-attribute-panel__content-header {
  background: linear-gradient(135deg, var(--aircas-color-card-background), var(--aircas-color-panel-background-deep));
}

.ontology-object-attribute-panel__content-header h2 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
}

.ontology-object-attribute-panel__content-header p {
  margin: 4px 0 0;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
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
  min-width: 0;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-overlay), var(--aircas-color-overlay-deep));
}

:root[theme="light"] .ontology-object-attribute-panel__table-wrap {
  background: linear-gradient(135deg, var(--aircas-color-card-background), var(--aircas-color-panel-background-deep));
}

.ontology-object-attribute-panel__table.aircas-table.aircas-table--flat.el-table {
  width: 100%;
  --el-table-bg-color: var(--aircas-color-transparent);
  --el-table-tr-bg-color: var(--aircas-color-transparent);
  --el-table-header-bg-color: var(--aircas-color-section-header);
  --el-table-row-hover-bg-color: var(--aircas-color-accent-blue-soft);
  --el-table-border-color: var(--aircas-color-border-soft);
  --el-table-text-color: var(--aircas-color-text-primary);
  --el-table-header-text-color: var(--aircas-color-text-primary);
  background-color: var(--aircas-color-transparent);
}

.ontology-object-attribute-panel__row-actions {
  display: inline-flex;
  gap: 8px;
}

.ontology-object-attribute-panel__table.aircas-table.aircas-table--flat :deep(th.el-table__cell) {
  background-color: var(--aircas-color-section-header);
  background-image: none;
  border-bottom: 1px solid var(--aircas-color-border-soft);
  color: var(--aircas-color-text-primary);
}

.ontology-object-attribute-panel__table.aircas-table.aircas-table--flat :deep(.el-table__body tr > td.el-table__cell) {
  background-color: var(--aircas-color-panel-background) !important;
  color: var(--aircas-color-text-primary);
}

.ontology-object-attribute-panel__table.aircas-table.aircas-table--flat :deep(.el-table__body tr.el-table__row--striped > td.el-table__cell) {
  background-color: var(--aircas-color-panel-background-deep) !important;
}

.ontology-object-attribute-panel__table.aircas-table.aircas-table--flat :deep(.el-table__body tr:hover > td.el-table__cell),
.ontology-object-attribute-panel__table.aircas-table.aircas-table--flat :deep(.el-table__body tr.hover-row > td.el-table__cell) {
  background-color: var(--aircas-color-accent-blue-soft) !important;
}

.ontology-object-attribute-panel__table.aircas-table.aircas-table--flat :deep(.el-table__fixed-right),
.ontology-object-attribute-panel__table.aircas-table.aircas-table--flat :deep(.el-table__fixed-right-patch) {
  background: var(--aircas-color-overlay-deep);
}

:root[theme="light"] .ontology-object-attribute-panel__table.aircas-table.aircas-table--flat :deep(.el-table__fixed-right),
:root[theme="light"] .ontology-object-attribute-panel__table.aircas-table.aircas-table--flat :deep(.el-table__fixed-right-patch) {
  background: var(--aircas-color-card-background);
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

@media (max-width: 980px) {
  .ontology-object-attribute-panel__content-header {
    flex-direction: column;
  }

  .ontology-object-attribute-panel__toolbar,
  .ontology-object-attribute-panel__search {
    width: 100%;
  }
}

@media (max-width: 720px) {
  .ontology-object-attribute-panel__content {
    min-height: 520px;
  }

  .ontology-object-attribute-panel__toolbar {
    flex-wrap: wrap;
  }
}
</style>
