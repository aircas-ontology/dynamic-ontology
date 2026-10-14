<template>
  <el-dialog
    :model-value="modelValue"
    title="删除行为"
    width="520px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @close="emit('update:modelValue', false)"
  >
    <el-alert v-if="preflight && !preflight.canDelete" title="当前行为无法删除" type="warning" show-icon :closable="false">
      <p>{{ preflight.impactSummary }}</p>
      <ul class="behavior-delete-dialog__refs">
        <li v-for="reference in preflight.references" :key="reference.id">
          <strong>{{ reference.sourceName }}</strong>
          <span>{{ reference.type === "behavior-tree" ? "行为树" : "行为调度" }} · {{ reference.detail }}</span>
        </li>
      </ul>
      <p class="behavior-delete-dialog__hint">请先解除引用，再执行删除。</p>
    </el-alert>
    <template v-else-if="preflight">
      <p class="behavior-delete-dialog__copy">
        即将删除行为 <strong>“{{ preflight.behaviorName }}”</strong>。此操作不可恢复，但历史执行记录会保留行为名称快照。
      </p>
      <p class="behavior-delete-dialog__impact">影响范围：{{ preflight.impactSummary }}</p>
      <el-form label-position="top">
        <el-form-item label="请输入行为名称确认删除" :error="confirmError">
          <el-input v-model="confirmName" maxlength="64" :placeholder="preflight.behaviorName" />
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button v-if="preflight?.canDelete" type="danger" :loading="loading" :disabled="confirmName !== preflight.behaviorName" @click="emit('confirm')">
        确认删除
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { SpaceBehaviorDeletePreflight } from "@/types";

const props = defineProps<{
  modelValue: boolean;
  preflight: SpaceBehaviorDeletePreflight | null;
  loading: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [value: boolean]; confirm: [] }>();
const confirmName = ref("");
const confirmError = computed(() => (confirmName.value && props.preflight && confirmName.value !== props.preflight.behaviorName ? "名称不匹配" : ""));

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) confirmName.value = "";
  },
);
</script>

<style scoped lang="scss">
.behavior-delete-dialog__copy {
  margin: 0 0 8px;
  color: var(--aircas-color-text-primary);
  line-height: 1.7;
}
.behavior-delete-dialog__impact,
.behavior-delete-dialog__hint {
  margin: 0 0 12px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.behavior-delete-dialog__refs {
  margin: 8px 0;
  padding-left: 18px;
}
.behavior-delete-dialog__refs li {
  margin: 7px 0;
}
.behavior-delete-dialog__refs span {
  display: block;
  margin-top: 2px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
</style>
