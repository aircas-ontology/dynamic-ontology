import assert from "node:assert/strict";
import test from "node:test";
import { createObjectProfileEntityRelationsMock } from "../src/mocks/objectProfileEntityDetailMock/objectProfileEntityDetailMock.ts";

test("entity relation examples center on current entity, are deterministic and independently created", () => {
  const first = createObjectProfileEntityRelationsMock({ objectId: "aircraft", instanceId: "5", entityName: "阵风F4" });
  const second = createObjectProfileEntityRelationsMock({ objectId: "aircraft", instanceId: "5", entityName: "阵风F4" });
  assert.deepEqual(first, second);
  assert.ok(first.length >= 4);
  assert.ok(first.every((item) => item.sourceName === "阵风F4" && item.sourceOntologyId === "aircraft"));
  assert.equal(new Set(first.map((item) => item.id)).size, first.length);
  assert.ok(first.every((item) => item.targetName.includes("示例")));
  first[0].targetName = "changed";
  assert.notEqual(first[0].targetName, second[0].targetName);
  const next = createObjectProfileEntityRelationsMock({ objectId: "aircraft", instanceId: "6", entityName: "实体乙" });
  assert.ok(next.every((item) => item.sourceName === "实体乙"));
  assert.notEqual(next[0].id, second[0].id);
  assert.deepEqual(createObjectProfileEntityRelationsMock({ objectId: "", instanceId: "", entityName: "" }), []);
});
