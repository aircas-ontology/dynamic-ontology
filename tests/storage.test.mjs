import assert from "node:assert/strict";
import test from "node:test";

import * as storageModule from "../src/utils/storage.ts";

const { getStorage, removeStorage, setStorage } = storageModule;

function createStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

test("storage returns null for missing values and preserves valid values", () => {
  const storage = createStorage();

  assert.equal(getStorage("missing", undefined, storage), null);
  setStorage("profile", { name: "Aircas" }, storage);
  assert.deepEqual(getStorage("profile", undefined, storage), { name: "Aircas" });
  removeStorage("profile", storage);
  assert.equal(getStorage("profile", undefined, storage), null);
});

test("storage exposes distinguishable errors without leaking stored values", () => {
  const storage = createStorage();
  storage.setItem("credential", JSON.stringify("sensitive-value"));

  assert.throws(
    () => getStorage("credential", (value) => typeof value === "number", storage),
    (error) => {
      assert.equal(typeof storageModule.StorageError, "function");
      assert.ok(error instanceof storageModule.StorageError);
      assert.equal(error.operation, "get");
      assert.doesNotMatch(error.message, /sensitive-value/);
      return true;
    },
  );
});

test("storage reports the attempted operation when browser storage is unavailable", () => {
  const originalWindow = globalThis.window;
  delete globalThis.window;

  try {
    assert.throws(() => getStorage("profile"), (error) => error.operation === "get");
    assert.throws(() => setStorage("profile", {}), (error) => error.operation === "set");
    assert.throws(() => removeStorage("profile"), (error) => error.operation === "remove");
  } finally {
    globalThis.window = originalWindow;
  }
});
