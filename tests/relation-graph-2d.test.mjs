import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createOntologySpaceRelationWorkspaceData } from "../src/mocks/ontologySpaceRelationMock/ontologySpaceRelationMock.ts";
import { bindRelationGraph2dLinkNodes, buildRelationGraph2dData } from "../src/views/SpaceRelationWorkspace/utils/buildRelationGraph2dData.ts";

test("buildRelationGraph2dData creates unique nodes and directed links from relations", () => {
  const data = createOntologySpaceRelationWorkspaceData();
  const sample = data.relations.slice(0, 3);
  const graph = buildRelationGraph2dData(sample, ["福特级航空母舰(CVN)"]);

  assert.ok(graph.nodes.length >= 2);
  assert.equal(graph.links.length, sample.length);
  assert.equal(new Set(graph.nodes.map((node) => node.id)).size, graph.nodes.length);

  const seed = graph.nodes.find((node) => node.id === "福特级航空母舰(CVN)");
  assert.ok(seed);
  assert.equal(seed.isSeed, true);
  assert.ok(seed.degree >= 1);

  graph.links.forEach((link) => {
    assert.ok(graph.nodes.some((node) => node.id === link.source));
    assert.ok(graph.nodes.some((node) => node.id === link.target));
    assert.ok(link.relationId);
    assert.ok(link.label);
  });
});

test("buildRelationGraph2dData skips blank endpoints and empty relation lists", () => {
  assert.deepEqual(buildRelationGraph2dData([], []), { nodes: [], links: [] });

  const graph = buildRelationGraph2dData(
    [
      {
        id: "rel-blank",
        categoryId: "c1",
        categoryName: "护送",
        displayName: "无效边",
        apiName: "blank",
        sourceName: "  ",
        targetName: "目标A",
        cardinality: "一对一",
        description: "",
      },
      {
        id: "rel-ok",
        categoryId: "c1",
        categoryName: "护送",
        displayName: "护送",
        apiName: "escort",
        sourceName: "源A",
        targetName: "目标A",
        cardinality: "一对一",
        description: "",
      },
      {
        id: "rel-api-fallback",
        categoryId: "c1",
        categoryName: "护送",
        displayName: "  ",
        apiName: "fallback_api",
        sourceName: "源B",
        targetName: "目标B",
        cardinality: "一对一",
        description: "",
      },
      {
        id: "rel-default-label",
        categoryId: "c1",
        categoryName: "护送",
        displayName: "",
        apiName: "  ",
        sourceName: "源C",
        targetName: "目标C",
        cardinality: "一对一",
        description: "",
      },
    ],
    [],
  );

  assert.equal(graph.links.length, 3);
  assert.equal(graph.links[0].relationId, "rel-ok");
  assert.equal(graph.links[1].label, "fallback_api");
  assert.equal(graph.links[2].label, "关系");
  assert.equal(graph.nodes.length, 6);
  assert.ok(graph.nodes.every((node) => node.isSeed === false));
});

test("bindRelationGraph2dLinkNodes resolves string endpoints to the same node object references", () => {
  const graph = buildRelationGraph2dData(
    [
      {
        id: "rel-1",
        categoryId: "c1",
        categoryName: "护送",
        displayName: "护送",
        apiName: "escort",
        sourceName: "Object_21",
        targetName: "辽宁号",
        cardinality: "一对一",
        description: "",
      },
    ],
    ["辽宁号"],
  );

  const bound = bindRelationGraph2dLinkNodes(graph.nodes, graph.links);
  assert.equal(bound.length, 1);
  assert.equal(typeof bound[0].source, "object");
  assert.equal(typeof bound[0].target, "object");
  assert.equal(bound[0].source.id, "Object_21");
  assert.equal(bound[0].target.id, "辽宁号");
  assert.equal(
    bound[0].source,
    graph.nodes.find((node) => node.id === "Object_21"),
  );
  assert.equal(bindRelationGraph2dLinkNodes(graph.nodes, [{ ...graph.links[0], source: "missing" }]).length, 0);
});

test("space relation workspace exposes three view modes including graph2d", () => {
  const typeSource = readFileSync(new URL("../src/types/pages/ontologySpaceRelationType.ts", import.meta.url), "utf8");
  const pageSource = readFileSync(new URL("../src/views/SpaceRelationWorkspace/index.vue", import.meta.url), "utf8");
  const workspaceSource = readFileSync(new URL("../src/views/SpaceRelationWorkspace/composables/useSpaceRelationWorkspace.ts", import.meta.url), "utf8");

  assert.match(typeSource, /export type RelationViewMode = "graph" \| "graph2d" \| "list"/);
  assert.match(pageSource, /value="graph2d"/);
  assert.match(pageSource, /RelationGraph2dView/);
  assert.match(pageSource, /relationViewMode === ['"]graph2d['"]/);
  assert.match(pageSource, /value === "graph" \|\| value === "graph2d" \|\| value === "list"/);
  assert.match(pageSource, /content="二维关系图"/);
  assert.match(pageSource, /content="三维关系图"/);
  assert.match(workspaceSource, /relationViewMode = ref<RelationViewMode>\("graph2d"\)/);
});
