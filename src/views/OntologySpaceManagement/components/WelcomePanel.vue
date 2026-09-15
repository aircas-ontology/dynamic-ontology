<template>
  <section class="welcome-panel">
    <h1>欢迎回来，<span>访客</span></h1>
    <p>在这里统一管理本体空间，支持创建、编辑、导入导出与空间运维。</p>
    <el-button class="aircas-button" type="primary" :icon="Plus" @click="$emit('create')">新建本体空间</el-button>
  </section>
</template>
<script setup lang="ts">
import { Plus } from "@element-plus/icons-vue";
defineEmits<{ create: [] }>();
</script>
<style scoped lang="scss">
.welcome-panel {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--aircas-color-border);
  border-top: 2px solid var(--aircas-color-accent-cyan);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
}
h1 { font-size: 20px; font-weight: 600; }
h1 span { color: var(--aircas-color-accent-cyan); }
p { color: var(--aircas-color-text-secondary); font-size: 12px; line-height: 1.6; }
</style>
