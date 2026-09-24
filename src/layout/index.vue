<template>
  <div class="layout-shell">
    <HeaderBar />
    <div class="layout-workspace" :class="{ 'is-expanded': !collapsed }">
      <NavigationMenu v-model:collapsed="collapsed" />
      <section class="layout-content">
        <BreadcrumbBar />
        <main class="layout-page"><router-view /></main>
      </section>
    </div>
    <AiAssistantDrawer />
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import HeaderBar from "./components/HeaderBar.vue";
import NavigationMenu from "./components/NavigationMenu.vue";
import BreadcrumbBar from "./components/BreadcrumbBar.vue";
import AiAssistantDrawer from "./components/AiAssistantDrawer.vue";
const collapsed = ref(true);
</script>
<style scoped lang="scss">
.layout-shell {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: 50px minmax(0, 1fr);
  min-width: 0;
  overflow: hidden;
  background-color: var(--aircas-color-page-background);
}
.layout-workspace {
  display: grid;
  min-width: 0;
  grid-template-columns: 60px minmax(0, 1fr);
  min-height: 0;
  transition: grid-template-columns 0.2s ease;
}
.layout-workspace.is-expanded {
  grid-template-columns: 200px minmax(0, 1fr);
}
.layout-content {
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-rows: 30px minmax(0, 1fr);
  overflow: hidden;
  background-color: var(--aircas-color-page-background);
}
.layout-page {
  min-width: 0;
  min-height: 0;
  overflow: auto;
}
</style>
