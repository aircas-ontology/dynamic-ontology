<template>
  <div class="object-profile-relation-graph">
    <header class="object-profile-relation-graph__header">
      <h3>关系列表 &gt;&gt;&gt;</h3>
    </header>
    <RelationGraph2dView
      class="object-profile-relation-graph__canvas"
      :items="graphItems"
      :seed-names="[centerName]"
      readonly
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import RelationGraph2dView from "@/views/SpaceRelationWorkspace/components/RelationGraph2dView.vue";
import type { EntityBrowsingObjectProfileRelationNode, OntologyRelationClass } from "@/types";

const props = defineProps<{
  centerName: string;
  nodes: EntityBrowsingObjectProfileRelationNode[];
}>();

/**
 * @description 将画像关系叶子节点映射为空间二维关系图所需的关系类列表（中心对象到各关联项）。
 */
const graphItems = computed((): OntologyRelationClass[] =>
  props.nodes.map((node, index) => ({
    id: `profile-rel-${node.id}`,
    categoryId: "profile",
    categoryName: "关系列表",
    displayName: "关联",
    apiName: `profile_rel_${index + 1}`,
    sourceName: props.centerName,
    targetName: node.name,
    sourceOntologyId: "__center__",
    targetOntologyId: node.id,
    cardinality: "一对多",
    description: "",
  })),
);
</script>

<style scoped lang="scss">
.object-profile-relation-graph {
  display: flex;
  min-width: 0;
  min-height: 220px;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
}

.object-profile-relation-graph__header h3 {
  margin: 0;
  color: var(--aircas-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.object-profile-relation-graph__canvas {
  width: 100%;
  min-height: 180px;
  height: 200px;
  flex: 0 0 auto;
  border: 0;
  border-radius: 4px;
}
</style>
