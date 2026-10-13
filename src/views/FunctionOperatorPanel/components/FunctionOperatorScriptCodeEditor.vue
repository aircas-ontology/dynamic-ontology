<template>
  <div ref="editorContainer" class="function-operator-script-code-editor" aria-label="脚本函数代码编辑器" />
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import type { editor as MonacoEditor } from "monaco-editor";
import { useDocumentTheme } from "@/composables/shared/useDocumentTheme";
import type { FunctionOperatorScriptLanguage } from "@/types";

const props = defineProps<{
  modelValue: string;
  language: FunctionOperatorScriptLanguage;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const { isDark } = useDocumentTheme();
const editorContainer = ref<HTMLElement | null>(null);
let editor: MonacoEditor.IStandaloneCodeEditor | null = null;
let monacoApi: typeof import("monaco-editor") | null = null;
let applyingExternal = false;
let changeTimer: ReturnType<typeof setTimeout> | null = null;
let groovyRegistered = false;

/** 业务脚本语言到 Monaco language id 的映射（含 typescript / groovy / python / java）。 */
const MONACO_LANGUAGE_IDS: Record<FunctionOperatorScriptLanguage, string> = {
  typescript: "typescript",
  groovy: "groovy",
  python: "python",
  java: "java",
};

/**
 * @description 将业务脚本语言映射为 Monaco language id；Groovy 使用已注册的 groovy id。
 * @param language 脚本语言。
 * @returns Monaco language id。
 */
function mapScriptLanguageToMonacoId(language: FunctionOperatorScriptLanguage): string {
  return MONACO_LANGUAGE_IDS[language];
}

/**
 * @description 注册 Groovy 语言并复用 Java Monarch 词法，保证高亮展示。
 * @param monaco Monaco 模块。
 */
function ensureGroovyLanguage(monaco: typeof import("monaco-editor")): void {
  if (groovyRegistered) {
    return;
  }
  const languages = monaco.languages.getLanguages();
  if (!languages.some((item) => item.id === "groovy")) {
    monaco.languages.register({ id: "groovy", extensions: [".groovy"], aliases: ["Groovy"] });
  }
  monaco.languages.setMonarchTokensProvider("groovy", {
    defaultToken: "",
    tokenPostfix: ".java",
    keywords: [
      "abstract",
      "continue",
      "for",
      "new",
      "switch",
      "assert",
      "default",
      "goto",
      "package",
      "synchronized",
      "boolean",
      "do",
      "if",
      "private",
      "this",
      "break",
      "double",
      "implements",
      "protected",
      "throw",
      "byte",
      "else",
      "import",
      "public",
      "throws",
      "case",
      "enum",
      "instanceof",
      "return",
      "transient",
      "catch",
      "extends",
      "int",
      "short",
      "try",
      "char",
      "final",
      "interface",
      "static",
      "void",
      "class",
      "finally",
      "long",
      "strictfp",
      "volatile",
      "const",
      "float",
      "native",
      "super",
      "while",
      "def",
      "in",
      "as",
      "trait",
    ],
    operators: [
      "=",
      ">",
      "<",
      "!",
      "~",
      "?",
      ":",
      "==",
      "<=",
      ">=",
      "!=",
      "&&",
      "||",
      "++",
      "--",
      "+",
      "-",
      "*",
      "/",
      "&",
      "|",
      "^",
      "%",
      "<<",
      ">>",
      ">>>",
      "+=",
      "-=",
      "*=",
      "/=",
      "&=",
      "|=",
      "^=",
      "%=",
      "<<=",
      ">>=",
      ">>>=",
    ],
    symbols: /[=><!~?:&|+\-*/^%]+/,
    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    tokenizer: {
      root: [
        [/[a-zA-Z_$][\w$]*/, { cases: { "@keywords": "keyword", "@default": "identifier" } }],
        { include: "@whitespace" },
        [/[{}()[\]]/, "@brackets"],
        [/[<>](?!@symbols)/, "@brackets"],
        [/@symbols/, { cases: { "@operators": "operator", "@default": "" } }],
        [/\d*\.\d+([eE][-+]?\d+)?[fFdD]?/, "number.float"],
        [/0[xX][0-9a-fA-F]+[Ll]?/, "number.hex"],
        [/\d+[lL]?/, "number"],
        [/[;,.]/, "delimiter"],
        [/"([^"\\]|\\.)*$/, "string.invalid"],
        [/"/, "string", "@string"],
        [/'[^\\']'/, "string"],
        [/(')(@escapes)(')/, ["string", "string.escape", "string"]],
        [/'/, "string.invalid"],
      ],
      whitespace: [
        [/[ \t\r\n]+/, ""],
        [/\/\*\*(?!\/)/, "comment.doc", "@javadoc"],
        [/\/\*/, "comment", "@comment"],
        [/\/\/.*$/, "comment"],
      ],
      comment: [
        [/[^/*]+/, "comment"],
        [/\*\//, "comment", "@pop"],
        [/[/*]/, "comment"],
      ],
      javadoc: [
        [/[^/*]+/, "comment.doc"],
        [/\*\//, "comment.doc", "@pop"],
        [/[/*]/, "comment.doc"],
      ],
      string: [
        [/[^\\"]+/, "string"],
        [/@escapes/, "string.escape"],
        [/\\./, "string.escape.invalid"],
        [/"/, "string", "@pop"],
      ],
    },
  });
  groovyRegistered = true;
}

/**
 * @description 销毁 Monaco 实例并清理延迟回写定时器。
 */
function disposeEditor(): void {
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
function ensureMonacoEnvironment(): void {
  const globalScope = globalThis as typeof globalThis & { MonacoEnvironment?: { getWorker(): Worker } };
  if (globalScope.MonacoEnvironment) {
    return;
  }
  globalScope.MonacoEnvironment = {
    getWorker() {
      return new Worker(new URL("monaco-editor/esm/vs/editor/editor.worker.js", import.meta.url), { type: "module" });
    },
  };
}

/**
 * @description 按当前主题返回 Monaco 主题名。
 * @returns vs-dark 或 vs。
 */
function resolveEditorTheme(): string {
  return isDark.value ? "vs-dark" : "vs";
}

/**
 * @description 创建脚本代码编辑器；语言与主题随 props / 文档主题更新。
 */
async function setupEditor(): Promise<void> {
  disposeEditor();
  await nextTick();
  if (!editorContainer.value) {
    return;
  }
  ensureMonacoEnvironment();
  monacoApi = await import("monaco-editor");
  ensureGroovyLanguage(monacoApi);
  editor = monacoApi.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: mapScriptLanguageToMonacoId(props.language),
    theme: resolveEditorTheme(),
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 16,
    lineNumbers: "on",
    wordWrap: "on",
    scrollBeyondLastLine: false,
  });
  editor.onDidChangeModelContent(() => {
    if (applyingExternal || !editor) {
      return;
    }
    if (changeTimer) {
      clearTimeout(changeTimer);
    }
    changeTimer = setTimeout(() => {
      if (!editor) {
        return;
      }
      emit("update:modelValue", editor.getValue());
    }, 320);
  });
}

/**
 * @description 同步外部 modelValue 到编辑器，避免光标跳动时覆盖用户输入。
 * @param value 外部代码文本。
 */
function applyExternalValue(value: string): void {
  if (!editor || editor.getValue() === value) {
    return;
  }
  if (changeTimer) {
    clearTimeout(changeTimer);
    changeTimer = null;
  }
  applyingExternal = true;
  editor.setValue(value);
  applyingExternal = false;
}

watch(
  () => props.modelValue,
  (value) => {
    applyExternalValue(value);
  },
);

watch(
  () => props.language,
  (language) => {
    if (!editor || !monacoApi) {
      return;
    }
    const model = editor.getModel();
    if (!model) {
      return;
    }
    monacoApi.editor.setModelLanguage(model, mapScriptLanguageToMonacoId(language));
  },
);

watch(isDark, () => {
  if (!monacoApi) {
    return;
  }
  monacoApi.editor.setTheme(resolveEditorTheme());
});

watch(
  () => editorContainer.value,
  (el) => {
    if (el) {
      void setupEditor();
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  disposeEditor();
});
</script>

<style scoped lang="scss">
.function-operator-script-code-editor {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background);
}
</style>
