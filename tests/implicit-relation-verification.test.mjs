import assert from "node:assert/strict";
import test from "node:test";
import { implicitRelationVerifications } from "../src/mocks/implicitRelationsMock/implicitRelationsMock.ts";
import { summarizeVerificationRows } from "../src/views/IntelligenceHiddenRelationMining/utils/implicitRelationVerification.ts";

test("summarizes total and pending verification rows", () => {
  assert.deepEqual(summarizeVerificationRows([]), { total: 0, pending: 0 });
  assert.deepEqual(summarizeVerificationRows(implicitRelationVerifications["implicit-1"]), { total: 2, pending: 1 });
  assert.deepEqual(summarizeVerificationRows(implicitRelationVerifications["implicit-6"]), { total: 0, pending: 0 });
});

test("verification mock follows the prototype rows", () => {
  const rows = implicitRelationVerifications["implicit-1"];
  assert.equal(rows[0].startNodeName, "CVN-78 福特号");
  assert.equal(rows[0].startNodeInstance, "carrier_ford_inst_01");
  assert.equal(rows[0].relationLabel, "接收补偿");
  assert.equal(rows[0].endNodeName, "T-AO-205 约翰·刘易斯号");
  assert.equal(rows[0].status, "已保存");
  assert.equal(rows[1].status, "待校验");
});
