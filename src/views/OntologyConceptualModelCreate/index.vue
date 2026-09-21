<template>
  <div class="conceptual-model-create">
    <ConceptualModelTopbar
      :space-api-name="spaceApiName"
      :zoom="zoom"
      :has-selection="Boolean(selected)"
      @go-back="goBack"
      @update:space-api-name="spaceApiName = $event"
      @zoom-out="zoomOut"
      @zoom-in="zoomIn"
      @fit-canvas="fitCanvas"
      @delete-selected="deleteSelected"
      @save="saveConceptualModel"
    />
    <div class="conceptual-model-create__workspace">
      <ConceptualModelPalette :palette="palette" @add-palette="addPalette" @start-drag="startDrag" />
      <ConceptualModelCanvas
        :set-panel-el="setCanvasPanelEl"
        :zoom="zoom"
        :objects="objects"
        :relations="relations"
        :selected="selected"
        :ports="ports"
        :relation-endpoints="relationEndpoints"
        :point-for="pointFor"
        @drop-palette="dropPalette"
        @clear-selection="clearSelection"
        @select="select"
        @start-relation-port-drag="startRelationPortDrag"
        @start-object-drag="startObjectDrag"
        @add-attribute="addAttribute"
        @connect-port="connectPort"
      />
      <ConceptualModelInspector
        :objects="objects"
        :data-types="dataTypes"
        :selected-object="selectedObject"
        :selected-attribute="selectedAttribute"
        :selected-relation="selectedRelation"
        @update-object="updateObject"
        @update-attribute="updateAttribute"
        @update-relation="updateRelation"
        @add-attribute="addAttribute"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ConceptualModelCanvas from "./components/ConceptualModelCanvas.vue";
import ConceptualModelInspector from "./components/ConceptualModelInspector.vue";
import ConceptualModelPalette from "./components/ConceptualModelPalette.vue";
import ConceptualModelTopbar from "./components/ConceptualModelTopbar.vue";
import { useConceptualModelCanvas } from "./composables/useConceptualModelCanvas";

const {
  setCanvasPanelEl,
  spaceApiName,
  zoom,
  selected,
  objects,
  relations,
  dataTypes,
  ports,
  relationEndpoints,
  palette,
  selectedObject,
  selectedAttribute,
  selectedRelation,
  goBack,
  select,
  startDrag,
  dropPalette,
  addPalette,
  addAttribute,
  startObjectDrag,
  startRelationPortDrag,
  connectPort,
  pointFor,
  updateObject,
  updateAttribute,
  updateRelation,
  clearSelection,
  deleteSelected,
  zoomOut,
  zoomIn,
  fitCanvas,
  saveConceptualModel,
} = useConceptualModelCanvas();
</script>

<style scoped lang="scss">
.conceptual-model-create {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  gap: 12px;
  padding: 12px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-page-background);
}

.conceptual-model-create__workspace {
  display: grid;
  grid-template-columns: 280px minmax(450px, 1fr) 300px;
  gap: 12px;
  min-height: 620px;
  flex: 1;
}

@media (max-width: 1100px) {
  .conceptual-model-create__workspace {
    grid-template-columns: 240px minmax(400px, 1fr);
  }
}

@media (max-width: 720px) {
  .conceptual-model-create__workspace {
    grid-template-columns: 1fr;
  }
}
</style>
