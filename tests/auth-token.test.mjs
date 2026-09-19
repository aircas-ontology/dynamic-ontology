import assert from "node:assert/strict";
import test from "node:test";

import { clearLoginToken, getAuthorizationHeader, getLoginToken, hasLoginToken, LOGIN_TOKEN_STORAGE_KEY, saveLoginToken } from "../src/utils/authToken.ts";

function createSessionStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test("saves the raw token and exposes it as a Bearer authorization header", () => {
  const storage = createSessionStorage();

  saveLoginToken("abc.token", storage);

  assert.equal(getLoginToken(storage), "abc.token");
  assert.equal(getAuthorizationHeader(storage), "Bearer abc.token");
  assert.equal(hasLoginToken(storage), true);
  assert.deepEqual(JSON.parse(storage.getItem(LOGIN_TOKEN_STORAGE_KEY)), "abc.token");
});

test("normalizes an existing Bearer prefix without duplicating it", () => {
  const storage = createSessionStorage();

  saveLoginToken("Bearer abc.token", storage);

  assert.equal(getLoginToken(storage), "abc.token");
  assert.equal(getAuthorizationHeader(storage), "Bearer abc.token");
});

test("rejects blank tokens instead of persisting an empty credential", () => {
  const storage = createSessionStorage();

  assert.throws(() => saveLoginToken("   ", storage), /令牌/);
  assert.equal(hasLoginToken(storage), false);
});

test("missing token reads as null and clear removes the session token", () => {
  const storage = createSessionStorage();

  assert.equal(getLoginToken(storage), null);
  assert.equal(getAuthorizationHeader(storage), null);
  assert.equal(hasLoginToken(storage), false);

  saveLoginToken("abc", storage);
  clearLoginToken(storage);
  assert.equal(hasLoginToken(storage), false);
  assert.equal(storage.getItem(LOGIN_TOKEN_STORAGE_KEY), null);
});

test("corrupted token data is cleared and degrades to unauthenticated", () => {
  const storage = createSessionStorage();
  storage.setItem(LOGIN_TOKEN_STORAGE_KEY, "{broken-json");

  assert.equal(getLoginToken(storage), null);
  assert.equal(storage.getItem(LOGIN_TOKEN_STORAGE_KEY), null);
});

test("falls back to window.sessionStorage and stays safe without a browser", () => {
  const originalWindow = globalThis.window;

  try {
    delete globalThis.window;
    assert.equal(getLoginToken(), null);
    assert.equal(getAuthorizationHeader(), null);
    assert.doesNotThrow(() => clearLoginToken());

    const storage = createSessionStorage();
    globalThis.window = { sessionStorage: storage };
    saveLoginToken("xyz");
    assert.equal(getLoginToken(), "xyz");
    assert.equal(getAuthorizationHeader(), "Bearer xyz");
    clearLoginToken();
    assert.equal(hasLoginToken(), false);
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  }
});
