<template>
  <nav class="breadcrumb-bar" aria-label="页面路径">
    <el-breadcrumb class="aircas-breadcrumb">
      <el-breadcrumb-item v-if="route.name !== 'Workspace'" :to="{ name: 'Workspace' }">首页</el-breadcrumb-item>
      <template v-if="isObjectDetail">
        <el-breadcrumb-item :to="{ name: 'OntologySpaceManagement' }">本体空间管理</el-breadcrumb-item>
        <el-breadcrumb-item v-if="spaceName" :to="{ name: 'OntologySpaceManagementDetail', params: { spaceId } }">{{ spaceName }}</el-breadcrumb-item>
        <el-breadcrumb-item>{{ objectDisplayName }}</el-breadcrumb-item>
      </template>
      <template v-else-if="isSpaceDetail">
        <el-breadcrumb-item :to="{ name: 'OntologySpaceManagement' }">本体空间管理</el-breadcrumb-item>
        <el-breadcrumb-item>{{ spaceDisplayName }}</el-breadcrumb-item>
      </template>
      <template v-else>
        <el-breadcrumb-item>{{ String(route.meta.title || route.name || "当前页面") }}</el-breadcrumb-item>
      </template>
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

const isSpaceDetail = computed(() => route.matched.some((record) => record.name === "OntologySpaceManagementDetail"));

const isObjectDetail = computed(() => route.matched.some((record) => record.name === "OntologyObjectDetail"));

const spaceDisplayName = computed(() => displayName.value.trim() || "未命名空间");

const spaceId = computed(() => {
  const fromQuery = route.query.spaceId;
  return typeof fromQuery === "string" ? fromQuery : "";
});

const spaceName = computed(() => {
  const fromQuery = route.query.spaceName;
  return typeof fromQuery === "string" && fromQuery.trim() ? fromQuery.trim() : "";
});

const objectDisplayName = computed(() => {
  const fromQuery = route.query.objectName;
  if (typeof fromQuery === "string" && fromQuery.trim()) return fromQuery.trim();
  const fromParams = route.params.objectId;
  return typeof fromParams === "string" && fromParams ? fromParams : "本体对象详情";
});
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
