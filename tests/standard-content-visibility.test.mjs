import test from "node:test";
import assert from "node:assert/strict";
import { isStandardContentVisible } from "../src/utils/isStandardContentVisible.ts";

test("standard content stays visible unless the runtime flag is explicitly false", () => {
  assert.equal(isStandardContentVisible({ SHOW_STANDARD_CONTENT: true }), true);
  assert.equal(isStandardContentVisible({}), true);
  assert.equal(isStandardContentVisible({ SHOW_STANDARD_CONTENT: false }), false);
});
