<template>
  <nav class="breadcrumb-bar" aria-label="页面路径">
    <el-breadcrumb>
      <el-breadcrumb-item v-if="route.name !== 'Workspace'" :to="{ name: 'Workspace' }">首页</el-breadcrumb-item>
      <template v-if="isSpaceDetail">
        <el-breadcrumb-item :to="{ name: 'OntologySpaceManagement' }">本体空间管理</el-breadcrumb-item>
        <el-breadcrumb-item>{{ spaceDisplayName }}</el-breadcrumb-item>
      </template>
      <el-breadcrumb-item v-else>{{
        String(route.meta.title || route.name || "当前页面")
      }}</el-breadcrumb-item>
    </el-breadcrumb>
  </nav>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useOntologySpaceDetailStore } from "@/stores/useOntologySpaceDetailStore";

const route = useRoute();
const detailStore = useOntologySpaceDetailStore();
const { displayName } = storeToRefs(detailStore);

const isSpaceDetail = computed(() =>
  route.matched.some((record) => record.name === "OntologySpaceManagementDetail"),
);

const spaceDisplayName = computed(() => displayName.value.trim() || "未命名空间");
</script>
<style scoped lang="scss">
.breadcrumb-bar {
  height: 36px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  background: var(--aircas-color-panel-background-deep);
  border-bottom: 1px solid var(--aircas-color-border-soft);
}
</style>
