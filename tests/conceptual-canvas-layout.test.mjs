import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { conceptualObjectHeight } from "../src/views/OntologyConceptualModelCreate/utils/groupConceptualAttributes.ts";
import { mapCanvasContentToConceptualModel } from "../src/views/OntologyConceptualModelCreate/utils/mapCanvasContentToConceptualModel.ts";
import {
  calculateParallelRelationLayouts,
  calculateParallelRelationVertices,
} from "../src/views/OntologyConceptualModelCreate/utils/layoutConceptualModelContent.ts";

const ontology = (name, count = 0) => ({
  apiName: name,
  displayName: name,
  properties: Array.from({ length: count }, (_, index) => ({
    apiName: `field${index}`,
    displayName: `字段${index}`,
    storageGroup: index % 2 ? "detail" : "main",
  })),
});
const link = (from, to, name = `${from}-${to}`) => ({ name, apiName: name, fromOntologyApiName: from, toOntologyApiName: to });

/**
 * @description 验证每一对节点矩形均互不相交。
 * @param {Array<object>} objects 已布局的节点。
 */
function assertNoOverlap(objects) {
  for (let i = 0; i < objects.length; i++) {
    for (let j = i + 1; j < objects.length; j++) {
      const a = objects[i];
      const b = objects[j];
      const separated =
        a.x + 240 <= b.x || b.x + 240 <= a.x || a.y + conceptualObjectHeight(a.attributes) <= b.y || b.y + conceptualObjectHeight(b.attributes) <= a.y;
      assert.ok(separated, `${a.apiName} overlaps ${b.apiName}`);
    }
  }
}

test("related branches and tall nodes have nonoverlapping positions with directional ports", () => {
  const data = { ontologies: [ontology("a", 20), ontology("b", 8), ontology("c"), ontology("d")], links: [link("a", "b"), link("a", "c"), link("c", "d")] };
  const original = structuredClone(data);
  const mapped = mapCanvasContentToConceptualModel(data);
  assert.deepEqual(data, original);
  assert.deepEqual(mapped, mapCanvasContentToConceptualModel(data));
  assertNoOverlap(mapped.objects);
  assert.ok(new Set(mapped.objects.map((item) => item.x)).size > 1);
  assert.ok(new Set(mapped.objects.map((item) => item.y)).size > 1);
  for (const relation of mapped.relations) {
    assert.ok(relation.sourcePort);
    assert.ok(relation.targetPort);
    const source = mapped.objects.find((item) => item.id === relation.sourceId);
    const target = mapped.objects.find((item) => item.id === relation.targetId);
    if (relation.sourcePort === "bottom") assert.ok(source.y < target.y);
    if (relation.sourcePort === "top") assert.ok(source.y > target.y);
    if (relation.sourcePort === "right") assert.ok(source.x < target.x);
    if (relation.sourcePort === "left") assert.ok(source.x > target.x);
  }
});

test("isolated objects and disconnected cyclic graphs have nonoverlapping positions", () => {
  const data = {
    ontologies: [ontology("a"), ontology("b"), ontology("c"), ontology("d"), ontology("e"), ontology("f")],
    links: [link("a", "b"), link("b", "a"), link("c", "d")],
  };
  const mapped = mapCanvasContentToConceptualModel(data);
  assertNoOverlap(mapped.objects);
  assert.ok(new Set(mapped.objects.map((item) => item.y)).size > 1);
  assert.equal(mapped.relations.length, 3);
});

test("parallel and reversed relationships receive distinct paths and update after movement", () => {
  const mapped = mapCanvasContentToConceptualModel({
    ontologies: [ontology("a"), ontology("b")],
    links: [link("a", "b", "one"), link("a", "b", "two"), link("b", "a", "three")],
  });
  const before = calculateParallelRelationVertices(mapped.objects, mapped.relations);
  const paths = mapped.relations.map((relation) => before.get(relation.id));
  assert.equal(new Set(paths.map((path) => JSON.stringify(path))).size, 3);
  assert.ok(paths.every((path) => path?.length));
  const moved = mapped.objects.map((object, index) => (index === 0 ? { ...object, x: object.x + 100 } : object));
  const after = calculateParallelRelationVertices(moved, mapped.relations);
  assert.notDeepEqual(after.get(mapped.relations[0].id), before.get(mapped.relations[0].id));
  assert.equal(calculateParallelRelationVertices(moved, mapped.relations.slice(0, 1)).size, 0);
});

test("parallel relationships share facing ports and stagger edge labels", () => {
  const mapped = mapCanvasContentToConceptualModel({
    ontologies: [ontology("a"), ontology("b")],
    links: [link("a", "b", "one"), link("a", "b", "two"), link("a", "b", "three")],
  });
  const layouts = calculateParallelRelationLayouts(mapped.objects, mapped.relations);
  assert.equal(layouts.size, 3);
  const items = mapped.relations.map((relation) => layouts.get(relation.id));
  assert.ok(items.every((item) => item));
  assert.equal(new Set(items.map((item) => `${item.sourcePort}->${item.targetPort}`)).size, 1);
  assert.equal(new Set(items.map((item) => item.labelDistance)).size, 3);
  assert.equal(new Set(items.map((item) => JSON.stringify(item.vertices))).size, 3);
  const reversed = calculateParallelRelationLayouts(mapped.objects, [
    { id: 1, sourceId: mapped.objects[1].id, targetId: mapped.objects[0].id },
    { id: 2, sourceId: mapped.objects[1].id, targetId: mapped.objects[0].id },
  ]);
  const forwardPort = items[0].sourcePort;
  const reversePort = reversed.get(1)?.sourcePort;
  assert.ok(forwardPort);
  assert.ok(reversePort);
  assert.notEqual(forwardPort, reversePort);
});

test("graph canvas uses smooth connectors only for parallel relationships", () => {
  const source = readFileSync(new URL("../src/views/OntologyConceptualModelCreate/components/ConceptualModelGraphCanvas.vue", import.meta.url), "utf8");
  assert.match(source, /const connectorName = layout \? ["']smooth["'] : ["']normal["']/);
  assert.match(source, /existing\.setConnector\(connectorName\)/);
  assert.match(source, /connector: \{ name: connectorName \}/);
});

test("empty, missing endpoint and self-referencing relations do not crash layout", () => {
  assert.deepEqual(mapCanvasContentToConceptualModel(undefined), { objects: [], relations: [], nextSequence: 0 });
  const mapped = mapCanvasContentToConceptualModel({ ontologies: [ontology("a")], links: [link("missing", "a"), link("a", "a")] });
  assert.equal(mapped.relations[0].sourceId, null);
  assert.equal(mapped.relations[0].sourcePort, null);
  assert.equal(mapped.relations.length, 2);
  assert.doesNotThrow(() => calculateParallelRelationVertices(mapped.objects, mapped.relations));
});

test("graph sync applies distinct paths and refreshes them after an object moves", () => {
  const mapped = mapCanvasContentToConceptualModel({
    ontologies: [ontology("a"), ontology("b")],
    links: [link("a", "b", "one"), link("b", "a", "two")],
  });
  const source = readFileSync(new URL("../src/views/OntologyConceptualModelCreate/components/ConceptualModelGraphCanvas.vue", import.meta.url), "utf8");
  const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/import[\s\S]*?from\s+"[^"]+";/g, "");
  const code = ts.transpile(`${script}\nreturn { syncGraph, setGraph: (value) => { graph = value; } };`, { target: ts.ScriptTarget.ES2022 });
  const cells = new Map();
  const graph = {
    getNodes: () => [...cells.values()].filter((cell) => cell.isNode()),
    getEdges: () => [...cells.values()].filter((cell) => cell.isEdge()),
    getCellById: (id) => cells.get(id),
    findViewByCell: () => undefined,
    addNode: (config) => {
      const node = {
        id: config.id,
        isNode: () => true,
        isEdge: () => false,
        getPosition: () => ({ x: config.x, y: config.y }),
        setPosition: (x, y) => {
          config.x = x;
          config.y = y;
        },
        setData: () => {},
        getSize: () => ({ height: config.height }),
        resize: () => {},
      };
      cells.set(config.id, node);
      return node;
    },
    addEdge: (config) => {
      const edge = {
        id: config.id,
        isNode: () => false,
        isEdge: () => true,
        connector: config.connector?.name ?? "normal",
        getSourceCellId: () => config.source.cell,
        getTargetCellId: () => config.target.cell,
        getSourcePortId: () => config.source.port,
        getTargetPortId: () => config.target.port,
        getVertices: () => config.vertices,
        setVertices: (value) => {
          config.vertices = value;
        },
        setConnector: (name) => {
          edge.connector = name;
        },
        setSource: (value) => {
          config.source = value;
        },
        setTarget: (value) => {
          config.target = value;
        },
        setLabels: () => {},
        setAttrs: () => {},
        setZIndex: () => {},
      };
      cells.set(config.id, edge);
      return edge;
    },
  };
  const deps = {
    defineProps: () => ({ ...mapped, selected: null }),
    defineEmits: () => () => {},
    defineExpose: () => {},
    ref: () => ({ value: null }),
    useDocumentTheme: () => ({ isDark: { value: false } }),
    watch: () => {},
    onMounted: () => {},
    onBeforeUnmount: () => {},
    calculateParallelRelationLayouts,
    conceptualObjectHeight,
    CONCEPTUAL_OBJECT_WIDTH: 240,
    CONCEPTUAL_OBJECT_SHAPE: "object",
    conceptualObjectCellId: (id) => `obj-${id}`,
    conceptualRelationCellId: (id) => `rel-${id}`,
    parseConceptualObjectCellId: (id) => Number(id.slice(4)),
    parseConceptualRelationCellId: (id) => Number(id.slice(4)),
    relationTerminal: (relation, end) => ({
      cell: `obj-${end === "source" ? relation.sourceId : relation.targetId}`,
      port: end === "source" ? relation.sourcePort : relation.targetPort,
    }),
    conceptualEdgeAttrs: () => ({}),
    conceptualEdgeLabel: (_text, distance = 0.5) => ({ position: distance }),
    applyRelationEdgeTools: () => {},
  };
  const canvas = new Function(...Object.keys(deps), code)(...Object.values(deps));
  canvas.setGraph(graph);
  canvas.syncGraph();
  const first = cells.get(`rel-${mapped.relations[0].id}`);
  const second = cells.get(`rel-${mapped.relations[1].id}`);
  assert.notDeepEqual(first.getVertices(), second.getVertices());
  assert.equal(first.connector, "smooth");
  assert.equal(second.connector, "smooth");
  const before = first.getVertices();
  mapped.objects[0].x += 100;
  canvas.syncGraph();
  assert.notDeepEqual(first.getVertices(), before);
  assert.equal(cells.get(`obj-${mapped.objects[0].id}`).getPosition().x, mapped.objects[0].x);
});
