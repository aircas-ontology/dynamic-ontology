import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { computed, ref, nextTick } from "vue";
import { mapCanvasContentToConceptualModel } from "../src/views/OntologyConceptualModelCreate/utils/mapCanvasContentToConceptualModel.ts";
import { removeRelationsConnectedToObject } from "../src/views/OntologyConceptualModelCreate/utils/removeRelationsConnectedToObject.ts";
import { findInvalidConceptualAttribute } from "../src/views/OntologyConceptualModelCreate/utils/validateConceptualAttributes.ts";
import { findInvalidCanvasModel } from "../src/views/OntologyConceptualModelCreate/utils/validateCanvasModel.ts";
import { createCanvasAttributeBindingLookup } from "../src/views/OntologyConceptualModelCreate/utils/canvasAttributeBinding.ts";
import {
  findConflictingConceptualAttributeKey,
  formatConceptualAttributeKeyConflictMessage,
} from "../src/views/OntologyConceptualModelCreate/utils/groupConceptualAttributes.ts";

/** @description 执行画布页面的真实加载及保存映射逻辑。 @param {Function} request 查询接口。 @returns {object} 页面状态和操作。 */
function createCanvas(request, getDetails = async () => ({ code: 200, data: [{ uniqueIdentifier: "p1" }, { uniqueIdentifier: "p2" }] })) {
  const source = readFileSync(new URL("../src/views/OntologyConceptualModelCreate/index.vue", import.meta.url), "utf8");
  const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/import[\s\S]*?from\s+"[^"]+";/g, "");
  const route = { query: { spaceId: "114" } };
  const requests = [];
  const deps = {
    computed,
    ref,
    nextTick,
    watch: () => {},
    onBeforeUnmount: () => {},
    useRoute: () => route,
    useRouter: () => ({ push: async () => {} }),
    ElMessage: { error: () => {}, warning: () => {}, success: () => {} },
    createOntologySpaceWithCanvasContentInterface: async (payload) => {
      requests.push(payload);
      return { code: 200, data: { spaceId: 114 } };
    },
    getOntologySpaceCanvasContentInterface: request,
    getOntologyPropertyDetailByOntologyIdInterface: getDetails,
    createCanvasAttributeBindingLookup,
    mapCanvasContentToConceptualModel,
    removeRelationsConnectedToObject,
    findInvalidConceptualAttribute,
    findInvalidCanvasModel,
    findConflictingConceptualAttributeKey,
    formatConceptualAttributeKeyConflictMessage,
  };
  return {
    ...new Function(
      ...Object.keys(deps),
      ts.transpile(
        `${script}\nreturn { loadConceptualModelCanvas, buildCanvasSpaceParams, saveConceptualModel, spaceApiName, objects, relations, addConnectedRelation, addObject, addAttribute, updateObject, updateAttribute, select, refreshSelectedAttributeBinding, bindingStatus, bindingError, selected, deleteSelected, canvasLoadError };`,
        { target: ts.ScriptTarget.ES2022 },
      ),
    )(...Object.values(deps)),
    requests,
  };
}

const content = () => ({
  ontologies: [
    {
      uniqueIdentifier: "o1",
      displayName: "船",
      apiName: "ship",
      iconUrl: "icon.png",
      properties: [
        { uniqueIdentifier: "p1", displayName: "名称", apiName: "name" },
        { uniqueIdentifier: "p2", displayName: "旧属性", apiName: "old" },
      ],
    },
    { uniqueIdentifier: "o2", displayName: "港", apiName: "port", properties: [] },
  ],
  links: [{ uniqueIdentifier: "r1", name: "停靠", apiName: "berth", fromOntologyApiName: "ship", toOntologyApiName: "port" }],
});

test("existing bound attributes lock protected edits while new attributes skip lookup", async () => {
  let calls = 0;
  const state = createCanvas(
    async () => ({ code: 200, data: content() }),
    async () => {
      calls++;
      return { code: 200, data: [{ uniqueIdentifier: "p1", datasourceId: "table", datasourceColumnName: "id" }] };
    },
  );
  await state.loadConceptualModelCanvas();
  const attribute = state.objects.value[0].attributes[0];
  state.select({ kind: "attribute", id: attribute.id });
  await state.refreshSelectedAttributeBinding();
  assert.equal(state.bindingStatus.value, "bound");
  state.updateAttribute("apiName", "changed");
  assert.equal(attribute.apiName, "name");
  state.updateAttribute("displayName", "新名称");
  assert.equal(attribute.displayName, "新名称");
  state.select({ kind: "object", id: state.objects.value[0].id });
  state.addAttribute(state.objects.value[0].id);
  assert.equal(state.bindingStatus.value, "unbound");
  assert.equal(calls, 1);
});

test("binding lookup failure locks edits and retry can restore access", async () => {
  let fail = true;
  const state = createCanvas(
    async () => ({ code: 200, data: content() }),
    async () => {
      if (fail) throw new Error("查询失败");
      return { code: 200, data: [{ uniqueIdentifier: "p1" }] };
    },
  );
  await state.loadConceptualModelCanvas();
  const attribute = state.objects.value[0].attributes[0];
  state.select({ kind: "attribute", id: attribute.id });
  await state.refreshSelectedAttributeBinding();
  assert.equal(state.bindingStatus.value, "error");
  state.updateAttribute("displayName", "新名称");
  assert.equal(attribute.displayName, "名称");
  fail = false;
  await state.refreshSelectedAttributeBinding();
  assert.equal(state.bindingStatus.value, "unbound");
});

test("late binding responses do not lock a newly selected attribute", async () => {
  let resolveDetails;
  const state = createCanvas(
    async () => ({ code: 200, data: content() }),
    () =>
      new Promise((resolve) => {
        resolveDetails = resolve;
      }),
  );
  await state.loadConceptualModelCanvas();
  state.select({ kind: "attribute", id: state.objects.value[0].attributes[0].id });
  state.select({ kind: "object", id: state.objects.value[0].id });
  state.addAttribute(state.objects.value[0].id);
  resolveDetails({ code: 200, data: [{ uniqueIdentifier: "p1", datasourceId: "table", datasourceColumnName: "id" }] });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(state.bindingStatus.value, "unbound");
});

test("saving rejects protected edits to an existing bound attribute", async () => {
  const state = createCanvas(
    async () => ({ code: 200, data: content() }),
    async () => ({
      code: 200,
      data: [{ uniqueIdentifier: "p1", datasourceId: "table", datasourceColumnName: "id" }],
    }),
  );
  await state.loadConceptualModelCanvas();
  state.spaceApiName.value = "space";
  const attribute = state.objects.value[0].attributes[0];
  attribute.apiName = "changed";
  await state.saveConceptualModel();
  assert.equal(state.requests.length, 0);
  assert.deepEqual(state.selected.value, { kind: "attribute", id: attribute.id });
});

test("saving permits bound attribute display-name edits and reports lookup failures", async () => {
  let fail = true;
  const state = createCanvas(
    async () => ({ code: 200, data: content() }),
    async () => {
      if (fail) throw new Error("绑定查询失败");
      return { code: 200, data: [{ uniqueIdentifier: "p1", datasourceId: "table", datasourceColumnName: "id" }] };
    },
  );
  await state.loadConceptualModelCanvas();
  state.spaceApiName.value = "space";
  state.objects.value[0].attributes[0].displayName = "新名称";
  await state.saveConceptualModel();
  assert.equal(state.requests.length, 0);
  assert.equal(state.bindingStatus.value, "error");
  assert.match(state.bindingError.value, /绑定查询失败/);
  fail = false;
  await state.refreshSelectedAttributeBinding();
  await state.saveConceptualModel();
  assert.equal(state.requests.length, 1);
  assert.equal(state.requests[0].ontologies[0].properties[0].displayName, "新名称");
});

test("invalid attribute blocks saving and selects the attribute; primary key fixes its fields", async () => {
  const state = createCanvas(async () => ({ code: 200, data: content() }));
  await state.loadConceptualModelCanvas();
  state.spaceApiName.value = "space";
  const attribute = state.objects.value[0].attributes[0];
  attribute.displayName = " ";
  await state.saveConceptualModel();
  assert.equal(state.requests.length, 0);
  assert.deepEqual(state.selected.value, { kind: "attribute", id: attribute.id });
  attribute.displayName = "名称";
  await state.refreshSelectedAttributeBinding();
  state.updateAttribute("isPrimary", true);
  assert.equal(attribute.apiName, "id");
  assert.equal(attribute.dataType, "Int");
  await state.saveConceptualModel();
  assert.equal(state.requests.length, 1);
});

test("existing object API is locked and invalid relations stop submission", async () => {
  const state = createCanvas(async () => ({ code: 200, data: content() }));
  await state.loadConceptualModelCanvas();
  state.spaceApiName.value = "space";
  state.updateObject("apiName", "changed");
  assert.equal(state.objects.value[0].apiName, "ship");
  state.relations.value[0].apiName = "无效";
  await state.saveConceptualModel();
  assert.equal(state.requests.length, 0);
  assert.deepEqual(state.selected.value, { kind: "relation", id: state.relations.value[0].id });
});

test("canvas saves immutable base and retains original identifiers through edits and additions", async () => {
  const initial = content();
  const expected = structuredClone(initial);
  const state = createCanvas(async () => ({ code: 200, data: initial }));
  await state.loadConceptualModelCanvas();
  state.objects.value[0].apiName = "renamedShip";
  state.objects.value[0].attributes.splice(1, 1);
  state.objects.value[0].attributes[0].apiName = "renamedName";
  state.addAttribute(state.objects.value[0].id);
  state.addObject();
  state.relations.value[0].displayName = "新关系名称";
  state.addConnectedRelation(state.objects.value[0].id, state.objects.value[1].id, "right", "left");
  initial.ontologies[0].displayName = "外部修改";
  const payload = state.buildCanvasSpaceParams();
  assert.deepEqual(payload.base, expected);
  assert.equal(payload.spaceId, 114);
  assert.equal(payload.ontologies[0].uniqueIdentifier, "o1");
  assert.equal(payload.ontologies[0].iconUrl, "icon.png");
  assert.equal(payload.ontologies[0].properties[0].uniqueIdentifier, "p1");
  assert.equal(
    payload.ontologies[0].properties.some((p) => p.uniqueIdentifier === "p2"),
    false,
  );
  assert.equal("uniqueIdentifier" in payload.ontologies[0].properties[1], false);
  assert.equal("uniqueIdentifier" in payload.ontologies[2], false);
  assert.equal(payload.links[0].uniqueIdentifier, "r1");
  assert.equal(payload.links[0].fromOntologyApiName, "renamedShip");
  assert.equal("uniqueIdentifier" in payload.links[1], false);
  state.spaceApiName.value = "space";
  const saving = state.saveConceptualModel();
  await state.saveConceptualModel();
  await saving;
  assert.equal(state.requests.length, 1);
  assert.deepEqual(state.requests[0], payload);
  state.selected.value = { kind: "object", id: state.objects.value[1].id };
  state.deleteSelected();
  const deleted = state.buildCanvasSpaceParams();
  assert.equal(
    deleted.ontologies.some((o) => o.uniqueIdentifier === "o2"),
    false,
  );
  assert.deepEqual(deleted.links, []);
  assert.deepEqual(deleted.base, expected);
});

test("loading and failed queries cannot submit an empty or stale snapshot", async () => {
  let rejectRequest;
  const state = createCanvas(
    () =>
      new Promise((resolve, reject) => {
        rejectRequest = reject;
      }),
  );
  state.spaceApiName.value = "space";
  const loading = state.loadConceptualModelCanvas();
  await state.saveConceptualModel();
  assert.equal(state.requests.length, 0);
  rejectRequest(new Error("查询失败"));
  await loading;
  assert.equal(state.canvasLoadError.value, "查询失败");
  await state.saveConceptualModel();
  assert.equal(state.requests.length, 0);
});

test("only latest successful query supplies the initial snapshot", async () => {
  const pending = [];
  const state = createCanvas(() => new Promise((resolve) => pending.push(resolve)));
  const first = state.loadConceptualModelCanvas();
  const second = state.loadConceptualModelCanvas();
  pending[1]({ code: 200, data: { ontologies: [], links: [] } });
  await second;
  pending[0]({ code: 200, data: content() });
  await first;
  assert.deepEqual(state.buildCanvasSpaceParams().base, { ontologies: [], links: [] });
});
