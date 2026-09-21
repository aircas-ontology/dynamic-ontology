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
        <el-button class="aircas-button" @click="$emit('open-data-source')">
          <el-icon><Connection /></el-icon>关联数据源
        </el-button>
        <el-button class="aircas-button" type="primary" @click="$emit('create-attribute')">
          <el-icon><Plus /></el-icon>添加
        </el-button>
      </div>
    </header>

    <p v-if="attributeLoading" class="ontology-object-attribute-panel__table-state">正在加载属性...</p>
    <p v-else-if="attributeError" class="ontology-object-attribute-panel__table-state is-error" role="alert">{{ attributeError }}</p>
    <div v-else-if="visibleAttributes.length" class="ontology-object-attribute-panel__table-wrap">
      <el-table :data="visibleAttributes" class="aircas-table" height="100%" row-key="uniqueIdentifier">
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
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button class="aircas-button" link size="small" @click="$emit('edit-attribute', row)">编辑</el-button>
            <el-button class="aircas-button" link type="danger" size="small" @click="$emit('remove-attribute', row)">删除</el-button>
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

defineProps<{
  selectedCategoryName: string;
  attributeSearch: string;
  attributeLoading: boolean;
  attributeError: string;
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
  padding: 16px;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-section-background), var(--aircas-color-panel-background-deep));
  box-shadow: inset 0 0 20px var(--aircas-color-divider);
}

.ontology-object-attribute-panel__content-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
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
