import assert from "node:assert/strict";
import test from "node:test";
import { createRelationGraphLifecycle } from "../src/views/OntologySpaceManagementDetail/composables/useRelationGraphLifecycle.ts";

/**
 * @description 创建可控制更新响应和销毁次数的图形替身。
 * @returns 图形实例及测试观察状态。
 */
function createGraphFixture() {
  const state = { disposed: 0, resized: 0, updates: [] };
  const graph = {
    setData: async (data) => {
      state.updates.push(data);
    },
    resize: () => {
      state.resized += 1;
    },
    dispose: () => {
      state.disposed += 1;
    },
  };
  return { state, graph };
}

test("initialization failure exposes an error and explicit retry creates one instance", async () => {
  const { graph, state } = createGraphFixture();
  let attempts = 0;
  const lifecycle = createRelationGraphLifecycle(() => {
    attempts += 1;
    if (attempts === 1) throw new Error("WebGL 不可用");
    return graph;
  });
  await lifecycle.update({ id: 1 });
  assert.equal(lifecycle.status.value, "error");
  assert.match(lifecycle.error.value, /WebGL 不可用/);
  await lifecycle.update({ id: 2 });
  assert.equal(attempts, 1);
  await lifecycle.retry({ id: 3 });
  assert.equal(lifecycle.status.value, "ready");
  assert.equal(lifecycle.error.value, "");
  await lifecycle.update({ id: 4 });
  assert.equal(attempts, 2);
  assert.equal(state.updates.length, 2);
  lifecycle.dispose();
  lifecycle.dispose();
  assert.equal(state.disposed, 1);
  await lifecycle.retry({ id: 5 });
  assert.equal(attempts, 2);
});

test("unmount during a pending update prevents late callbacks and further initialization", async () => {
  const { graph, state } = createGraphFixture();
  let complete;
  graph.setData = () =>
    new Promise((resolve) => {
      complete = resolve;
    });
  const lifecycle = createRelationGraphLifecycle(() => graph);
  const pending = lifecycle.update({});
  assert.equal(lifecycle.status.value, "initializing");
  lifecycle.dispose();
  complete();
  await pending;
  assert.equal(state.resized, 0);
  assert.notEqual(lifecycle.status.value, "ready");
});

test("outdated update errors cannot overwrite the newer ready state", async () => {
  const { graph, state } = createGraphFixture();
  let rejectOld;
  let calls = 0;
  graph.setData = () =>
    ++calls === 1
      ? new Promise((_, reject) => {
          rejectOld = reject;
        })
      : Promise.resolve();
  const lifecycle = createRelationGraphLifecycle(() => graph);
  const old = lifecycle.update({ id: 1 });
  await lifecycle.update({ id: 2 });
  rejectOld(new Error("旧请求失败"));
  await old;
  assert.equal(lifecycle.status.value, "ready");
  assert.equal(lifecycle.error.value, "");
  assert.equal(state.resized, 1);
  lifecycle.dispose();
});

test("data update failure disposes the graph and supports retry with a fresh instance", async () => {
  const first = createGraphFixture();
  const second = createGraphFixture();
  first.graph.setData = async () => {
    throw new Error("纹理生成失败");
  };
  let calls = 0;
  const lifecycle = createRelationGraphLifecycle(() => (++calls === 1 ? first.graph : second.graph));
  await lifecycle.update({});
  assert.equal(lifecycle.status.value, "error");
  assert.equal(first.state.disposed, 1);
  await lifecycle.retry({});
  assert.equal(lifecycle.status.value, "ready");
  assert.equal(calls, 2);
  lifecycle.dispose();
});

test("unknown initialization errors use a visible fallback and resize errors allow retry", async () => {
  const lifecycle = createRelationGraphLifecycle(() => {
    throw null;
  });
  await lifecycle.update({});
  assert.match(lifecycle.error.value, /WebGL/);
  lifecycle.dispose();
  lifecycle.resize();
  await lifecycle.update({});

  const { graph, state } = createGraphFixture();
  const resizable = createRelationGraphLifecycle(() => graph);
  resizable.resize();
  await resizable.retry({});
  await resizable.update({});
  graph.resize = () => {
    throw new Error("尺寸更新失败");
  };
  resizable.resize();
  assert.equal(resizable.status.value, "error");
  assert.match(resizable.error.value, /尺寸更新失败/);
  assert.equal(state.disposed, 1);
  resizable.dispose();
});
