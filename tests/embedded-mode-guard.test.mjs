import assert from "node:assert/strict";
import test from "node:test";

import {
  EMBEDDED_MODE_QUERY_KEY,
  WORKSPACE_LAYOUT_ROUTE_NAME,
  registerEmbeddedModeGuard,
  resolveEmbeddedPropagation,
} from "../src/router/embeddedModeGuard.ts";

const workspaceMatch = { name: WORKSPACE_LAYOUT_ROUTE_NAME };

function createToRoute(overrides = {}) {
  return {
    path: "/workspace/ontology-space-management/space-1/object",
    query: {},
    hash: "",
    matched: [workspaceMatch, { name: "OntologySpaceManagementDetailObject" }],
    ...overrides,
  };
}

function createFromRoute(overrides = {}) {
  return {
    path: "/workspace/ontology-space-management",
    query: {},
    hash: "",
    matched: [workspaceMatch, { name: "OntologySpaceManagement" }],
    ...overrides,
  };
}

test("keeps navigation unchanged when target already carries the embedded param", () => {
  const to = createToRoute({ query: { [EMBEDDED_MODE_QUERY_KEY]: "u1" } });
  const from = createFromRoute();

  assert.equal(resolveEmbeddedPropagation(to, from), undefined);
});

test("propagates the embedded param to layout child routes missing it", () => {
  const to = createToRoute();
  const from = createFromRoute({ query: { [EMBEDDED_MODE_QUERY_KEY]: "u1" } });

  assert.deepEqual(resolveEmbeddedPropagation(to, from), {
    path: to.path,
    query: { [EMBEDDED_MODE_QUERY_KEY]: "u1" },
    hash: "",
  });
});

test("keeps existing target query params while propagating the embedded param", () => {
  const to = createToRoute({ query: { keyword: "cache" } });
  const from = createFromRoute({ query: { [EMBEDDED_MODE_QUERY_KEY]: "u1" } });

  assert.deepEqual(resolveEmbeddedPropagation(to, from), {
    path: to.path,
    query: { keyword: "cache", [EMBEDDED_MODE_QUERY_KEY]: "u1" },
    hash: "",
  });
});

test("does not propagate when the source route has no embedded param", () => {
  const to = createToRoute();
  const from = createFromRoute();

  assert.equal(resolveEmbeddedPropagation(to, from), undefined);
});

test("does not propagate to routes outside the workspace layout", () => {
  const to = createToRoute({ path: "/", matched: [{ name: "Login" }] });
  const from = createFromRoute({ query: { [EMBEDDED_MODE_QUERY_KEY]: "u1" } });

  assert.equal(resolveEmbeddedPropagation(to, from), undefined);
});

test("ignores non-string embedded param values on the source route", () => {
  const to = createToRoute();
  const from = createFromRoute({ query: { [EMBEDDED_MODE_QUERY_KEY]: ["u1"] } });

  assert.equal(resolveEmbeddedPropagation(to, from), undefined);
});

test("resolving the redirected location again stops propagating (no redirect loop)", () => {
  const from = createFromRoute({ query: { [EMBEDDED_MODE_QUERY_KEY]: "u1" } });
  const redirect = resolveEmbeddedPropagation(createToRoute(), from);

  assert.ok(redirect);
  assert.equal(resolveEmbeddedPropagation(createToRoute(redirect), from), undefined);
});

test("registered guard propagates the param and can be unregistered", () => {
  let guard = null;
  const fakeRouter = {
    beforeEach(fn) {
      guard = fn;
      return () => {
        guard = null;
      };
    },
  };

  const unregister = registerEmbeddedModeGuard(fakeRouter);
  const to = createToRoute();
  const from = createFromRoute({ query: { [EMBEDDED_MODE_QUERY_KEY]: "u1" } });

  assert.deepEqual(guard(to, from), {
    path: to.path,
    query: { [EMBEDDED_MODE_QUERY_KEY]: "u1" },
    hash: "",
  });

  unregister();
  assert.equal(guard, null);
});
