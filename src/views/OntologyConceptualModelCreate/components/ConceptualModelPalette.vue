<template>
  <aside class="conceptual-model-create__palette" aria-label="UML 组件">
    <span class="conceptual-model-create__eyebrow">UML COMPONENTS</span>
    <h2>UML 组件</h2>
    <p>拖入画布，或点击添加</p>
    <button
      v-for="item in palette"
      :key="item.type"
      type="button"
      class="conceptual-model-create__palette-item"
      draggable="true"
      @click="$emit('add-palette', item.type)"
      @dragstart="$emit('start-drag', item.type, $event)"
    >
      <span class="conceptual-model-create__glyph" :class="`is-${item.type}`">{{ item.glyph }}</span>
      <span>
        <strong>{{ item.label }}</strong>
        <small>{{ item.hint }}</small>
      </span>
    </button>
    <p class="conceptual-model-create__palette-note">
      将对象关系拖入画布会生成一条可伸缩的实线。青色圆点是源端，紫色圆点是目标端，分别拖到对象四边圆点后才算连接。
    </p>
  </aside>
</template>

<script setup lang="ts">
import type { ConceptualModelPaletteItem, ConceptualModelPaletteType } from "@/types";

defineProps<{
  palette: ConceptualModelPaletteItem[];
}>();

defineEmits<{
  "add-palette": [type: ConceptualModelPaletteType];
  "start-drag": [type: ConceptualModelPaletteType, event: DragEvent];
}>();
</script>

<style scoped lang="scss">
.conceptual-model-create__palette {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 10px;
  background: var(--aircas-color-panel-background);
  overflow: hidden;
}

.conceptual-model-create__palette h2 {
  margin: 0;
  font-size: 16px;
}

.conceptual-model-create__palette p {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.conceptual-model-create__eyebrow {
  color: var(--aircas-color-accent-cyan);
  font-size: 11px;
  letter-spacing: 0.12em;
}

.conceptual-model-create__palette-item {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
  margin: 10px 0;
  padding: 10px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-panel-background-deep);
  text-align: left;
  cursor: grab;
}

.conceptual-model-create__palette-item:hover {
  border-color: var(--aircas-color-accent-cyan);
}

.conceptual-model-create__palette-item span:nth-child(2) {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.conceptual-model-create__palette-item small {
  color: var(--aircas-color-text-muted);
  font-size: 11px;
}

.conceptual-model-create__glyph {
  display: grid;
  width: 72px;
  height: 52px;
  place-items: center;
  border: 1px solid var(--aircas-color-accent-cyan);
  border-radius: 6px;
  color: var(--aircas-color-accent-cyan);
  font-size: 10px;
}

.conceptual-model-create__glyph.is-attribute {
  border-style: dashed;
  color: var(--aircas-color-accent-purple);
}

.conceptual-model-create__glyph.is-relation {
  border: 0;
  font-size: 22px;
}

.conceptual-model-create__palette-note {
  padding: 12px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
  background: var(--aircas-color-panel-background-deep);
  line-height: 1.7;
}
</style>
