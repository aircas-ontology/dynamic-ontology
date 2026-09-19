import assert from "node:assert/strict";
import test from "node:test";

import { AUTH_HOME_ROUTE_NAME, LOGIN_ROUTE_NAME, registerAuthGuard, resolveAuthRedirect } from "../src/router/authGuard.ts";

test("redirects unauthenticated users away from business routes to login", () => {
  assert.deepEqual(resolveAuthRedirect({ name: "OntologySpaceManagement" }, false), {
    name: LOGIN_ROUTE_NAME,
  });
});

test("allows unauthenticated users to open the login route", () => {
  assert.equal(resolveAuthRedirect({ name: LOGIN_ROUTE_NAME }, false), undefined);
});

test("redirects authenticated users away from login to the home route", () => {
  assert.deepEqual(resolveAuthRedirect({ name: LOGIN_ROUTE_NAME }, true), {
    name: AUTH_HOME_ROUTE_NAME,
  });
});

test("allows authenticated users to stay on business routes", () => {
  assert.equal(resolveAuthRedirect({ name: "OntologySpaceManagement" }, true), undefined);
});

function createFakeRouter() {
  let guard = null;

  return {
    beforeEach(fn) {
      guard = fn;
      return () => {
        guard = null;
      };
    },
    navigate(to) {
      return guard ? guard(to) : undefined;
    },
  };
}

test("registered guard enforces authentication and can be unregistered", () => {
  const originalWindow = globalThis.window;

  try {
    delete globalThis.window;
    const unauthenticatedRouter = createFakeRouter();
    const unregister = registerAuthGuard(unauthenticatedRouter);

    assert.deepEqual(unauthenticatedRouter.navigate({ name: "OntologySpaceManagement" }), {
      name: LOGIN_ROUTE_NAME,
    });
    assert.equal(unauthenticatedRouter.navigate({ name: LOGIN_ROUTE_NAME }), undefined);

    unregister();
    assert.equal(unauthenticatedRouter.navigate({ name: "OntologySpaceManagement" }), undefined);

    const authenticatedRouter = createFakeRouter();
    registerAuthGuard(authenticatedRouter);
    const storage = {
      values: new Map([["ontology-login-token", JSON.stringify("abc")]]),
      getItem(key) {
        return this.values.has(key) ? this.values.get(key) : null;
      },
      setItem(key, value) {
        this.values.set(key, String(value));
      },
      removeItem(key) {
        this.values.delete(key);
      },
    };
    globalThis.window = { sessionStorage: storage };

    assert.deepEqual(authenticatedRouter.navigate({ name: LOGIN_ROUTE_NAME }), {
      name: AUTH_HOME_ROUTE_NAME,
    });
    assert.equal(authenticatedRouter.navigate({ name: "OntologySpaceManagement" }), undefined);
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  }
});
