<template>
  <el-dialog
    :model-value="modelValue"
    class="aircas-dialog"
    :title="mode === 'create' ? '添加关系分类' : '编辑关系分类'"
    width="520px"
    append-to-body
    destroy-on-close
    @close="emit('update:modelValue', false)"
  >
    <el-form label-position="top">
      <el-form-item v-if="mode === 'create'" label="父分类">
        <el-input class="aircas-input" :model-value="parentLabel" disabled />
      </el-form-item>
      <el-form-item label="分类名称" required>
        <el-input v-model="name" class="aircas-input" maxlength="64" placeholder="请输入分类名称" />
      </el-form-item>
      <el-form-item label="分类颜色" required>
        <el-color-picker :model-value="color" color-format="hex" :predefine="relationCategoryPredefineColors" @update:model-value="onColorChange" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button class="aircas-button" @click="emit('update:modelValue', false)">取消</el-button>
      <el-button class="aircas-button" type="primary" :loading="loading" @click="submit">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { relationCategoryPredefineColors } from "@/utils/constants";

const DEFAULT_COLOR = "#4dd2ff";
const props = defineProps<{
  modelValue: boolean;
  mode: "create" | "edit";
  parentLabel: string;
  initialName: string;
  initialColor?: string;
}>();
const emit = defineEmits<{ "update:modelValue": [value: boolean]; submit: [name: string, color: string] }>();
const name = ref("");
const color = ref(DEFAULT_COLOR);
const loading = ref(false);

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return;
    name.value = props.initialName;
    color.value = props.initialColor?.trim() || DEFAULT_COLOR;
    loading.value = false;
  },
);

function onColorChange(value: string | null) {
  color.value = value?.trim() || DEFAULT_COLOR;
}

function submit() {
  const trimmed = name.value.trim();
  if (!trimmed) return;
  loading.value = true;
  emit("submit", trimmed, color.value.trim() || DEFAULT_COLOR);
}

defineExpose({
  setLoading(value: boolean) {
    loading.value = value;
  },
});
</script>
