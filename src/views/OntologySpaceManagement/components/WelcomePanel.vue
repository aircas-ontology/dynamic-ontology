<template>
  <el-card class="aircas-card welcome-panel" shadow="never" body-class="welcome-panel__body">
    <h1>欢迎回来，<span>访客</span></h1>
    <p>在这里统一管理本体空间，支持创建、编辑、导入导出与空间运维。</p>
    <el-button class="aircas-button" type="primary" plain :icon="Plus" @click="$emit('create')">新建本体空间</el-button>
  </el-card>
</template>
<script setup lang="ts">
import { Plus } from "@element-plus/icons-vue";
defineEmits<{ create: [] }>();
</script>
<style scoped lang="scss">
.welcome-panel {
  position: relative;
  min-width: 0;
  min-height: 168px;
  border-radius: 8px;
  background: var(--aircas-color-card-background);
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
  color: var(--aircas-color-text-primary);
}

p {
  color: var(--aircas-color-text-secondary);
  font-size: 14px;
  line-height: 1.6;
}
</style>
