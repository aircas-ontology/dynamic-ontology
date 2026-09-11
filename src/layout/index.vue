<template>
  <div class="layout-shell"></div>
</template>

<script setup lang="ts">
import { ref } from "vue";
</script>

<style lang="scss" scoped>
.layout-shell {
  display: grid;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  grid-template-rows: 50px minmax(0, 1fr);
  overflow: hidden;
  background-color: var(--aircas-color-page-background);
}

.layout-workspace {
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-columns: 60px minmax(0, 1fr);
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
  overflow: hidden;
}
</style>
