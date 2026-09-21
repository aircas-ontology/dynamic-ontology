<template>
  <header class="conceptual-model-create__topbar">
    <el-button class="aircas-button" @click="$emit('go-back')">返回</el-button>
    <div class="conceptual-model-create__identity">
      <span class="conceptual-model-create__eyebrow">空间概念模型</span>
      <h1>概念模型画布</h1>
      <p>拖拽 UML 对象构建空间骨架，保存后自动写入默认「全部」分类</p>
    </div>
    <el-input
      class="aircas-input conceptual-model-create__space-input"
      :model-value="spaceApiName"
      ariaLabel="空间 API 名称"
      placeholder="空间 API 名称"
      @update:model-value="$emit('update:spaceApiName', $event)"
    />
    <div class="conceptual-model-create__actions">
      <span>{{ zoom }}%</span>
      <el-button class="aircas-button" size="small" @click="$emit('zoom-out')">缩小</el-button>
      <el-button class="aircas-button" size="small" @click="$emit('zoom-in')">放大</el-button>
      <el-button class="aircas-button" size="small" @click="$emit('fit-canvas')">适应画布</el-button>
      <el-button class="aircas-button" type="danger" size="small" :disabled="!hasSelection" @click="$emit('delete-selected')">删除选中</el-button>
      <el-button class="aircas-button" type="primary" size="small" @click="$emit('save')">保存并创建空间</el-button>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  spaceApiName: string;
  zoom: number;
  hasSelection: boolean;
}>();

defineEmits<{
  "go-back": [];
  "update:spaceApiName": [value: string];
  "zoom-out": [];
  "zoom-in": [];
  "fit-canvas": [];
  "delete-selected": [];
  save: [];
}>();
</script>

<style scoped lang="scss">
.conceptual-model-create__topbar {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 92px;
  padding: 14px 18px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 10px;
  background: var(--aircas-color-panel-background);
}

.conceptual-model-create__identity {
  flex: 1;
  min-width: 180px;
}

.conceptual-model-create__identity h1 {
  margin: 0;
  font-size: 20px;
}

.conceptual-model-create__identity p {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.conceptual-model-create__eyebrow {
  color: var(--aircas-color-accent-cyan);
  font-size: 11px;
  letter-spacing: 0.12em;
}

.conceptual-model-create__space-input {
  width: 190px;
}

.conceptual-model-create__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

@media (max-width: 720px) {
  .conceptual-model-create__topbar {
    flex-wrap: wrap;
  }

  .conceptual-model-create__identity {
    order: 2;
    flex-basis: calc(100% - 80px);
  }

  .conceptual-model-create__space-input {
    order: 3;
    width: 100%;
  }

  .conceptual-model-create__actions {
    order: 4;
    flex-wrap: wrap;
  }
}
</style>
