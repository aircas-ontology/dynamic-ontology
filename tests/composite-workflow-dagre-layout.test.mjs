import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { layoutCompositeWorkflowNodesWithDagre } from "../src/views/FunctionOperatorPanel/utils/compositeWorkflowDagreLayout.ts";

test("layoutCompositeWorkflowNodesWithDagre lays chain left to right", async () => {
  const positions = await layoutCompositeWorkflowNodesWithDagre(
    [
      { id: "a", kind: "function" },
      { id: "b", kind: "function" },
      { id: "c", kind: "function" },
    ],
    [
      { sourceNodeId: "a", targetNodeId: "b" },
      { sourceNodeId: "b", targetNodeId: "c" },
    ],
  );
  const byId = Object.fromEntries(positions.map((item) => [item.id, item]));
  assert.ok(byId.a && byId.b && byId.c);
  assert.ok(byId.a.x < byId.b.x);
  assert.ok(byId.b.x < byId.c.x);
});

test("layoutCompositeWorkflowNodesWithDagre separates branch downstream on y", async () => {
  const positions = await layoutCompositeWorkflowNodesWithDagre(
    [
      { id: "src", kind: "function" },
      { id: "br", kind: "branch" },
      { id: "t", kind: "function" },
      { id: "f", kind: "function" },
    ],
    [
      { sourceNodeId: "src", targetNodeId: "br" },
      { sourceNodeId: "br", targetNodeId: "t" },
      { sourceNodeId: "br", targetNodeId: "f" },
    ],
  );
  const byId = Object.fromEntries(positions.map((item) => [item.id, item]));
  assert.ok(byId.src.x < byId.br.x);
  assert.ok(byId.br.x < byId.t.x);
  assert.ok(byId.br.x < byId.f.x);
  assert.notEqual(byId.t.y, byId.f.y);
});

test("layoutCompositeWorkflowNodesWithDagre keeps isolated nodes", async () => {
  const positions = await layoutCompositeWorkflowNodesWithDagre(
    [
      { id: "alone", kind: "loop" },
      { id: "a", kind: "function" },
      { id: "b", kind: "function" },
    ],
    [{ sourceNodeId: "a", targetNodeId: "b" }],
  );
  assert.equal(positions.length, 3);
  assert.ok(positions.some((item) => item.id === "alone"));
});

test("canvas auto layout uses dagre helper", () => {
  const canvas = readFileSync(new URL("../src/views/FunctionOperatorPanel/composables/useCompositeWorkflowCanvas.ts", import.meta.url), "utf8");
  assert.match(canvas, /layoutCompositeWorkflowNodesWithDagre/);
  assert.match(canvas, /async function autoLayoutCompositeWorkflowCanvas/);
  assert.doesNotMatch(canvas, /Math\.ceil\(Math\.sqrt\(nodes\.length\)\)/);
});
