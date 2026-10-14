<template>
  <div class="basic-filter-builder">
    <BasicFilterGroupEditor :group="model" :depth="0" @update:group="emitUpdate" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

import type { BasicFilterDocument } from "@/types";
import { parseBasicFilterConfig, stringifyBasicFilterConfig } from "@/utils/functionOperatorBasicFilter";

import BasicFilterGroupEditor from "./BasicFilterGroupEditor.vue";

const props = defineProps<{
  modelValue: string;
}>();

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
