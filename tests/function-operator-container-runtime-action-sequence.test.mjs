import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createContainerRuntimeActionSequences } from "../src/views/FunctionOperatorPanel/utils/containerRuntimeActionSequence.ts";

/**
 * @description 读取相对 tests 目录的源文件文本。
 * @param relativePath 相对路径。
 * @returns 文件内容。
 */
const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("per-container action sequences stay independent across keys", () => {
  const { nextActionSequence, isCurrentAction } = createContainerRuntimeActionSequences();
  const firstA = nextActionSequence("container-a");
  const firstB = nextActionSequence("container-b");
  assert.equal(firstA, 1);
  assert.equal(firstB, 1);
  assert.equal(isCurrentAction("container-a", firstA), true);
  assert.equal(isCurrentAction("container-b", firstB), true);

  const secondB = nextActionSequence("container-b");
  assert.equal(secondB, 2);
  assert.equal(isCurrentAction("container-a", firstA), true);
  assert.equal(isCurrentAction("container-b", firstB), false);
  assert.equal(isCurrentAction("container-b", secondB), true);
});

test("invalidateAllActionSequences marks prior actions stale for every key", () => {
  const { nextActionSequence, isCurrentAction, invalidateAllActionSequences } = createContainerRuntimeActionSequences();
  const actionA = nextActionSequence("container-a");
  const actionB = nextActionSequence("container-b");
  invalidateAllActionSequences();
  assert.equal(isCurrentAction("container-a", actionA), false);
  assert.equal(isCurrentAction("container-b", actionB), false);
  assert.equal(nextActionSequence("container-a"), 1);
});

test("runtime panel uses per-containerKey action sequences instead of a global counter", () => {
  const panelSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorContainerRuntimePanel.vue");
  assert.match(panelSource, /createContainerRuntimeActionSequences/);
  assert.match(panelSource, /nextActionSequence\(row\.containerKey\)/);
  assert.match(panelSource, /isCurrentAction\(row\.containerKey,\s*currentAction\)/);
  assert.match(panelSource, /invalidateAllActionSequences\(\)/);
  assert.doesNotMatch(panelSource, /let actionSequence\s*=\s*0/);
});
