import assert from "node:assert/strict";
import test from "node:test";

test("binding lookup shares requests, caches results, retries failures and rejects missing attributes", async () => {
  const { createCanvasAttributeBindingLookup } = await import("../src/views/OntologyConceptualModelCreate/utils/canvasAttributeBinding.ts");
  let calls = 0;
  let fail = true;
  const lookup = createCanvasAttributeBindingLookup(async () => {
    calls++;
    if (fail) throw new Error("网络错误");
    return [{ uniqueIdentifier: "a", datasourceId: "table", datasourceColumnName: "id" }, { uniqueIdentifier: "b" }];
  });
  await assert.rejects(lookup("object", "a"), /网络错误/);
  fail = false;
  const result = await Promise.all([lookup("object", "a"), lookup("object", "b")]);
  assert.deepEqual(result, [true, false]);
  assert.equal(calls, 2);
  assert.equal(await lookup("object", "a"), true);
  assert.equal(calls, 2);
  await assert.rejects(lookup("object", "missing"), /属性详情不存在/);
});
