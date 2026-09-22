<template>
  <aside class="navigation-menu" aria-label="主导航">
    <div class="navigation-menu__control">
      <button
        class="navigation-menu__toggle"
        type="button"
        :aria-label="collapsed ? '展开导航菜单' : '收起导航菜单'"
        :aria-expanded="!collapsed"
        @click="collapsed = !collapsed"
      >
        <el-icon><Expand v-if="collapsed" /><Fold v-else /></el-icon>
        <span v-if="!collapsed">收起菜单</span>
      </button>
    </div>
    <el-menu class="aircas-menu navigation-menu__list" :default-active="route.path" :collapse="collapsed" :collapse-transition="false" router>
      <el-menu-item index="/workspace/ontology-space-management" :route="{ name: 'OntologySpaceManagement' }">
        <el-icon><Box /></el-icon>
        <template #title>本体空间管理</template>
      </el-menu-item>
      <el-menu-item index="/workspace/full-text-search" :route="{ name: 'FullTextSearch' }">
        <el-icon><Search /></el-icon>
        <template #title>全文检索</template>
      </el-menu-item>
    </el-menu>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { Box, Expand, Fold, Search } from "@element-plus/icons-vue";
const collapsed = defineModel<boolean>("collapsed", { default: true });
const route = useRoute();
</script>

<style scoped lang="scss">
.navigation-menu {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid var(--aircas-color-border-soft);
  background-color: var(--aircas-color-background);
}
.navigation-menu__control {
  padding: 6px;
  border-bottom: 1px solid var(--aircas-color-border-soft);
  background: var(--aircas-color-panel-background-deep);
}
.navigation-menu__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 28px;
  border: 0;
  background: var(--aircas-color-transparent);
  color: var(--aircas-color-text-secondary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.navigation-menu__toggle:hover {
  background: var(--aircas-color-hover-background);
}
.navigation-menu__toggle:focus-visible {
  outline: 2px solid var(--aircas-color-accent-cyan);
  outline-offset: -2px;
}
.navigation-menu__list {
  --el-menu-item-height: 48px;
  --el-menu-base-level-padding: 18px;
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow-y: auto;
  border-right: 0;
}
:deep(.el-menu-item) {
  font-size: 13px;
}
:deep(.el-menu-item:focus-visible) {
  outline: 2px solid var(--aircas-color-accent-cyan);
  outline-offset: -2px;
}
</style>
