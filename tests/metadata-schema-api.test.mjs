import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { computed, reactive, ref, watch, nextTick } from "vue";
import { parseMetadataSchema, serializeMetadataValue } from "../src/views/OntologyObjectAttributePanel/utils/metadataSchemaAdapter.ts";

test("query accepts nested root object and multiple roots with three value types", () => {
  const root = {
    schemaId: 1,
    name: "root",
    valueType: "INPUT",
    value: "",
    children: [
      { schemaId: 2, name: "enum", valueType: "ENUM", value: "高,低" },
      { schemaId: 3, name: "range", valueType: "RANGE", value: "-1,8" },
    ],
  };
  const rows = parseMetadataSchema(root);
  assert.equal(rows.length, 3);
  assert.equal(rows[1].parentId, "1");
  assert.deepEqual(rows[1].value, ["高", "低"]);
  assert.deepEqual(rows[2].value, { min: -1, max: 8 });
  assert.deepEqual(parseMetadataSchema([root]), rows);
  assert.deepEqual(parseMetadataSchema(null), []);
  assert.deepEqual(parseMetadataSchema([]), []);
});

test("query rejects missing tree identifiers, duplicate IDs, invalid children and range", () => {
  for (const data of [
    { name: "x" },
    { schemaId: 1, name: "x", children: {} },
    [
      { schemaId: 1, name: "a" },
      { schemaId: 1, name: "b" },
    ],
    { schemaId: 1, name: "x", valueType: "RANGE", value: "bad" },
    "bad",
  ]) {
    assert.throws(() => parseMetadataSchema(data), /查询接口/);
  }
});

test("write serializes all types and rejects ambiguous enum and invalid range", () => {
  assert.deepEqual(serializeMetadataValue({ valueType: "input", value: "" }), { valueType: "INPUT", value: "" });
  assert.deepEqual(serializeMetadataValue({ valueType: "enum", value: ["高", "低"] }), { valueType: "ENUM", value: "高,低" });
  assert.deepEqual(serializeMetadataValue({ valueType: "range", value: { min: 0, max: 8 } }), { valueType: "RANGE", value: "0,8" });
  assert.throws(() => serializeMetadataValue({ valueType: "enum", value: ["a,b"] }));
  assert.deepEqual(serializeMetadataValue({ valueType: "enum", value: [] }), { valueType: "ENUM", value: "" });
  assert.deepEqual(serializeMetadataValue({ valueType: "range", value: null }), { valueType: "RANGE", value: "" });
  assert.throws(() => serializeMetadataValue({ valueType: "range", value: { min: 8, max: 0 } }));
});

test("empty values round trip from query into an editable record", () => {
  for (const valueType of ["INPUT", "ENUM", "RANGE"]) {
    const [record] = parseMetadataSchema({ schemaId: 1, name: "empty", valueType, value: "" });
    assert.equal(record.value, valueType === "RANGE" ? null : valueType === "INPUT" ? "" : record.value);
    assert.equal(serializeMetadataValue(record).value, "");
  }
});

test("four API functions send the documented method and parameters", () => {
  const source = readFileSync(new URL("../src/apis/metadataSchemaApi.ts", import.meta.url), "utf8");
  const code = ts.transpile(source, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS });
  const api = {};
  new Function("exports", "require", "DOMAIN_CONFIG", code)(api, () => ({ request: (config) => config }), { ONTOLOGYMANAGE_URL: "http://service" });
  const payload = { ontologyIdentifier: "object", metadataSchemaId: 4, name: "name", valueType: "INPUT", value: "x" };
  for (const [method, request] of [
    ["get", api.getMetadataSchemaInterface("object")],
    ["post", api.postMetadataSchemaInterface(payload)],
    ["put", api.putMetadataSchemaInterface(payload)],
    ["delete", api.deleteMetadataSchemaInterface(payload)],
  ]) {
    assert.equal(request.url, `http://service/ontology/property/metadata_schema${method === "get" ? "/tree" : ""}`);
    assert.equal(request.method, method);
    assert.deepEqual(method === "get" ? request.params : request.data, method === "get" ? { ontologyUniqueIdentifier: "object" } : payload);
  }
});

/**
 * @description 通过真实组件脚本和可控接口验证元数据交互。
 * @param {object} overrides 模拟接口。
 * @returns {object} 组件状态及消息。
 */
function createDialog(overrides = {}) {
  const source = readFileSync(new URL("../src/views/OntologyObjectAttributePanel/components/MetadataManageDialog.vue", import.meta.url), "utf8");
  const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/import[\s\S]*?from\s+"[^"]+";/g, "");
  const code = ts.transpile(
    `${script}\nreturn { workspace, queryLoading, queryError, formVisible, formName, formParentId, formValueType, formInputValue, formEnumValues, formSubmitting, formError, editingId, handleDialogOpened, openMetadataCreate, openMetadataEdit, confirmMetadataCreate, handleRemoveMetadata };`,
    { target: ts.ScriptTarget.ES2022 },
  );
  const props = reactive({ visible: false, ontologyIdentifier: "object" });
  const messages = [];
  const success = { code: 200, data: null, message: "" };
  const deps = {
    computed,
    ref,
    watch,
    onScopeDispose: () => {},
    defineProps: () => props,
    defineEmits: () => () => {},
    ROOT_METADATA_PARENT_ID: "",
    METADATA_VALUE_TYPE_OPTIONS: [],
    parseMetadataSchema,
    serializeMetadataValue,
    buildMetadataParentSelectTree: () => [],
    buildMetadataTree: () => [],
    formatMetadataValueSummary: () => "",
    resolveMetadataValueTypeLabel: () => "",
    getMetadataSchemaInterface: async () => success,
    postMetadataSchemaInterface: async () => success,
    putMetadataSchemaInterface: async () => success,
    deleteMetadataSchemaInterface: async () => success,
    ElMessage: { success: (message) => messages.push(message), error: (message) => messages.push(message) },
    ElMessageBox: { confirm: async () => {} },
    ...overrides,
  };
  return { dialog: new Function(...Object.keys(deps), code)(...Object.values(deps)), props, messages };
}

test("query ignores stale response and reports unsupported response structure", async () => {
  const pending = [];
  const { dialog, props } = createDialog({ getMetadataSchemaInterface: (id) => new Promise((resolve) => pending.push({ id, resolve })) });
  props.visible = true;
  await nextTick();
  props.ontologyIdentifier = "new";
  await nextTick();
  pending[1].resolve({ code: 200, data: [{ schemaId: 2, name: "new", valueType: "INPUT" }] });
  await nextTick();
  pending[0].resolve({ code: 200, data: [{ schemaId: 1, name: "old", valueType: "INPUT" }] });
  await nextTick();
  assert.equal(dialog.workspace.value.items[0].name, "new");
  const retry = dialog.handleDialogOpened();
  pending[2].resolve({ code: 200, data: [{ name: "missing ID" }] });
  await retry;
  assert.match(dialog.queryError.value, /schemaId/);
  assert.equal(dialog.queryLoading.value, false);
});

test("edit, create and delete send payloads, prevent repeated writes and refresh", async () => {
  const writes = [];
  let resolveUpdate;
  let queries = 0;
  const initial = [{ schemaId: 3, name: "level", valueType: "ENUM", value: "a,b" }];
  const { dialog } = createDialog({
    getMetadataSchemaInterface: async () => {
      queries++;
      return { code: 200, data: initial };
    },
    putMetadataSchemaInterface: (payload) => {
      writes.push(["put", payload]);
      return new Promise((resolve) => {
        resolveUpdate = resolve;
      });
    },
    postMetadataSchemaInterface: async (payload) => {
      writes.push(["post", payload]);
      return { code: 200 };
    },
    deleteMetadataSchemaInterface: async (payload) => {
      writes.push(["delete", payload]);
      return { code: 200 };
    },
  });
  await dialog.handleDialogOpened();
  dialog.openMetadataEdit("3");
  assert.deepEqual(dialog.formEnumValues.value, ["a", "b"]);
  dialog.formName.value = "new name";
  const pending = dialog.confirmMetadataCreate();
  await dialog.confirmMetadataCreate();
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0], ["put", { ontologyIdentifier: "object", metadataSchemaId: 3, name: "new name", valueType: "ENUM", value: "a,b" }]);
  resolveUpdate({ code: 200 });
  await pending;
  dialog.openMetadataCreate();
  dialog.formName.value = "child";
  dialog.formParentId.value = "3";
  await dialog.confirmMetadataCreate();
  await dialog.handleRemoveMetadata("3");
  assert.deepEqual(writes[1], ["post", { ontologyIdentifier: "object", parentId: 3, name: "child", valueType: "INPUT", value: "" }]);
  assert.deepEqual(writes[2], ["delete", { ontologyIdentifier: "object", metadataSchemaId: 3 }]);
  assert.equal(queries, 4);
});

test("command failures retain form and show error; canceled delete sends no request", async () => {
  let deletes = 0;
  const { dialog } = createDialog({
    getMetadataSchemaInterface: async () => ({ code: 200, data: [{ schemaId: 1, name: "a", valueType: "INPUT" }] }),
    postMetadataSchemaInterface: async () => ({ code: 400, message: "保存失败" }),
    deleteMetadataSchemaInterface: async () => {
      deletes++;
    },
    ElMessageBox: {
      confirm: async () => {
        throw new Error("cancel");
      },
    },
  });
  await dialog.handleDialogOpened();
  dialog.openMetadataCreate();
  dialog.formName.value = "draft";
  await dialog.confirmMetadataCreate();
  assert.equal(dialog.formVisible.value, true);
  assert.equal(dialog.formError.value, "保存失败");
  await dialog.handleRemoveMetadata("1");
  assert.equal(deletes, 0);
});
