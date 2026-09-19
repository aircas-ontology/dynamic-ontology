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
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import HeaderBar from "./components/HeaderBar.vue";
import NavigationMenu from "./components/NavigationMenu.vue";
import BreadcrumbBar from "./components/BreadcrumbBar.vue";
const collapsed = ref(true);
</script>
<style scoped lang="scss">
.layout-shell {
  height: 100%;
  display: grid;
  grid-template-rows: 56px minmax(0, 1fr);
  min-width: 0;
  overflow: hidden;
  background: var(--aircas-color-page-background);
}
.layout-workspace {
  display: grid;
  grid-template-columns: 60px minmax(0, 1fr);
  min-height: 0;
}
.layout-workspace.is-expanded { grid-template-columns: 224px minmax(0, 1fr); }
.layout-content {
  min-width: 0;
  display: grid;
  grid-template-rows: 36px minmax(0, 1fr);
  min-height: 0;
}
.layout-page {
  min-height: 0;
  overflow: auto;
}
</style>
