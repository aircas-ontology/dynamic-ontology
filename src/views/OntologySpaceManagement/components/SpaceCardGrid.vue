<template>
  <div class="space-card-grid">
    <article v-for="space in spaces" :key="space.id" class="space-card">
      <header class="space-card__name">
        <img v-if="space.iconUrl" :src="space.iconUrl" alt="" />
        <el-icon v-else :size="32">
          <Box />
        </el-icon>
        <div>
          <strong>{{ space.displayName }}</strong
          ><small>{{ space.apiName }}</small>
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
      <p class="space-card__meta">创建：{{ space.createdTime }} · 更新：{{ space.updatedTime }}</p>
      <SpaceActions :space="space" @action="emit('action', $event, space)" />
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
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
  gap: 12px;
  min-height: 320px;
  padding: 12px;
  border: 1px solid var(--aircas-color-cyan-border);
  border-radius: 8px;
  overflow-y: auto;
  background: linear-gradient(160deg, var(--aircas-color-panel-overlay), var(--aircas-color-panel-overlay-deep));
  box-shadow:
    inset 0 0 28px var(--aircas-color-border-shadow),
    0 0 18px var(--aircas-color-blue-soft);
}

.space-card {
  display: flex;
  min-width: 0;
  padding: 12px;
  flex-direction: column;
  gap: 8px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(140deg, var(--aircas-color-panel-background), var(--aircas-color-panel-overlay));
  box-shadow: 0 2px 12px var(--aircas-color-border-shadow);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.space-card:hover {
  border-color: var(--aircas-color-accent-cyan);
  box-shadow:
    0 0 16px var(--aircas-color-cyan-soft),
    inset 0 0 14px var(--aircas-color-blue-soft);
  transform: translateY(-2px);
}

.space-card__name {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.space-card__name img {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.space-card__name div {
  min-width: 0;
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
  margin-top: 4px;
  overflow-wrap: anywhere;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}

.space-card__description {
  color: var(--aircas-color-text-secondary);
  font-size: 14px;
  overflow-wrap: anywhere;
}

.space-card dl {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  text-align: center;
}

.space-card dt {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}

.space-card dd {
  margin-top: 8px;
  color: var(--aircas-color-text-primary);
  font-weight: 700;
}

.space-card__meta {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}
</style>
