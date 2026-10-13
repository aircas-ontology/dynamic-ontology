import assert from "node:assert/strict";
import test from "node:test";

import {
  EMBEDDED_AUTOLOGIN_PASSWORD,
  EMBEDDED_USER_STORAGE_KEY,
  resolveAutoLoginDecision,
  registerEmbeddedAutoLoginGuard,
  readStoredUser,
  writeStoredUser,
  clearStoredUser,
} from "../src/router/embeddedAutoLoginGuard.ts";

const QUERY_KEY = "userName";

function createQuery(userName) {
  if (userName === undefined) return {};
  return { [QUERY_KEY]: userName };
}

// ---------------------------------------------------------------------------
// resolveAutoLoginDecision — 纯函数
// ---------------------------------------------------------------------------

test("skips auto-login when no userName query param is present", () => {
  assert.deepEqual(resolveAutoLoginDecision({}, null, false), { needsLogin: false });
  assert.deepEqual(resolveAutoLoginDecision({}, "u1", true), { needsLogin: false });
});

test("requests login when userName is present and no stored user or token", () => {
  assert.deepEqual(resolveAutoLoginDecision(createQuery("u1"), null, false), {
    needsLogin: true,
    userName: "u1",
  });
});

test("skips when already logged in as the same embedded user with a valid token", () => {
  assert.deepEqual(resolveAutoLoginDecision(createQuery("u1"), "u1", true), {
    needsLogin: false,
  });
});

test("requests login when stored user matches but token is missing (expired)", () => {
  assert.deepEqual(resolveAutoLoginDecision(createQuery("u1"), "u1", false), {
    needsLogin: true,
    userName: "u1",
  });
});

test("requests login when stored user differs from the incoming userName", () => {
  assert.deepEqual(resolveAutoLoginDecision(createQuery("u2"), "u1", true), {
    needsLogin: true,
    userName: "u2",
  });
});

test("ignores non-string userName values", () => {
  assert.deepEqual(resolveAutoLoginDecision({ [QUERY_KEY]: ["u1"] }, null, false), {
    needsLogin: false,
  });
  assert.deepEqual(resolveAutoLoginDecision({ [QUERY_KEY]: 123 }, null, false), {
    needsLogin: false,
  });
});

test("trims whitespace before comparing userName", () => {
  assert.deepEqual(resolveAutoLoginDecision(createQuery("  u1  "), "u1", true), {
    needsLogin: false,
  });
});

// ---------------------------------------------------------------------------
// registerEmbeddedAutoLoginGuard — 注册守卫 + 依赖注入
// ---------------------------------------------------------------------------

function createFakeRouter() {
  let guard = null;
  const fakeRouter = {
    beforeEach(fn) {
      guard = fn;
      return () => {
        guard = null;
      };
    },
  };
  fakeRouter._getGuard = () => guard;
  return fakeRouter;
}

function createFakeDeps(overrides = {}) {
  const calls = { loginArgs: [], storedUser: null, cleared: false };
  return {
    calls,
    login: async (params) => {
      calls.loginArgs.push(params);
    },
    getStoredUser: () => calls.storedUser,
    setStoredUser: (userName) => {
      calls.storedUser = userName;
    },
    clearStoredUser: () => {
      calls.cleared = true;
      calls.storedUser = null;
    },
    hasToken: () => true,
    ...overrides,
  };
}

test("registered guard calls login with userName and fixed password when needed", async () => {
  const router = createFakeRouter();
  const deps = createFakeDeps();
  registerEmbeddedAutoLoginGuard(router, deps);

  const result = await router._getGuard()({ path: "/workspace/ontology-space-management", query: createQuery("u1"), matched: [] }, { query: {}, matched: [] });

  assert.equal(result, undefined);
  assert.deepEqual(deps.calls.loginArgs, [{ username: "u1", password: EMBEDDED_AUTOLOGIN_PASSWORD }]);
  assert.equal(deps.calls.storedUser, "u1");
  assert.equal(deps.calls.cleared, false);
});

test("registered guard skips login when not needed", async () => {
  const router = createFakeRouter();
  const deps = createFakeDeps({ hasToken: () => true });
  deps.calls.storedUser = "u1";
  registerEmbeddedAutoLoginGuard(router, deps);

  const result = await router._getGuard()({ path: "/workspace/ontology-space-management", query: createQuery("u1"), matched: [] }, { query: {}, matched: [] });

  assert.equal(result, undefined);
  assert.equal(deps.calls.loginArgs.length, 0);
});

test("registered guard clears stored user on login failure", async () => {
  const router = createFakeRouter();
  const deps = createFakeDeps({
    login: async () => {
      throw new Error("network error");
    },
  });
  registerEmbeddedAutoLoginGuard(router, deps);

  const result = await router._getGuard()({ path: "/workspace/ontology-space-management", query: createQuery("u1"), matched: [] }, { query: {}, matched: [] });

  assert.equal(result, undefined);
  assert.equal(deps.calls.cleared, true);
  assert.equal(deps.calls.storedUser, null);
});

test("registered guard skips when userName query is absent", async () => {
  const router = createFakeRouter();
  const deps = createFakeDeps();
  registerEmbeddedAutoLoginGuard(router, deps);

  await router._getGuard()({ path: "/workspace/ontology-space-management", query: {}, matched: [] }, { query: {}, matched: [] });

  assert.equal(deps.calls.loginArgs.length, 0);
});

test("registered guard can be unregistered", () => {
  const router = createFakeRouter();
  const deps = createFakeDeps();
  const unregister = registerEmbeddedAutoLoginGuard(router, deps);
  assert.ok(router._getGuard() !== null);
  unregister();
  assert.equal(router._getGuard(), null);
});

test("EMBEDDED_USER_STORAGE_KEY and EMBEDDED_AUTOLOGIN_PASSWORD are stable constants", () => {
  assert.equal(typeof EMBEDDED_USER_STORAGE_KEY, "string");
  assert.equal(EMBEDDED_AUTOLOGIN_PASSWORD, "a123456");
});

// ---------------------------------------------------------------------------
// readStoredUser / writeStoredUser / clearStoredUser — sessionStorage helpers
// ---------------------------------------------------------------------------

function createFakeSessionStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
}

function withFakeWindow(fn) {
  const originalWindow = globalThis.window;
  return () => {
    const fakeStorage = createFakeSessionStorage();
    globalThis.window = { sessionStorage: fakeStorage };
    try {
      return fn(fakeStorage);
    } finally {
      if (originalWindow === undefined) {
        delete globalThis.window;
      } else {
        globalThis.window = originalWindow;
      }
    }
  };
}

test(
  "writeStoredUser persists and readStoredUser retrieves the userName",
  withFakeWindow(() => {
    assert.equal(readStoredUser(), null);
    writeStoredUser("u1");
    assert.equal(readStoredUser(), "u1");
  }),
);

test(
  "clearStoredUser removes the stored userName",
  withFakeWindow(() => {
    writeStoredUser("u1");
    assert.equal(readStoredUser(), "u1");
    clearStoredUser();
    assert.equal(readStoredUser(), null);
  }),
);

test(
  "readStoredUser returns null and cleans up when stored value is corrupt JSON",
  withFakeWindow((fakeStorage) => {
    fakeStorage.setItem(EMBEDDED_USER_STORAGE_KEY, "{corrupt");
    assert.equal(readStoredUser(), null);
    assert.equal(fakeStorage.getItem(EMBEDDED_USER_STORAGE_KEY), null);
  }),
);

test("readStoredUser returns null when window is undefined (non-browser env)", () => {
  const originalWindow = globalThis.window;
  delete globalThis.window;
  try {
    assert.equal(readStoredUser(), null);
  } finally {
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    }
  }
});
