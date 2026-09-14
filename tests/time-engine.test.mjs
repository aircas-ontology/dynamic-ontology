import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { TimeEngine } from "../src/models/TimeEngine.ts";

test("dispose cancels animation and permanently clears tick listeners", () => {
  const scheduledCallbacks = new Map();
  const cancelledIds = [];
  let nextAnimationId = 1;
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;

  globalThis.requestAnimationFrame = (callback) => {
    const animationId = nextAnimationId++;
    scheduledCallbacks.set(animationId, callback);
    return animationId;
  };
  globalThis.cancelAnimationFrame = (animationId) => {
    cancelledIds.push(animationId);
    scheduledCallbacks.delete(animationId);
  };

  try {
    const engine = new TimeEngine({ startTime: 0, endTime: 10_000, currentTime: 1_000 });
    let tickCount = 0;
    engine.onTick(() => {
      tickCount += 1;
    });

    engine.play();
    assert.equal(scheduledCallbacks.size, 1);
    const tickCountBeforeDispose = tickCount;

    engine.dispose();
    engine.dispose();
    engine.setTime(2_000);

    assert.equal(scheduledCallbacks.size, 0);
    assert.equal(cancelledIds.length, 1);
    assert.equal(tickCount, tickCountBeforeDispose);
  } finally {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  }
});

test("time controls update speed, clamp time, reset, and support explicit unsubscribe", () => {
  const now = Date.now();
  const engine = new TimeEngine({
    startTime: now - 1_000,
    endTime: now + 1_000,
    currentTime: now,
  });
  let tickCount = 0;
  const offTick = engine.onTick(() => {
    tickCount += 1;
  });

  engine.setSpeed(4);
  engine.setTime(now - 2_000);
  assert.equal(engine.speed, 4);
  assert.equal(engine.getTime(), now - 1_000);
  assert.equal(tickCount, 1);

  offTick();
  engine.setTime(now + 2_000);
  assert.equal(engine.getTime(), now + 1_000);
  assert.equal(tickCount, 1);

  engine.reset();
  assert.equal(engine.speed, 1);
  assert.ok(engine.getTime() >= now && engine.getTime() <= now + 1_000);
  engine.dispose();
});

test("time-engine factory has no import-time animation side effect", async () => {
  const scheduledCallbacks = new Map();
  let nextAnimationId = 1;
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;

  globalThis.requestAnimationFrame = (callback) => {
    const animationId = nextAnimationId++;
    scheduledCallbacks.set(animationId, callback);
    return animationId;
  };
  globalThis.cancelAnimationFrame = (animationId) => {
    scheduledCallbacks.delete(animationId);
  };

  try {
    const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "time-engine-factory-"));
    const temporaryFile = path.join(temporaryDirectory, "initTimeEngine.ts");
    const modelUrl = pathToFileURL(path.resolve("src/models/TimeEngine.ts")).href;
    const source = (await readFile("src/utils/initTimeEngine.ts", "utf8"))
      .replace('"@/models/TimeEngine"', JSON.stringify(modelUrl));
    await writeFile(temporaryFile, source);
    const module = await import(pathToFileURL(temporaryFile).href);

    assert.equal(scheduledCallbacks.size, 0);
    assert.equal(typeof module.createTimeEngine, "function");
    const engine = module.createTimeEngine(1_000);
    assert.equal(engine.getTime(), 1_000);
    await rm(temporaryDirectory, { recursive: true, force: true });
  } finally {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  }
});
