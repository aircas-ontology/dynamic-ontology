<template>
  <div class="basic-filter-builder">
    <BasicFilterGroupEditor
      :group="model"
      :depth="0"
      :property-placeholder="propertyPlaceholder"
      :property-options="propertyOptions"
      :show-value-type-select="showValueTypeSelect"
      @update:group="emitUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

import type { BasicFilterDocument } from "@/types";
import { parseBasicFilterConfig, stringifyBasicFilterConfig } from "@/utils/functionOperatorBasicFilter";

import BasicFilterGroupEditor from "./BasicFilterGroupEditor.vue";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    /** 属性/变量名输入框占位文案。 */
    propertyPlaceholder?: string;
    /** 有值时属性列改为单选；空数组则仍为文本输入。 */
    propertyOptions?: ReadonlyArray<{ value: string; label: string }>;
    /** 是否展示数据类型下拉；基础函数行为侧关闭。 */
    showValueTypeSelect?: boolean;
  }>(),
  {
    propertyPlaceholder: "输入变量名",
    propertyOptions: () => [],
    showValueTypeSelect: true,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const model = ref<BasicFilterDocument>(parseBasicFilterConfig(props.modelValue));

/**
 * @description 子分组变更后回写序列化配置。
 * @param next 最新过滤文档。
 */
function emitUpdate(next: BasicFilterDocument): void {
  model.value = next;
  emit("update:modelValue", stringifyBasicFilterConfig(next));
}

watch(
  () => props.modelValue,
  (value) => {
    const serialized = stringifyBasicFilterConfig(model.value);
    if (value.trim() === serialized.trim()) {
      return;
    }
    model.value = parseBasicFilterConfig(value);
  },
);
</script>

<style scoped lang="scss">
.basic-filter-builder {
  width: 100%;
}
</style>
