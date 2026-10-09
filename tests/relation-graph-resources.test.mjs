import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import * as THREE from "three";
import ts from "typescript";

/**
 * @description 执行真实图形工厂，以渲染器及浏览器替身模拟初始化失败点。
 * @param {string} failureStage 需要触发错误的初始化阶段。
 * @returns {{ createGraph: Function, container: object, state: object }} 图形工厂与资源观察状态。
 */
function createResourceFixture(failureStage = "") {
  const state = { rendererDisposed: 0, controlsDisposed: 0, removed: 0, listeners: new Set(), cancelled: [] };
  const canvas = {
    style: {},
    remove: () => {
      state.removed += 1;
    },
    addEventListener: (name) => {
      state.listeners.add(name);
    },
    removeEventListener: (name) => {
      state.listeners.delete(name);
    },
  };
  class Renderer {
    /** @description 创建浏览器渲染器替身。 */
    constructor() {
      if (failureStage === "renderer") throw new Error("WebGL unavailable");
      this.domElement = canvas;
    }
    /** @description 模拟清屏颜色设置。 */
    setClearColor() {}
    /** @description 模拟像素比设置。 */
    setPixelRatio() {}
    /** @description 模拟画布尺寸调整或相应初始化错误。 */
    setSize() {
      if (failureStage === "resize") throw new Error("resize failed");
    }
    /** @description 模拟首帧渲染或相应初始化错误。 */
    render() {
      if (failureStage === "render") throw new Error("render failed");
    }
    /** @description 记录渲染器资源释放。 */
    dispose() {
      state.rendererDisposed += 1;
    }
  }
  class Controls {
    /** @description 模拟控件创建或相应初始化错误。 */
    constructor() {
      if (failureStage === "controls") throw new Error("controls failed");
      this.target = new THREE.Vector3();
    }
    /** @description 模拟控件逐帧更新。 */
    update() {}
    /** @description 记录控件销毁。 */
    dispose() {
      state.controlsDisposed += 1;
    }
  }
  const source = readFileSync(new URL("../src/views/OntologySpaceManagementDetail/composables/useRelationGraph3d.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  runInNewContext(compiled, {
    exports,
    require: (name) => {
      if (name === "three") return { ...THREE, WebGLRenderer: Renderer };
      if (name.includes("OrbitControls")) return { OrbitControls: Controls };
      if (name.includes("themeColor")) return { themeColor: () => "#0c2430" };
      return {};
    },
    window: { devicePixelRatio: 1 },
    requestAnimationFrame: () => 42,
    cancelAnimationFrame: (id) => {
      state.cancelled.push(id);
    },
  });
  const container = { clientWidth: 800, clientHeight: 500, appendChild: () => {} };
  return { createGraph: exports.createRelationGraph3d, state, container };
}

for (const stage of ["renderer", "controls", "resize", "render"]) {
  test(`graph factory cleans partially created resources after ${stage} failure`, () => {
    const { createGraph, container, state } = createResourceFixture(stage);
    assert.throws(() => createGraph({ container, onEdgeContextMenu: () => {} }), /unavailable|failed/);
    assert.equal(state.rendererDisposed, stage === "renderer" ? 0 : 1);
    assert.equal(state.removed, stage === "renderer" ? 0 : 1);
    assert.equal(state.controlsDisposed, ["resize", "render"].includes(stage) ? 1 : 0);
    assert.equal(state.listeners.size, 0);
    if (stage === "render") assert.ok(state.cancelled.includes(42));
  });
}

test("graph factory disposes events, animation and renderer once and ignores updates after disposal", async () => {
  const { createGraph, container, state } = createResourceFixture();
  const graph = createGraph({ container, onEdgeContextMenu: () => {} });
  assert.equal(state.listeners.size, 4);
  const data = { items: [], seedNames: [], layoutMode: "star", maxHop: 2 };
  await graph.setData(data);
  graph.dispose();
  graph.dispose();
  graph.resize();
  await graph.setData(data);
  assert.equal(state.rendererDisposed, 1);
  assert.equal(state.controlsDisposed, 1);
  assert.equal(state.removed, 1);
  assert.equal(state.listeners.size, 0);
  assert.deepEqual(state.cancelled, [42]);
});
