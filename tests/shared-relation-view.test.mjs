import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as Vue from "vue";
import { compileScript, parse } from "@vue/compiler-sfc";
import { ModuleKind, transpileModule } from "typescript";

test("shared relation view reuses one graph, refreshes theme and blocks queued work after disposal", async () => {
  const source = readFileSync(new URL("../src/components/OntologyRelationGraph2d.vue", import.meta.url), "utf8");
  const { descriptor } = parse(source);
  const { outputText } = transpileModule(compileScript(descriptor, { id: "shared-graph" }).content, { compilerOptions: { module: ModuleKind.CommonJS } });
  const mounted = [],
    cleanup = [],
    calls = [];
  const theme = Vue.ref(true);
  const previousObserver = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class {
    observe() {
      calls.push("observe");
    }
    disconnect() {
      calls.push("disconnect");
    }
  };
  const exports = {};
  new Function("require", "exports", outputText)((id) => {
    if (id === "vue") return { ...Vue, onMounted: (callback) => mounted.push(callback), onBeforeUnmount: (callback) => cleanup.push(callback) };
    if (id.includes("useDocumentTheme")) return { useDocumentTheme: () => ({ isDark: theme }) };
    if (id.includes("createRelationGraph2d"))
      return {
        createRelationGraph2d: () => {
          calls.push("create");
          return {
            setData: () => calls.push("data"),
            resize: () => calls.push("resize"),
            refreshTheme: () => calls.push("theme"),
            dispose: () => calls.push("dispose"),
          };
        },
      };
    return {};
  }, exports);
  const scope = Vue.effectScope();
  const props = Vue.reactive({ items: [], seedNames: [], readonly: true });
  try {
    const page = scope.run(() => exports.default.setup(props, { expose() {}, emit() {} }));
    page.canvasRef.value = {};
    mounted.forEach((callback) => callback());
    assert.equal(calls.filter((item) => item === "create").length, 1);
    props.items = [{ id: "new" }];
    theme.value = false;
    await Vue.nextTick();
    await Vue.nextTick();
    assert.equal(calls.filter((item) => item === "create").length, 1);
    assert.ok(calls.includes("theme"));
    props.items = [];
    await Vue.nextTick();
    cleanup.forEach((callback) => callback());
    await Vue.nextTick();
    assert.equal(calls.filter((item) => item === "create").length, 1);
    assert.equal(calls.filter((item) => item === "dispose").length, 1);
    assert.ok(calls.includes("disconnect"));
  } finally {
    scope.stop();
    globalThis.ResizeObserver = previousObserver;
  }
});
