import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as vue from "vue";
import dayjs from "dayjs";
import ts from "typescript";

/**
 * @description 执行组件 setup 中的实际主题订阅，隔离图形和 DOM 边界。
 * @param {string} path 组件路径。
 * @param {object} dependencies 图形边界。
 * @param {string} expose 测试所需的局部接口。
 * @returns {object} 组件作用域及接口。
 */
function createComponentScope(path, dependencies, expose) {
  const source = readFileSync(path, "utf8")
    .split('<script setup lang="ts">')[1]
    .split("</script>")[0]
    .replace(/^import[\s\S]*?from ["'][^"']+["'];\s*/gm, "");
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const mounted = [];
  const scope = vue.effectScope();
  const bindings = {
    ref: vue.ref,
    watch: vue.watch,
    nextTick: vue.nextTick,
    dayjs,
    useDocumentTheme: () => ({ isDark: dependencies.isDark }),
    onMounted: (callback) => mounted.push(callback),
    onUnmounted: vue.onScopeDispose,
    onBeforeUnmount: vue.onScopeDispose,
    defineEmits: () => () => {},
    defineProps: () => ({ objects: [], relations: [], selected: null }),
    defineExpose: () => {},
    ...Object.fromEntries(Object.entries(dependencies).filter(([name]) => name !== "isDark")),
  };
  const component = scope.run(() => new Function(...Object.keys(bindings), `${code}\nreturn ${expose};`)(...Object.values(bindings)));
  return { component, scope, mount: () => mounted.forEach((callback) => callback()) };
}

test("timeline redraws immediately while paused and playing, and stops after unmount", async () => {
  const isDark = vue.ref(true);
  const fills = [];
  const context = {
    clearRect: () => {},
    /** @description 记录画布填充颜色以验证暂停时刷新。 */
    fillRect() {
      fills.push(this.fillStyle);
    },
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fillText: () => {},
  };
  const canvas = { getContext: () => context, addEventListener: () => {}, removeEventListener: () => {} };
  const engine = {
    speed: 1,
    getTime: () => 1700000000000,
    onTick: () => () => {},
    play: () => {},
    pause: () => {},
    /** @description 记录组件卸载时资源释放。 */
    dispose() {
      this.disposed = true;
    },
  };
  const instance = createComponentScope(
    "src/components/AircasTimeline.vue",
    {
      isDark,
      createTimeEngine: () => engine,
      document: { documentElement: { getAttribute: () => (isDark.value ? "dark" : "light") } },
      window: { addEventListener: () => {}, removeEventListener: () => {} },
      getComputedStyle: () => ({ getPropertyValue: (name) => (name.includes("background") ? (isDark.value ? "#102030" : "#ffffff") : "#abcdef") }),
    },
    "{ aircasTimelineRef, handleToggleTimeline }",
  );
  try {
    instance.component.aircasTimelineRef.value = canvas;
    instance.mount();
    assert.deepEqual(fills, ["#102030"]);
    instance.component.handleToggleTimeline(false);
    isDark.value = false;
    await vue.nextTick();
    assert.deepEqual(fills, ["#102030", "#ffffff"]);
    instance.component.handleToggleTimeline(true);
    isDark.value = true;
    await vue.nextTick();
    assert.equal(fills.at(-1), "#102030");
    assert.equal(fills.length, 3);
    instance.scope.stop();
    assert.equal(engine.disposed, true);
    isDark.value = false;
    await vue.nextTick();
    assert.equal(fills.length, 3);
  } finally {
    instance.scope.stop();
  }
});

test("conceptual graph recolors cached grid without resetting editing state and stops after unmount", async () => {
  const isDark = vue.ref(true);
  const grids = [];
  const graph = {
    drawGrid: (grid) => grids.push(grid),
    /** @description 记录组件卸载时资源释放。 */
    dispose() {
      this.disposed = true;
    },
    selected: "object-1",
    scale: 1.4,
    nodes: [{ id: 1, x: 80, y: 120 }],
  };
  const state = structuredClone({ selected: graph.selected, scale: graph.scale, nodes: graph.nodes });
  const instance = createComponentScope(
    "src/views/OntologyConceptualModelCreate/components/ConceptualModelGraphCanvas.vue",
    {
      isDark,
      setConceptualModelHtmlHandlers: () => {},
      document: { documentElement: { getAttribute: () => (isDark.value ? "dark" : "light") } },
      getComputedStyle: () => ({
        getPropertyValue: (name) => (name.endsWith("rgb") ? (isDark.value ? "77, 210, 255" : "7, 88, 184") : isDark.value ? "#314456" : "#dddddd"),
      }),
    },
    "{ attachGraph: (instance) => { graph = instance; } }",
  );
  try {
    instance.component.attachGraph(graph);
    isDark.value = false;
    await vue.nextTick();
    assert.equal(grids.length, 1);
    assert.equal(grids[0].args[0].color, "rgba(7, 88, 184, 0.06)");
    assert.equal(grids[0].args[1].color, "#dddddd");
    isDark.value = true;
    await vue.nextTick();
    assert.equal(grids.length, 2);
    assert.deepEqual({ selected: graph.selected, scale: graph.scale, nodes: graph.nodes }, state);
    instance.scope.stop();
    assert.equal(graph.disposed, true);
    isDark.value = false;
    await vue.nextTick();
    assert.equal(grids.length, 2);
  } finally {
    instance.scope.stop();
  }
});
