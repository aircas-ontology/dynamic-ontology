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
    <el-menu class="navigation-menu__list" :default-active="route.path" :collapse="collapsed" :collapse-transition="false" router>
      <el-menu-item index="/workspace/ontology-space-management" :route="{ name: 'OntologySpaceManagement' }">
        <el-icon><Box /></el-icon>
        <template #title>对象空间管理</template>
      </el-menu-item>
      <el-menu-item index="/workspace/theme-space-management" :route="{ name: 'ThemeSpaceManagement' }">
        <el-icon><Collection /></el-icon>
        <template #title>主题管理</template>
      </el-menu-item>
      <el-menu-item index="/workspace/full-text-search" :route="{ name: 'FullTextSearch' }">
        <el-icon><Search /></el-icon>
        <template #title>全文检索</template>
      </el-menu-item>
      <el-menu-item index="/workspace/application-management" :route="{ name: 'ApplicationManagement' }">
        <el-icon><Document /></el-icon>
        <template #title>应用管理</template>
      </el-menu-item>
    </el-menu>
    <button
      class="ai-assistant-launcher"
      type="button"
      :aria-label="assistantVisible ? '关闭 AI 助手' : '打开 AI 助手'"
      :aria-expanded="assistantVisible"
      @click="assistantVisible = !assistantVisible"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 6.5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" />
      </svg>
    </button>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { Box, Collection, Document, Expand, Fold, Search } from "@element-plus/icons-vue";
const collapsed = defineModel<boolean>("collapsed", { default: true });
const assistantVisible = defineModel<boolean>("assistantVisible", { default: false });
const route = useRoute();
</script>

<style scoped lang="scss">
.navigation-menu {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid var(--aircas-color-border-light);
  background-color: var(--aircas-color-background);
}
.navigation-menu__control {
  padding: 6px;
  border-bottom: 1px solid var(--aircas-color-border-light);
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
  background: transparent;
  color: var(--aircas-color-text-secondary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.navigation-menu__toggle:hover {
  background: var(--aircas-color-hover);
}
.navigation-menu__toggle:focus-visible {
  outline: 2px solid var(--aircas-color-primary);
  outline-offset: -2px;
}
.navigation-menu__list {
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
  outline-offset: -2px;
}
.ai-assistant-launcher {
  position: absolute;
  left: 50%;
  bottom: 24px;
  z-index: 20;
  display: grid;
  width: 30px;
  height: 30px;
  padding: 0;
  place-items: center;
  transform: translateX(-50%);
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  color: var(--aircas-color-text-primary);
  background: color-mix(in srgb, var(--aircas-color-primary) 60%, transparent);
  box-shadow: 0 8px 20px var(--aircas-color-border-light);
  cursor: pointer;
}
.ai-assistant-launcher svg {
  width: 25px;
  height: 25px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.ai-assistant-launcher:hover,
.ai-assistant-launcher:focus-visible {
  border-color: var(--aircas-color-primary);
  color: var(--aircas-color-primary);
  outline: none;
}
</style>
