<template>
  <div class="rule-flow-code-editor">
    <header class="rule-flow-code-editor__header">
      <strong>规则代码</strong>
      <span v-if="parseError" class="rule-flow-code-editor__error">{{ parseError }}</span>
      <span v-else class="rule-flow-code-editor__hint">与左侧可视化双向同步</span>
    </header>
    <div ref="editorContainer" class="rule-flow-code-editor__monaco" aria-label="规则代码编辑器" />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import type { editor as MonacoEditor } from "monaco-editor";

const props = defineProps<{
  modelValue: string;
  parseError?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const editorContainer = ref<HTMLElement | null>(null);
let editor: MonacoEditor.IStandaloneCodeEditor | null = null;
let applyingExternal = false;
let changeTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * @description 销毁 Monaco 实例并清理延迟回写。
 */
function disposeEditor() {
  if (changeTimer) {
    clearTimeout(changeTimer);
    changeTimer = null;
  }
  editor?.dispose();
  editor = null;
}

/**
 * @description 配置 Monaco worker，仅使用明文编辑器 worker。
 */
function ensureMonacoEnvironment() {
  const globalScope = globalThis as typeof globalThis & { MonacoEnvironment?: { getWorker(): Worker } };
  if (globalScope.MonacoEnvironment) return;
  globalScope.MonacoEnvironment = {
    getWorker() {
      return new Worker(new URL("monaco-editor/esm/vs/editor/editor.worker.js", import.meta.url), { type: "module" });
    },
  };
}

/**
 * @description 创建规则代码编辑器，卸载时由 disposeEditor 清理。
 */
async function setupEditor() {
  disposeEditor();
  await nextTick();
  if (!editorContainer.value) return;
  ensureMonacoEnvironment();
  const monaco = await import("monaco-editor");
  editor = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: "plaintext",
    theme: "vs-dark",
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 13,
    lineNumbers: "on",
    wordWrap: "on",
    scrollBeyondLastLine: false,
  });
  editor.onDidChangeModelContent(() => {
    if (applyingExternal || !editor) return;
    if (changeTimer) clearTimeout(changeTimer);
    changeTimer = setTimeout(() => {
      if (!editor) return;
      emit("update:modelValue", editor.getValue());
    }, 320);
  });
}

watch(
  () => props.modelValue,
  (value) => {
    if (!editor || editor.getValue() === value) return;
    if (changeTimer) {
      clearTimeout(changeTimer);
      changeTimer = null;
    }
    applyingExternal = true;
    editor.setValue(value);
    applyingExternal = false;
  },
);

watch(
  () => editorContainer.value,
  (el) => {
    if (el) void setupEditor();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  disposeEditor();
});
</script>

<style scoped lang="scss">
.rule-flow-code-editor {
  display: flex;
  min-width: 0;
  min-height: 0;
  height: 100%;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 8px;
  background: var(--aircas-color-overlay-deep);
}

.rule-flow-code-editor__header {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
}

.rule-flow-code-editor__header strong {
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  font-weight: 650;
}

.rule-flow-code-editor__hint {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}

.rule-flow-code-editor__error {
  color: var(--aircas-color-accent-orange);
  font-size: 12px;
}

.rule-flow-code-editor__monaco {
  min-height: 0;
  flex: 1;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 6px;
}
</style>
