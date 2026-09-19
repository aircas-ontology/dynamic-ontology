<template>
  <section class="empty-workspace-panel" aria-label="工作区内容">
    <el-empty description="内容尚未接入" />
  </section>
</template>

<style scoped lang="scss">
.empty-workspace-panel {
  display: grid;
  place-items: center;
  min-width: 0;
  min-height: 0;
  height: 100%;
  padding: 16px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-section-background), var(--aircas-color-panel-background-deep));
  box-shadow: inset 0 0 20px var(--aircas-color-divider);
}
</style>
