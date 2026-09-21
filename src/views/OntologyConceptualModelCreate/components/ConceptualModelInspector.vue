<template>
  <aside class="conceptual-model-create__inspector" aria-label="模型检查器">
    <template v-if="selectedObject">
      <h2>对象检查器</h2>
      <small>对齐对象创建表单的核心字段</small>
      <el-form class="aircas-form" label-position="top">
        <el-form-item label="API 名称">
          <el-input class="aircas-input" :model-value="selectedObject.apiName" @update:model-value="$emit('update-object', 'apiName', $event)" />
        </el-form-item>
        <el-form-item label="显示名称">
          <el-input class="aircas-input" :model-value="selectedObject.displayName" @update:model-value="$emit('update-object', 'displayName', $event)" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            class="aircas-input"
            type="textarea"
            :rows="3"
            :model-value="selectedObject.description"
            @update:model-value="$emit('update-object', 'description', $event)"
          />
        </el-form-item>
      </el-form>
      <el-button class="aircas-button" type="primary" @click="$emit('add-attribute', selectedObject.id)">添加属性</el-button>
    </template>
    <template v-else-if="selectedAttribute">
      <h2>属性检查器</h2>
      <small>所属对象：{{ selectedAttribute.owner }}</small>
      <el-form class="aircas-form" label-position="top">
        <el-form-item label="属性名称">
          <el-input class="aircas-input" :model-value="selectedAttribute.displayName" @update:model-value="$emit('update-attribute', 'displayName', $event)" />
        </el-form-item>
        <el-form-item label="API">
          <el-input class="aircas-input" :model-value="selectedAttribute.apiName" @update:model-value="$emit('update-attribute', 'apiName', $event)" />
        </el-form-item>
        <el-form-item label="数据类型">
          <el-select class="aircas-input" :model-value="selectedAttribute.dataType" @update:model-value="$emit('update-attribute', 'dataType', $event)">
            <el-option v-for="type in dataTypes" :key="type" :label="type" :value="type" />
          </el-select>
        </el-form-item>
        <el-form-item label="默认值">
          <el-input
            class="aircas-input"
            :model-value="selectedAttribute.defaultValue"
            @update:model-value="$emit('update-attribute', 'defaultValue', $event)"
          />
        </el-form-item>
        <el-form-item label="属性描述">
          <el-input
            class="aircas-input"
            type="textarea"
            :rows="2"
            :model-value="selectedAttribute.description"
            @update:model-value="$emit('update-attribute', 'description', $event)"
          />
        </el-form-item>
      </el-form>
      <el-checkbox :model-value="selectedAttribute.isPrimary" @update:model-value="$emit('update-attribute', 'isPrimary', $event)">主键</el-checkbox>
      <el-checkbox :model-value="selectedAttribute.isNameKey" @update:model-value="$emit('update-attribute', 'isNameKey', $event)">名称键</el-checkbox>
    </template>
    <template v-else-if="selectedRelation">
      <h2>关系检查器</h2>
      <small>拖动两端连到对象四边圆点，或在此选择源/目标</small>
      <el-form class="aircas-form" label-position="top">
        <el-form-item label="关系名称">
          <el-input class="aircas-input" :model-value="selectedRelation.displayName" @update:model-value="$emit('update-relation', 'displayName', $event)" />
        </el-form-item>
        <el-form-item label="API 名称">
          <el-input class="aircas-input" :model-value="selectedRelation.apiName" @update:model-value="$emit('update-relation', 'apiName', $event)" />
        </el-form-item>
        <el-form-item label="源对象">
          <el-select class="aircas-input" clearable :model-value="selectedRelation.sourceId" @update:model-value="$emit('update-relation', 'sourceId', $event)">
            <el-option v-for="object in objects" :key="object.id" :label="object.displayName" :value="object.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标对象">
          <el-select class="aircas-input" clearable :model-value="selectedRelation.targetId" @update:model-value="$emit('update-relation', 'targetId', $event)">
            <el-option v-for="object in objects" :key="object.id" :label="object.displayName" :value="object.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            class="aircas-input"
            type="textarea"
            :rows="3"
            :model-value="selectedRelation.description"
            @update:model-value="$emit('update-relation', 'description', $event)"
          />
        </el-form-item>
      </el-form>
    </template>
    <div v-else class="conceptual-model-create__inspector-empty">选择画布中的对象、属性或关系进行编辑</div>
  </aside>
</template>

<script setup lang="ts">
import type { ConceptualModelAttribute, ConceptualModelObject, ConceptualModelRelation, ConceptualModelSelectedAttribute } from "@/types";

defineProps<{
  objects: ConceptualModelObject[];
  dataTypes: string[];
  selectedObject?: ConceptualModelObject;
  selectedAttribute?: ConceptualModelSelectedAttribute;
  selectedRelation?: ConceptualModelRelation;
}>();

defineEmits<{
  "update-object": [field: "apiName" | "displayName" | "description", value: string];
  "update-attribute": [field: keyof ConceptualModelAttribute, value: string | boolean | number];
  "update-relation": [field: keyof ConceptualModelRelation, value: string | number | null | undefined];
  "add-attribute": [objectId: number];
}>();
</script>

<style scoped lang="scss">
.conceptual-model-create__inspector {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 10px;
  background: var(--aircas-color-panel-background);
  overflow: hidden;
}

.conceptual-model-create__inspector h2 {
  margin: 0 0 5px;
  font-size: 16px;
}

.conceptual-model-create__inspector small {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}

.conceptual-model-create__inspector-empty {
  display: grid;
  min-height: 200px;
  place-items: center;
  color: var(--aircas-color-text-muted);
  text-align: center;
  font-size: 12px;
}

.conceptual-model-create__inspector :deep(.el-checkbox) {
  margin-right: 14px;
}

@media (max-width: 1100px) {
  .conceptual-model-create__inspector {
    display: none;
  }
}
</style>
