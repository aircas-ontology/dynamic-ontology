import assert from "node:assert/strict";
import { test } from "node:test";
import { isMainStorageGroup, resolveDatasourceTableRole } from "../src/views/OntologyObjectAttributePanel/utils/resolveDatasourceTableRole.ts";

test("isMainStorageGroup treats main and empty as primary storage", () => {
  assert.equal(isMainStorageGroup("main"), true);
  assert.equal(isMainStorageGroup(""), true);
  assert.equal(isMainStorageGroup("  "), true);
  assert.equal(isMainStorageGroup("orders"), false);
  assert.equal(isMainStorageGroup(undefined), true);
});

test("resolveDatasourceTableRole prefers bound property storage groups", () => {
  const table = { id: "s.orders", name: "orders" };
  assert.equal(
    resolveDatasourceTableRole(table, [
      { storageGroup: "main", boundTableId: "s.orders" },
      { storageGroup: "items", boundTableId: "s.items" },
    ]),
    "主表",
  );
  assert.equal(
    resolveDatasourceTableRole(table, [
      { storageGroup: "orders", boundTableId: "s.orders" },
      { storageGroup: "main", boundTableId: "s.main" },
    ]),
    "子表",
  );
});

test("resolveDatasourceTableRole matches unbound tables by storage group name", () => {
  const table = { id: "s.items", name: "items" };
  assert.equal(resolveDatasourceTableRole(table, [{ storageGroup: "main" }, { storageGroup: "items" }]), "子表");
  assert.equal(resolveDatasourceTableRole({ id: "s.main_table", name: "main_table" }, [{ storageGroup: "main" }, { storageGroup: "items" }]), "主表");
});

test("resolveDatasourceTableRole falls back to generic table when no groups exist", () => {
  assert.equal(resolveDatasourceTableRole({ id: "s.t", name: "t" }, []), "表");
});
