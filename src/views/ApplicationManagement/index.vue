<template>
  <div class="application-management">
    <div v-if="loading" class="application-management__state">接口文档加载中…</div>
    <div v-else-if="!endpointGroups.length" class="application-management__state">
      <p>{{ error || "暂无接口文档数据" }}</p>
      <el-button class="aircas-button" type="primary" @click="loadOntologyApiDocs">重新加载</el-button>
    </div>
    <template v-else>
      <p v-if="error" class="application-management__banner" role="status">{{ error }}</p>
      <div class="application-management__workspace">
        <ApiDocsEndpointList :groups="endpointGroups" :selected-id="selectedId" @select="selectEndpoint" />
        <ApiDocsEndpointDetail :detail="selectedDetail" :service-info="serviceInfo" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import ApiDocsEndpointDetail from "./components/ApiDocsEndpointDetail.vue";
import ApiDocsEndpointList from "./components/ApiDocsEndpointList.vue";
import { useApplicationApiDocs } from "./composables/useApplicationApiDocs";

const { loading, error, selectedId, serviceInfo, endpointGroups, selectedDetail, selectEndpoint, loadOntologyApiDocs } = useApplicationApiDocs();
</script>

<style scoped lang="scss">
.application-management {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.application-management__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
  color: var(--aircas-color-text-secondary);
  font-size: 14px;
}

.application-management__banner {
  margin: 0;
  padding: 8px 16px;
  border-bottom: 1px solid var(--aircas-color-border-soft);
  background: var(--aircas-color-panel-background-deep);
  color: var(--aircas-color-warning);
  font-size: 12px;
}

.application-management__workspace {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  flex: 1;
  min-height: 0;
}
</style>
