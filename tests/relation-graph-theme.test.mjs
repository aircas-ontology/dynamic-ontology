import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as THREE from "three";
import ts from "typescript";

/**
 * @description 使用真实 Three.js 场景对象和可控 WebGL 边界执行图谱模块。
 * @returns {object} 图谱工厂、颜色和场景访问器。
 */
function createGraphEnvironment() {
  let light = false;
  let renderState;
  let controls;
  let rendererCount = 0;
  const listeners = new Map();
  const textures = [];
  const container = {
    clientWidth: 800,
    clientHeight: 600,
    appendChild: (node) => {
      node.parentNode = container;
    },
    removeChild: (node) => {
      node.parentNode = null;
    },
  };
  class Renderer {
    /** @description 建立可控图形边界并记录实例。 */
    constructor() {
      rendererCount += 1;
      this.domElement = { style: {}, addEventListener: (name, handler) => listeners.set(name, handler), removeEventListener: (name) => listeners.delete(name) };
    }
    /** @description 忽略不影响场景断言的 WebGL 配置。 */
    setClearColor() {}
    /** @description 忽略设备像素配置。 */
    setPixelRatio() {}
    /** @description 忽略渲染器尺寸写入。 */
    setSize() {}
    /** @description 记录资源销毁。 */
    dispose() {
      this.disposed = true;
    }
    /**
     * @description 记录真实场景和镜头，供主题切换前后比较。
     * @param {THREE.Scene} scene 场景。
     * @param {THREE.Camera} camera 镜头。
     */
    render(scene, camera) {
      renderState = { scene, camera };
    }
  }
  class Controls {
    /** @description 建立可控图形边界并记录实例。 */
    constructor() {
      this.target = new THREE.Vector3();
      controls = this;
    }
    /** @description 不在单元测试中执行镜头阻尼动画。 */
    update() {}
    /** @description 记录资源销毁。 */
    dispose() {
      this.disposed = true;
    }
  }
  /** @description 创建可记录释放状态的真实纹理。
   * @returns {THREE.Texture} 测试纹理。
   */
  const createTexture = () => {
    const texture = new THREE.Texture();
    texture.addEventListener("dispose", () => {
      texture.wasDisposed = true;
    });
    textures.push(texture);
    return texture;
  };
  const dependencies = {
    THREE: { ...THREE, WebGLRenderer: Renderer },
    OrbitControls: Controls,
    computeHopDistances: () =>
      new Map([
        ["A", 0],
        ["B", 1],
      ]),
    createRelationEdgeLabelTexture: createTexture,
    createLabelTexture: createTexture,
    createGlowTexture: createTexture,
    resolveSoftCategoryColor: () => (light ? "#0758b8" : "#4dd2ff"),
    themeColor: (name) => (name.includes("background") ? (light ? "#ffffff" : "#0b2230") : light ? "#10243a" : "#f2fbff"),
    window: { devicePixelRatio: 1 },
    requestAnimationFrame: () => 1,
    cancelAnimationFrame: () => {},
  };
  const source = readFileSync("src/views/SpaceRelationWorkspace/composables/useRelationGraph3d.ts", "utf8")
    .replace(/^import[\s\S]*?from ["'][^"']+["'];\s*/gm, "")
    .replace(/^export /gm, "");
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const factory = new Function(...Object.keys(dependencies), `${code}\nreturn createRelationGraph3d;`)(...Object.values(dependencies));
  return {
    factory,
    container,
    textures,
    listeners,
    /** @description 读取最近一次渲染的场景与镜头。
     * @returns {object} 当前值。
     */
    get state() {
      return renderState;
    },
    /** @description 读取镜头控制器。
     * @returns {object} 当前值。
     */
    get controls() {
      return controls;
    },
    /** @description 读取渲染器创建次数。
     * @returns {number} 当前值。
     */
    get rendererCount() {
      return rendererCount;
    },
    switchTheme: () => {
      light = !light;
    },
  };
}

for (const layoutMode of ["star", "network"]) {
  test(`${layoutMode} graph refreshes colors and textures without rebuilding nodes or moving the camera`, async () => {
    const environment = createGraphEnvironment();
    const graph = environment.factory({ container: environment.container, onEdgeContextMenu: () => {} });
    assert.equal(typeof graph.refreshTheme, "function");
    const items = [
      { id: "one", sourceName: "A", targetName: "B", categoryId: "custom", displayName: "custom" },
      { id: "two", sourceName: "B", targetName: "C", categoryId: "default", displayName: "default" },
    ];
    await graph.setData({ items, layoutMode, seedNames: [], maxHop: 2, categoryColors: { custom: "#ff0000" } });
    const { scene, camera } = environment.state;
    const root = scene.children.find((child) => child instanceof THREE.Group);
    const children = [...root.children];
    const positions = children.map((child) => child.position.clone());
    const oldTextures = [...environment.textures];
    camera.position.set(2, 3, 4);
    environment.controls.target.set(5, 6, 7);
    environment.switchTheme();
    graph.refreshTheme();
    assert.deepEqual(root.children, children);
    assert.ok(children.every((child, index) => child.position.equals(positions[index])));
    assert.deepEqual(camera.position.toArray(), [2, 3, 4]);
    assert.deepEqual(environment.controls.target.toArray(), [5, 6, 7]);
    assert.equal(environment.rendererCount, 1);
    assert.ok(oldTextures.every((texture) => texture.wasDisposed));
    const customEdge = children.find((child) => child.userData.kind === "edge" && child.userData.relationId === "one");
    const defaultEdge = children.find((child) => child.userData.kind === "edge" && child.userData.relationId === "two");
    assert.equal(customEdge.material.color.getHexString(), "ff0000");
    assert.equal(defaultEdge.material.color.getHexString(), "0758b8");
    assert.equal(scene.fog.color.getHexString(), "ffffff");
    graph.refreshTheme();
    graph.dispose();
    graph.dispose();
    const count = environment.textures.length;
    graph.refreshTheme();
    await graph.setData({ items, layoutMode, seedNames: [], maxHop: 2 });
    assert.equal(environment.textures.length, count);
    assert.ok(environment.textures.every((texture) => texture.wasDisposed));
    assert.equal(environment.listeners.size, 0);
  });
}

test("empty graph can refresh and dispose without creating textures", async () => {
  const environment = createGraphEnvironment();
  const graph = environment.factory({ container: environment.container, onEdgeContextMenu: () => {} });
  await graph.setData({ items: [], layoutMode: "star", seedNames: [], maxHop: 1 });
  graph.refreshTheme();
  assert.equal(environment.textures.length, 0);
  graph.dispose();
});
