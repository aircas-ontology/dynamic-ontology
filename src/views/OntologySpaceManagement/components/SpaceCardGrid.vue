<template>
  <div class="space-card-grid">
    <article v-for="space in spaces" :key="space.id" class="space-card">
      <header class="space-card__name">
        <img v-if="space.iconUrl" :src="space.iconUrl" alt="" />
        <el-icon v-else :size="32"><Box /></el-icon>
        <div><strong>{{ space.displayName }}</strong><small>{{ space.apiName }}</small></div>
      </header>
      <p class="space-card__description">{{ space.description || "暂无描述" }}</p>
      <dl>
        <div><dt><el-icon><DataLine /></el-icon>对象</dt><dd>{{ space.metrics.ontology }}</dd></div>
        <div><dt><el-icon><Operation /></el-icon>行为</dt><dd>{{ space.metrics.behavior }}</dd></div>
        <div><dt><el-icon><Connection /></el-icon>关系</dt><dd>{{ space.metrics.relation }}</dd></div>
        <div><dt><el-icon><Tickets /></el-icon>规则</dt><dd>{{ space.metrics.rule }}</dd></div>
      </dl>
      <p class="space-card__meta">创建：{{ space.createdAt }} · 更新：{{ space.updatedAt }}</p>
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
.space-card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 16px; padding-bottom: 16px; }
.space-card { display: flex; min-width: 0; padding: 16px; flex-direction: column; gap: 16px; border: 1px solid var(--aircas-color-border); border-radius: 8px; background: var(--aircas-color-card-background); }
.space-card__name { display: flex; min-width: 0; align-items: center; gap: 12px; }
.space-card__name img { width: 48px; height: 48px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
.space-card__name div { min-width: 0; }
.space-card__name strong { display: block; overflow: hidden; font-size: 16px; text-overflow: ellipsis; white-space: nowrap; }
.space-card__name small { display: block; margin-top: 4px; overflow-wrap: anywhere; color: var(--aircas-color-text-muted); font-size: 14px; }
.space-card__description { color: var(--aircas-color-text-secondary); font-size: 14px; overflow-wrap: anywhere; }
.space-card dl { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; text-align: center; }
.space-card dt { display: inline-flex; align-items: center; gap: 4px; color: var(--aircas-color-text-muted); font-size: 12px; }
.space-card dd { margin-top: 8px; color: var(--aircas-color-text-primary); font-weight: 700; }
.space-card__meta { color: var(--aircas-color-text-muted); font-size: 12px; }
</style>
