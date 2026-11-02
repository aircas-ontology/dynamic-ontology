import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createMemoryHistory, createRouter } from "vue-router";
import { workspaceRoutes } from "../src/router/modules/workspaceRoutes.ts";
import { EMBEDDED_MODE_QUERY_KEY, resolveEmbeddedPropagation } from "../src/router/embeddedModeGuard.ts";

test("workspace child route resolves to the full text search page under the layout", () => {
  const router = createRouter({ history: createMemoryHistory(), routes: workspaceRoutes });
  const route = router.resolve({ name: "FullTextSearch" });
  assert.equal(route.path, "/workspace/full-text-search");
  assert.deepEqual(
    route.matched.map((record) => record.name),
    ["Workspace", "FullTextSearch"],
  );
  assert.equal(route.meta.title, "全文检索");
});

test("full text search page exposes the retrieval input placeholder", () => {
  const source = readFileSync(new URL("../src/views/FullTextSearch/index.vue", import.meta.url), "utf8");
  assert.match(source, /placeholder="检索空间、对象、实例、属性\.\.\."/);
  assert.match(source, /OntologyGlobalSearchField/);
});

test("full text search route accepts and preserves the embedded userName parameter", () => {
  const router = createRouter({ history: createMemoryHistory(), routes: workspaceRoutes });
  const route = router.resolve({ name: "FullTextSearch", query: { [EMBEDDED_MODE_QUERY_KEY]: "u1" } });

  assert.equal(route.query[EMBEDDED_MODE_QUERY_KEY], "u1");
});

test("full text search result navigation carries userName into workspace detail routes", () => {
  const redirect = resolveEmbeddedPropagation(
    {
      path: "/workspace/ontology-object/object-1/attribute",
      query: { objectName: "飞机" },
      hash: "",
      matched: [{ name: "Workspace" }, { name: "OntologyObjectDetailAttribute" }],
    },
    {
      path: "/workspace/full-text-search",
      query: { [EMBEDDED_MODE_QUERY_KEY]: "u1" },
      hash: "",
      matched: [{ name: "Workspace" }, { name: "FullTextSearch" }],
    },
  );

  assert.deepEqual(redirect, {
    path: "/workspace/ontology-object/object-1/attribute",
    query: { objectName: "飞机", [EMBEDDED_MODE_QUERY_KEY]: "u1" },
    hash: "",
  });
});
