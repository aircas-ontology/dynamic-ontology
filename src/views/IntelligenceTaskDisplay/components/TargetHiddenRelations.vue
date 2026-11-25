<template>
  <aside class="hidden-relations">
    <header>
      <strong>隐含关系 · {{ target.name }}</strong
      ><button type="button" aria-label="关闭隐含关系" @click="emit('close')">×</button>
    </header>
    <div class="hidden-relations__filters">
      <el-radio-group :model-value="category" size="small" @update:model-value="setHiddenCategory"
        ><el-radio-button value="event">目标与事件</el-radio-button><el-radio-button value="equipment">目标与装备</el-radio-button
        ><el-radio-button value="entity">目标与相关实体</el-radio-button></el-radio-group
      >
      <el-radio-group :model-value="hops" size="small" @update:model-value="setHiddenHops"
        ><el-radio-button :value="1">一跳 · 直接</el-radio-button><el-radio-button :value="2">二跳 · 间接</el-radio-button></el-radio-group
      >
      <div class="hidden-relations__legend">
        <span>目标 · 关系</span><span>{{ nodeCount }} 个节点 · {{ relations.length }} 条关系</span>
      </div>
    </div>
    <div class="hidden-relations__graph">
      <OntologyRelationGraph2d :items="relations" :seed-names="[target.name]" circular-layout readonly empty-description="暂无关联关系" />
    </div>
    <footer>
      <el-button size="small" :disabled="!relations.length" @click="verified = true">核验</el-button
      ><span>{{ verified ? "模拟核验完成" : `对 ${relations.length} 条关系进行模拟核验` }}</span>
    </footer>
  </aside>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import OntologyRelationGraph2d from "@/components/OntologyRelationGraph2d.vue";
import { taskDisplayEvents, taskDisplayTargets } from "@/mocks/intelligenceTaskDisplayMock";
import { buildHiddenRelations, type HiddenRelationCategory } from "../utils/hiddenRelations";
const props = defineProps<{ target: { id: string; name: string; type: string } }>();
const emit = defineEmits<{ close: [] }>();
const category = ref<HiddenRelationCategory>("event");
const hops = ref<1 | 2>(1);
const verified = ref(false);
/** @description 更新隐含关系分类。 @param value 选择值。 */
function setHiddenCategory(value: string | number | boolean | undefined): void {
  if (value === "event" || value === "equipment" || value === "entity") category.value = value;
}
/** @description 更新关系跳数。 @param value 选择值。 */
function setHiddenHops(value: string | number | boolean | undefined): void {
  if (value === 1 || value === 2) hops.value = value;
}
const relations = computed(() =>
  buildHiddenRelations(
    props.target,
    taskDisplayTargets,
    taskDisplayEvents.flatMap((phase) => phase.events),
    category.value,
    hops.value,
  ),
);
const nodeCount = computed(() => (relations.value.length ? new Set(relations.value.flatMap((item) => [item.sourceName, item.targetName])).size : 0));
watch(
  () => [props.target.id, category.value, hops.value],
  () => {
    verified.value = false;
  },
);
</script>
<style scoped lang="scss">
.hidden-relations {
  position: absolute;
  z-index: 5;
  top: 12px;
  right: 12px;
  width: min(440px, calc(100% - 24px));
  height: min(560px, calc(100% - 24px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--aircas-color-primary);
  border-radius: 6px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-panel-background);
}
.hidden-relations header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid var(--aircas-color-border);
}
.hidden-relations header button {
  margin-left: auto;
  border: 0;
  color: inherit;
  background: transparent;
  cursor: pointer;
}
.hidden-relations__filters {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
}
.hidden-relations__legend {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.hidden-relations__graph {
  display: flex;
  flex: 1;
  min-height: 0;
  padding: 0 12px;
}
.hidden-relations footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
</style>
