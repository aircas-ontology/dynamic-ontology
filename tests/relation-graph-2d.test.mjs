import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createOntologySpaceRelationWorkspaceData } from "../src/mocks/ontologySpaceRelationMock/ontologySpaceRelationMock.ts";
import { bindRelationGraph2dLinkNodes, buildRelationGraph2dData, filterCollapsedRelationGraph } from "../src/components/OntologyRelationGraph2d/graphData.ts";
import { layoutRelationGraph2dPositions } from "../src/components/OntologyRelationGraph2d/layoutRelationGraph2d.ts";

test("collapsed branches retain shared paths and expand again", () => {
  const nodes = ["root", "a", "b", "shared", "leaf"].map((id) => ({ id, label: id, isSeed: id === "root", degree: 2 }));
  const links = [
    ["root", "a"],
    ["root", "b"],
    ["a", "shared"],
    ["b", "shared"],
    ["a", "leaf"],
  ].map(([source, target], index) => ({
    id: String(index),
    source,
    target,
    relationId: String(index),
    label: "",
    categoryName: "",
  }));
  const collapsed = filterCollapsedRelationGraph({ nodes, links }, new Set(["a"]));
  assert.deepEqual(
    collapsed.nodes.map((node) => node.id),
    ["root", "a", "b", "shared"],
  );
  assert.deepEqual(
    collapsed.links.map((link) => link.id),
    ["0", "1", "3"],
  );
  assert.deepEqual(filterCollapsedRelationGraph({ nodes, links }, new Set()).nodes, nodes);
});

test("directed collapse hides only eligible targets and preserves outgoing links and cycles", () => {
  const nodes = ["a", "b", "c", "d", "e"].map((id) => ({ id, label: id, isSeed: false, degree: 2 }));
  const links = [
    ["a", "b"],
    ["c", "b"],
    ["a", "d"],
    ["d", "e"],
    ["e", "d"],
    ["b", "b"],
  ].map(([source, target], index) => ({
    id: String(index),
    source,
    target,
    relationId: String(index),
    label: "",
    categoryName: "",
  }));
  const one = filterCollapsedRelationGraph({ nodes, links }, new Set(["a", "b"]));
  assert.deepEqual(
    one.nodes.map((node) => node.id),
    ["a", "b", "c", "d", "e"],
  );
  assert.deepEqual(
    one.links.map((link) => link.id),
    ["1", "3", "4"],
  );
  const both = filterCollapsedRelationGraph({ nodes, links }, new Set(["a", "b", "c"]));
  assert.deepEqual(
    both.nodes.map((node) => node.id),
    ["a", "c", "d", "e"],
  );
  assert.deepEqual(
    filterCollapsedRelationGraph({ nodes, links }, new Set(["b"])).links.map((link) => link.id),
    ["0", "1", "2", "3", "4"],
  );
});

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

test("layoutRelationGraph2dPositions returns empty map for empty nodes", () => {
  assert.equal(layoutRelationGraph2dPositions([], []).size, 0);
});

test("layoutRelationGraph2dPositions pins seed at origin and places neighbors on one ring", () => {
  const nodes = [
    { id: "seed", label: "seed", isSeed: true, degree: 2 },
    { id: "a", label: "a", isSeed: false, degree: 1 },
    { id: "b", label: "b", isSeed: false, degree: 1 },
  ];
  const links = [
    { id: "l1", source: "seed", target: "a", relationId: "r1", label: "r1", categoryName: "c" },
    { id: "l2", source: "b", target: "seed", relationId: "r2", label: "r2", categoryName: "c" },
  ];

  const positions = layoutRelationGraph2dPositions(nodes, links);
  const seed = positions.get("seed");
  const a = positions.get("a");
  const b = positions.get("b");

  assert.ok(seed && a && b);
  assert.equal(seed.x, 0);
  assert.equal(seed.y, 0);
  assert.equal(seed.hop, 0);
  assert.equal(a.hop, 1);
  assert.equal(b.hop, 1);

  const radiusA = Math.hypot(a.x, a.y);
  const radiusB = Math.hypot(b.x, b.y);
  assert.ok(Math.abs(radiusA - radiusB) < 1e-6);
  assert.ok(radiusA > 0);
});

test("layoutRelationGraph2dPositions uses max-degree hub when no seed exists", () => {
  const nodes = [
    { id: "hub", label: "hub", isSeed: false, degree: 3 },
    { id: "leaf", label: "leaf", isSeed: false, degree: 1 },
    { id: "other", label: "other", isSeed: false, degree: 1 },
  ];
  const links = [
    { id: "l1", source: "hub", target: "leaf", relationId: "r1", label: "r1", categoryName: "c" },
    { id: "l2", source: "hub", target: "other", relationId: "r2", label: "r2", categoryName: "c" },
  ];

  const positions = layoutRelationGraph2dPositions(nodes, links);
  const hub = positions.get("hub");
  assert.ok(hub);
  assert.equal(hub.x, 0);
  assert.equal(hub.y, 0);
  assert.equal(hub.hop, 0);
});

test("layoutRelationGraph2dPositions places farther hops on larger rings", () => {
  const nodes = [
    { id: "seed", label: "seed", isSeed: true, degree: 1 },
    { id: "mid", label: "mid", isSeed: false, degree: 2 },
    { id: "far", label: "far", isSeed: false, degree: 1 },
  ];
  const links = [
    { id: "l1", source: "seed", target: "mid", relationId: "r1", label: "r1", categoryName: "c" },
    { id: "l2", source: "mid", target: "far", relationId: "r2", label: "r2", categoryName: "c" },
  ];

  const positions = layoutRelationGraph2dPositions(nodes, links);
  const mid = positions.get("mid");
  const far = positions.get("far");
  assert.ok(mid && far);
  assert.equal(mid.hop, 1);
  assert.equal(far.hop, 2);
  assert.ok(Math.hypot(far.x, far.y) > Math.hypot(mid.x, mid.y));
});

test("layoutRelationGraph2dPositions spreads multiple seeds and places orphans outside", () => {
  const nodes = [
    { id: "seed-a", label: "seed-a", isSeed: true, degree: 0 },
    { id: "seed-b", label: "seed-b", isSeed: true, degree: 0 },
    { id: "orphan", label: "orphan", isSeed: false, degree: 0 },
  ];

  const positions = layoutRelationGraph2dPositions(nodes, []);
  const seedA = positions.get("seed-a");
  const seedB = positions.get("seed-b");
  const orphan = positions.get("orphan");

  assert.ok(seedA && seedB && orphan);
  assert.equal(seedA.hop, 0);
  assert.equal(seedB.hop, 0);
  assert.ok(Math.hypot(seedA.x, seedA.y) > 0 || Math.hypot(seedB.x, seedB.y) > 0);
  assert.ok(orphan.hop > 0);
  assert.ok(Math.hypot(orphan.x, orphan.y) > Math.max(Math.hypot(seedA.x, seedA.y), Math.hypot(seedB.x, seedB.y)));
});

test("createRelationGraph2d uses concentric layout warm start and faster cooling", () => {
  const source = readFileSync(new URL("../src/components/OntologyRelationGraph2d/createRelationGraph2d.ts", import.meta.url), "utf8");
  assert.match(source, /layoutRelationGraph2dPositions/);
  assert.match(source, /\.tick\(/);
  assert.match(source, /alphaDecay/);
  assert.match(source, /velocityDecay/);
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
