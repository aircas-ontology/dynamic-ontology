import assert from "node:assert/strict";
import test from "node:test";
import { validateImplicitRelationDraft } from "../src/views/IntelligenceHiddenRelationMining/utils/implicitRelationDraft.ts";

const nodes = [
  {
    spaceName: "海军本体空间",
    nodeName: "CVN-78 福特号",
  },
];
const selectedNode = [nodes[0].spaceName, nodes[0].nodeName];

test("requires start node, relation type and hops", () => {
  assert.equal(validateImplicitRelationDraft({ startNode: [], relationType: "", hops: [] }, nodes).error, "请选择起始节点");
  assert.equal(validateImplicitRelationDraft({ startNode: [nodes[0].spaceName], relationType: "", hops: ["2"] }, nodes).error, "请选择起始节点");
  assert.equal(validateImplicitRelationDraft({ startNode: ["其他空间", nodes[0].nodeName], relationType: "", hops: ["2"] }, nodes).error, "请选择起始节点");
  assert.equal(validateImplicitRelationDraft({ startNode: selectedNode, relationType: "", hops: ["2"] }, nodes).error, "请选择关联类型");
  assert.equal(validateImplicitRelationDraft({ startNode: selectedNode, relationType: "目标与装备", hops: [] }, nodes).error, "请至少添加一个关系跳数");
});

test("normalizes hop values", () => {
  const result = validateImplicitRelationDraft({ startNode: selectedNode, relationType: "目标与装备", hops: ["3", "1", "3"] }, nodes);
  assert.equal(result.error, "");
  assert.deepEqual(result.value?.hops, [1, 3]);
  assert.equal(result.value?.spaceName, "海军本体空间");
  assert.equal(result.value?.nodeName, "CVN-78 福特号");
});

test("rejects non-positive-integer hops", () => {
  for (const hop of ["0", "-1", "abc", "1.5", ""]) {
    assert.equal(validateImplicitRelationDraft({ startNode: selectedNode, relationType: "目标与装备", hops: [hop] }, nodes).error, "关系跳数需为正整数");
  }
});
