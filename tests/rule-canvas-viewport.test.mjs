import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ModuleKind, transpileModule } from "typescript";

/** @description 隔离第三方渲染，运行真实会话调度与清理逻辑。 @returns {object} 会话测试边界。 */
function createSessionHarness() {
  const frames = new Map();
  let frameId = 0;
  const calls = [];
  const graph = { zoomToFit: (options) => calls.push(options), centerContent: () => calls.push("center"), dispose: () => calls.push("dispose") };
  const previousWindow = globalThis.window;
  globalThis.window = {
    requestAnimationFrame: (callback) => {
      frames.set(++frameId, callback);
      return frameId;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
    clearTimeout() {},
  };
  const { outputText } = transpileModule(
    readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleFlowGraphSession.ts", import.meta.url), "utf8"),
    { compilerOptions: { module: ModuleKind.CommonJS } },
  );
  const exports = {};
  new Function("require", "exports", outputText)(() => ({}), exports);
  const session = new exports.ScheduleRuleFlowGraphSession({});
  session.graph = graph;
  return {
    session,
    calls,
    frames,
    cleanup: () => {
      globalThis.window = previousWindow;
    },
  };
}

test("canvas automatic fitting preserves readable scale and centers content", () => {
  const harness = createSessionHarness();
  try {
    harness.session.fitGraph();
    assert.equal(harness.calls[0].minScale, 0.8);
    assert.equal(harness.calls[0].maxScale, 1);
    assert.equal(harness.calls[1], "center");
  } finally {
    harness.cleanup();
  }
});

test("viewport requests coalesce and dispose cancels pending frames and observers", () => {
  const harness = createSessionHarness();
  try {
    let layouts = 0;
    harness.session.autoLayout = async () => {
      layouts += 1;
    };
    harness.session.adaptViewport();
    harness.session.adaptViewport();
    assert.equal(harness.frames.size, 1);
    const callback = [...harness.frames.values()][0];
    harness.frames.clear();
    callback();
    assert.equal(layouts, 1);
    harness.session.adaptViewport();
    let disconnected = false;
    harness.session.resizeObserver = {
      disconnect: () => {
        disconnected = true;
      },
    };
    harness.session.dispose();
    assert.equal(harness.frames.size, 0);
    assert.equal(disconnected, true);
    harness.session.adaptViewport();
    assert.equal(harness.frames.size, 0);
  } finally {
    harness.cleanup();
  }
});

test("pending asynchronous layout does not touch a disposed graph", async () => {
  const harness = createSessionHarness();
  try {
    harness.session.graph.getNodes = () => [{ id: "node", getSize: () => ({ width: 250, height: 104 }) }];
    const pending = harness.session.autoLayout();
    harness.session.dispose();
    await pending;
    assert.deepEqual(harness.calls, ["dispose"]);
    assert.equal(harness.frames.size, 0);
  } finally {
    harness.cleanup();
  }
});

test("a resized viewport retains a pending opened-dialog layout request", () => {
  const harness = createSessionHarness();
  try {
    let layouts = 0;
    harness.session.autoLayout = async () => {
      layouts += 1;
    };
    harness.session.adaptViewport();
    harness.session.scheduleViewportFit();
    assert.equal(harness.frames.size, 1);
    [...harness.frames.values()][0]();
    assert.equal(layouts, 1);
  } finally {
    harness.cleanup();
  }
});
