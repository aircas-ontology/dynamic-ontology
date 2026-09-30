<template>
  <div class="space-card-grid">
    <article v-for="space in spaces" :key="space.id" class="space-card">
      <header class="space-card__name">
        <span class="space-card__logo">
          <img v-if="space.iconUrl" :src="space.iconUrl" alt="" />
          <el-icon v-else :size="22">
            <Box />
          </el-icon>
        </span>
        <div>
          <strong>{{ space.displayName }}</strong>
          <small>{{ space.apiName }}</small>
        </div>
      </header>
      <p class="space-card__description">{{ space.description || "暂无描述" }}</p>
      <dl>
        <div>
          <dt>
            <el-icon> <DataLine /> </el-icon>对象
          </dt>
          <dd>{{ space.metrics.ontology }}</dd>
        </div>
        <div>
          <dt>
            <el-icon> <Operation /> </el-icon>行为
          </dt>
          <dd>{{ space.metrics.behavior }}</dd>
        </div>
        <div>
          <dt>
            <el-icon> <Connection /> </el-icon>关系
          </dt>
          <dd>{{ space.metrics.relation }}</dd>
        </div>
        <div>
          <dt>
            <el-icon> <Tickets /> </el-icon>规则
          </dt>
          <dd>{{ space.metrics.rule }}</dd>
        </div>
      </dl>
      <footer class="space-card__footer">
        <div class="space-card__meta">
          <div class="space-card__meta-row">
            <span class="space-card__meta-label">创建：</span>
            <span class="space-card__meta-value">{{ space.createdTime }}</span>
          </div>
          <div class="space-card__meta-row">
            <span class="space-card__meta-label">更新：</span>
            <span class="space-card__meta-value">{{ space.updatedTime }}</span>
          </div>
        </div>
        <SpaceActions :space="space" @action="emit('action', $event, space)" />
      </footer>
    </article>
  </div>
</template>

<script setup lang="ts">
import { Box, Connection, DataLine, Operation, Tickets } from "@element-plus/icons-vue";
import type { OntologySpaceAction, OntologySpaceItem } from "@/types";
import SpaceActions from "./SpaceActions.vue";

defineProps<{ spaces: OntologySpaceItem[] }>();
const emit = defineEmits<{ action: [action: OntologySpaceAction, space: OntologySpaceItem] }>();
</script>

<style scoped lang="scss">
.space-card-grid {
  display: grid;
  align-content: start;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
  min-height: 320px;
  padding: 12px;
  border: 1px solid var(--aircas-color-accent-cyan-border);
  border-radius: 8px;
  overflow-y: auto;
  background: linear-gradient(160deg, var(--aircas-color-overlay), var(--aircas-color-overlay-deep));
  box-shadow:
    inset 0 0 28px var(--aircas-color-page-glow),
    0 0 18px var(--aircas-color-accent-blue-soft);
}

.space-card {
  display: flex;
  min-width: 0;
  padding: 12px;
  flex-direction: column;
  gap: 8px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(140deg, var(--aircas-color-panel-background), var(--aircas-color-overlay));
  box-shadow: 0 2px 12px var(--aircas-color-page-glow);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.space-card:hover {
  border-color: var(--aircas-color-accent-cyan);
  box-shadow:
    0 0 16px var(--aircas-color-accent-cyan-soft),
    inset 0 0 14px var(--aircas-color-accent-blue-soft);
  transform: translateY(-2px);
}

.space-card:hover .space-card__logo {
  transform: scale(1.05);
  border-color: var(--aircas-color-accent-cyan);
  box-shadow: 0 0 14px var(--aircas-color-accent-cyan-shadow);
}

.space-card__name {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: 10px;
}

.space-card__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid var(--aircas-color-accent-cyan-border);
  border-radius: 8px;
  background: var(--aircas-color-section-header);
  box-shadow: 0 0 12px var(--aircas-color-accent-blue-soft);
  color: var(--aircas-color-accent-cyan);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.space-card__logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.space-card__name div {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.space-card__name strong {
  display: block;
  overflow: hidden;
  color: var(--aircas-color-text-primary);
  font-size: 15px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.space-card__name small {
  display: block;
  overflow: hidden;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.space-card__description {
  margin: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.space-card dl {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  margin: 0;
  padding: 6px 0;
}

.space-card dl > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.space-card dt {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  white-space: nowrap;
}

.space-card dt .el-icon {
  color: var(--aircas-color-accent-blue);
  font-size: 15px;
}

.space-card dl > div:nth-child(2) .el-icon {
  color: var(--aircas-color-accent-purple);
}

.space-card dd {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.space-card__footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px dashed var(--aircas-color-border-soft);
}

.space-card__meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 8px;
}

.space-card__meta-row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.space-card__meta-label {
  flex-shrink: 0;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}

.space-card__meta-value {
  overflow: hidden;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.space-card :deep(.space-actions) {
  gap: 6px;
}

.space-card :deep(.space-actions .el-button.el-button--primary.is-plain) {
  height: 28px;
  padding: 0 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.space-card :deep(.space-actions > .el-button.el-button--primary.is-plain:first-child) {
  color: var(--aircas-color-text-primary);
  border-color: var(--aircas-color-accent-cyan);
  background: linear-gradient(90deg, var(--aircas-color-active-background), var(--aircas-color-accent-blue-fill));
  box-shadow:
    inset 0 0 14px var(--aircas-color-accent-cyan-fill),
    0 0 10px var(--aircas-color-accent-cyan-soft);
}

.space-card :deep(.space-actions > .el-button.el-button--primary.is-plain:first-child:hover),
.space-card :deep(.space-actions > .el-button.el-button--primary.is-plain:first-child:focus-visible) {
  color: var(--aircas-color-text-primary);
  border-color: var(--aircas-color-accent-cyan);
  background: linear-gradient(90deg, var(--aircas-color-hover-background), var(--aircas-color-accent-cyan-soft));
  box-shadow: 0 0 14px var(--aircas-color-accent-cyan-shadow);
}

.space-card :deep(.space-actions > .el-button.el-button--primary.is-plain:nth-child(2)) {
  color: var(--aircas-color-accent-blue);
  border-color: var(--aircas-color-accent-blue-border);
  background: var(--aircas-color-accent-blue-soft);
}

.space-card :deep(.space-actions > .el-button.el-button--primary.is-plain:nth-child(2):hover),
.space-card :deep(.space-actions > .el-button.el-button--primary.is-plain:nth-child(2):focus-visible) {
  color: var(--aircas-color-text-primary);
  border-color: var(--aircas-color-accent-blue);
  background: var(--aircas-color-accent-blue-fill);
}

.space-card :deep(.space-actions .el-dropdown .el-button.el-button--primary.is-plain) {
  color: var(--aircas-color-text-secondary);
  border-color: var(--aircas-color-border);
  background: var(--aircas-color-overlay-deep);
}

.space-card :deep(.space-actions .el-dropdown .el-button.el-button--primary.is-plain:hover),
.space-card :deep(.space-actions .el-dropdown .el-button.el-button--primary.is-plain:focus-visible) {
  color: var(--aircas-color-text-primary);
  border-color: var(--aircas-color-border-highlight);
  background: var(--aircas-color-overlay-deep);
}
</style>
