<template>
  <el-card class="aircas-card welcome-panel" shadow="never" body-class="welcome-panel__body">
    <h1>欢迎回来，<span>访客</span></h1>
    <p>在这里统一管理本体空间，支持创建、编辑、导入导出与空间运维。</p>
    <el-button class="aircas-button welcome-panel__create" type="primary" :icon="Plus" @click="$emit('create')">新建本体空间</el-button>
  </el-card>
</template>
<script setup lang="ts">
import { Plus } from "@element-plus/icons-vue";
defineEmits<{ create: [] }>();
</script>
<style scoped lang="scss">
.welcome-panel.aircas-card {
  position: relative;
  min-width: 0;
  height: 100%;
  min-height: 150px;
  border-radius: 8px;
  background: linear-gradient(160deg, var(--aircas-color-panel-overlay), var(--aircas-color-panel-overlay-deep));
  box-shadow: inset 0 0 28px var(--aircas-color-border-shadow);
}

.welcome-panel::before {
  position: absolute;
  top: 0;
  left: 0;
  width: 26%;
  height: 2px;
  background: var(--aircas-color-accent-cyan);
  content: "";
}

:deep(.welcome-panel__body) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 12px;
  height: 100%;
  padding: 20px;
}

h1 {
  font-size: 24px;
  font-weight: 500;
}

h1 span {
  margin-left: 20px;
  color: var(--aircas-color-accent-cyan);
}

p {
  color: var(--aircas-color-text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.welcome-panel :deep(.welcome-panel__create.el-button--primary) {
  background-color: var(--aircas-color-transparent);
  border-color: var(--aircas-color-accent-cyan);
  color: var(--aircas-color-accent-cyan);
}

.welcome-panel :deep(.welcome-panel__create.el-button--primary:hover),
.welcome-panel :deep(.welcome-panel__create.el-button--primary:focus-visible) {
  background-color: var(--aircas-color-accent-cyan-fill);
  border-color: var(--aircas-color-accent-cyan);
  color: var(--aircas-color-accent-cyan);
}
</style>
