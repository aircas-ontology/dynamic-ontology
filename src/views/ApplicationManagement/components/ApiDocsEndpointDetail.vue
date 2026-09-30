<template>
  <section v-if="detail" class="api-docs-endpoint-detail" aria-label="接口详情">
    <header class="api-docs-endpoint-detail__header">
      <div class="api-docs-endpoint-detail__title-row">
        <span class="api-docs-endpoint-detail__method" :class="`is-${detail.method}`">{{ detail.method.toUpperCase() }}</span>
        <h2 class="api-docs-endpoint-detail__path">{{ detail.path }}</h2>
      </div>
      <p class="api-docs-endpoint-detail__summary">{{ detail.summary || "未命名接口" }}</p>
      <div class="api-docs-endpoint-detail__meta">
        <span v-for="tag in detail.tags" :key="tag" class="api-docs-endpoint-detail__tag">{{ tag }}</span>
      </div>
    </header>

    <div v-if="serviceInfo" class="api-docs-endpoint-detail__service">
      <h3 class="api-docs-endpoint-detail__section-title">服务信息</h3>
      <dl class="api-docs-endpoint-detail__service-grid">
        <div>
          <dt>OpenAPI</dt>
          <dd>{{ serviceInfo.openapi }}</dd>
        </div>
        <div>
          <dt>Base URL</dt>
          <dd>{{ serviceInfo.serverUrl || "-" }}</dd>
        </div>
      </dl>
    </div>

    <el-tabs v-model="activeTab" class="aircas-tabs api-docs-endpoint-detail__tabs">
      <el-tab-pane label="请求参数" name="parameters">
        <el-table
          v-if="detail.parameters.length"
          :data="detail.parameters"
          class="aircas-table aircas-table--flat api-docs-endpoint-detail__table"
          size="small"
          empty-text="无请求参数"
        >
          <el-table-column prop="name" label="名称" min-width="120" />
          <el-table-column prop="location" label="位置" width="88" />
          <el-table-column prop="typeLabel" label="类型" min-width="120" />
          <el-table-column label="必填" width="72">
            <template #default="{ row }">{{ row.required ? "必填" : "可选" }}</template>
          </el-table-column>
          <el-table-column prop="description" label="说明" min-width="180" show-overflow-tooltip />
        </el-table>
        <p v-else class="api-docs-endpoint-detail__empty">无请求参数</p>
      </el-tab-pane>

      <el-tab-pane label="请求体" name="body">
        <p v-if="detail.requestBodyContentTypes.length" class="api-docs-endpoint-detail__body">
          <span>{{ detail.requestBodyRequired ? "必填" : "可选" }}</span>
          <span>{{ detail.requestBodyContentTypes.join(", ") }}</span>
          <span v-if="detail.requestBodySchemaLabel">schema: {{ detail.requestBodySchemaLabel }}</span>
        </p>
        <p v-else class="api-docs-endpoint-detail__empty">无请求体</p>
      </el-tab-pane>

      <el-tab-pane label="响应" name="responses">
        <el-table
          v-if="detail.responses.length"
          :data="detail.responses"
          class="aircas-table aircas-table--flat api-docs-endpoint-detail__table"
          size="small"
          empty-text="无响应定义"
        >
          <el-table-column prop="status" label="状态码" width="100" />
          <el-table-column prop="description" label="说明" min-width="160" show-overflow-tooltip />
          <el-table-column label="Content-Type" min-width="160">
            <template #default="{ row }">{{ row.contentTypes.join(", ") || "-" }}</template>
          </el-table-column>
          <el-table-column prop="schemaLabel" label="Schema" min-width="180" show-overflow-tooltip />
        </el-table>
        <p v-else class="api-docs-endpoint-detail__empty">无响应定义</p>
      </el-tab-pane>

      <el-tab-pane label="200 响应结构" name="schema200">
        <template v-if="responseSchema200 && responseSchema200.schemaFields.length">
          <h4 v-if="responseSchema200.schemaLabel" class="api-docs-endpoint-detail__schema-title">
            <span class="api-docs-endpoint-detail__schema-label">{{ responseSchema200.schemaLabel }}</span>
          </h4>
          <el-table
            :data="responseSchema200.schemaFields"
            class="aircas-table aircas-table--flat api-docs-endpoint-detail__table api-docs-endpoint-detail__schema-table"
            size="small"
            row-key="id"
            default-expand-all
            :tree-props="{ children: 'children' }"
            empty-text="无 Schema 字段"
          >
            <el-table-column label="名称" min-width="200">
              <template #default="{ row }">
                <span class="api-docs-endpoint-detail__schema-name" :title="row.path">{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="typeLabel" label="类型" min-width="140" show-overflow-tooltip />
            <el-table-column prop="description" label="说明" min-width="180" show-overflow-tooltip />
          </el-table>
        </template>
        <p v-else class="api-docs-endpoint-detail__empty">无 200 响应结构</p>
      </el-tab-pane>
    </el-tabs>
  </section>
  <div v-else class="api-docs-endpoint-detail api-docs-endpoint-detail--empty">请选择左侧接口查看详情</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

import type { ApiDocsEndpointDetail, ApiDocsResponseRow, ApiDocsServiceInfo } from "@/types";

const props = defineProps<{
  detail: ApiDocsEndpointDetail | null;
  serviceInfo: ApiDocsServiceInfo | null;
}>();

const activeTab = ref("parameters");

const responseSchema200 = computed<ApiDocsResponseRow | null>(() => {
  if (!props.detail) {
    return null;
  }
  return props.detail.responses.find((item) => item.status === "200") ?? null;
});

watch(
  () => props.detail?.id,
  () => {
    activeTab.value = "parameters";
  },
);
</script>

<style scoped lang="scss">
.api-docs-endpoint-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 16px;
  background: var(--aircas-color-page-background);
}

.api-docs-endpoint-detail--empty {
  align-items: center;
  justify-content: center;
  color: var(--aircas-color-text-secondary);
  font-size: 14px;
}

.api-docs-endpoint-detail__title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.api-docs-endpoint-detail__method {
  flex: 0 0 auto;
  color: var(--aircas-color-accent-cyan);
  font-size: 14px;
  font-weight: 700;
}

.api-docs-endpoint-detail__method.is-post {
  color: var(--aircas-color-success);
}

.api-docs-endpoint-detail__method.is-put,
.api-docs-endpoint-detail__method.is-patch {
  color: var(--aircas-color-warning);
}

.api-docs-endpoint-detail__method.is-delete {
  color: var(--aircas-color-danger);
}

.api-docs-endpoint-detail__path {
  margin: 0;
  min-width: 0;
  overflow: hidden;
  color: var(--aircas-color-text-primary);
  font-size: 20px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.api-docs-endpoint-detail__summary {
  margin: 8px 0 0;
  color: var(--aircas-color-text-secondary);
  font-size: 14px;
}

.api-docs-endpoint-detail__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.api-docs-endpoint-detail__tag {
  padding: 2px 8px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 4px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.api-docs-endpoint-detail__section-title {
  margin: 0 0 8px;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.api-docs-endpoint-detail__service-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 16px;
  margin: 0;
}

.api-docs-endpoint-detail__service-grid dt {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.api-docs-endpoint-detail__service-grid dd {
  margin: 2px 0 0;
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  word-break: break-all;
}

.api-docs-endpoint-detail__tabs {
  min-width: 0;
  min-height: 0;
}

.api-docs-endpoint-detail__tabs :deep(.el-tabs__content) {
  min-width: 0;
  overflow: auto;
}

.api-docs-endpoint-detail__tabs :deep(.el-tab-pane) {
  min-width: 0;
}

.api-docs-endpoint-detail__empty,
.api-docs-endpoint-detail__body {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
}

.api-docs-endpoint-detail__schema-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
  color: var(--aircas-color-text-primary);
  font-size: 14px;
  font-weight: 600;
}

.api-docs-endpoint-detail__schema-label {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  font-weight: 400;
}

.api-docs-endpoint-detail__schema-name {
  color: var(--aircas-color-text-primary);
  font-size: 13px;
}

.api-docs-endpoint-detail__body {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.api-docs-endpoint-detail__table {
  width: 100%;
}
</style>
