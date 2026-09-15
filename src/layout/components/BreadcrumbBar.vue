<template>
  <nav class="breadcrumb-bar">
    <el-breadcrumb>
      <el-breadcrumb-item v-if="route.name !== 'Workspace'" :to="{ name: 'Workspace' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>{{
        String(route.meta.title || route.name || "当前页面")
      }}</el-breadcrumb-item></el-breadcrumb
    >
  </nav>
</template>
<script setup lang="ts">
import { useRoute } from "vue-router";
const route = useRoute();
</script>
<style scoped lang="scss">
.breadcrumb-bar {
  height: 30px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  background: var(--aircas-color-panel-background-deep);
}
</style>
