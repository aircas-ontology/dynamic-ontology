import test from "node:test";
import assert from "node:assert/strict";
import { effectScope, nextTick, ref } from "vue";
import * as Vue from "vue";
import { compile } from "@vue/compiler-dom";
import { parse } from "@vue/compiler-sfc";
import { readFileSync } from "node:fs";
import { renderToString } from "vue/server-renderer";
import { countSpaceEntities, useBrowseStatistics } from "../src/views/EntityBrowsing/utils/browseStatistics.ts";

/**
 * @description 创建可手动完成的异步结果，用于检查并发与过期响应。
 * @returns 可控 Promise 及完成函数。
 */
function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

test("entity totals include nested categories, ignore duplicate objects and default missing counts to zero", () => {
  const tree = {
    categoryId: 1,
    ontologyMetaInfos: [{ uniqueIdentifier: "a", entityCount: 3 }, { uniqueIdentifier: "b" }],
    children: [
      {
        categoryId: 2,
        ontologyMetaInfos: [
          { uniqueIdentifier: "a", entityCount: 3 },
          { uniqueIdentifier: "c", entityCount: 7 },
        ],
      },
    ],
  };
  assert.equal(countSpaceEntities(tree), 10);
  assert.equal(countSpaceEntities(null), 0);
});

test("statistics load real values and default successful missing fields to zero", async () => {
  const scope = effectScope();
  const spaceId = ref("12");
  const statistics = scope.run(() =>
    useBrowseStatistics(
      spaceId,
      async () => ({ ontologyCount: 4, linkCount: 2 }),
      async () => null,
    ),
  );
  await nextTick();
  await nextTick();
  assert.equal(statistics.status.value, "success");
  assert.deepEqual(statistics.data.value, { ontology: 4, relation: 2, entity: 0, functionOperator: 0 });
  scope.stop();
});

test("failed requests expose an error and support retry", async () => {
  const scope = effectScope();
  let fail = true;
  const statistics = scope.run(() =>
    useBrowseStatistics(
      ref("1"),
      async () => {
        if (fail) throw new Error("统计失败");
        return {};
      },
      async () => null,
    ),
  );
  await nextTick();
  await nextTick();
  assert.equal(statistics.status.value, "error");
  assert.match(statistics.error.value, /统计失败/);
  fail = false;
  await statistics.loadBrowseStatistics();
  assert.equal(statistics.status.value, "success");
  scope.stop();
});

test("missing space id fails visibly without issuing requests", async () => {
  const scope = effectScope();
  let calls = 0;
  const statistics = scope.run(() =>
    useBrowseStatistics(
      ref(""),
      async () => {
        calls++;
        return {};
      },
      async () => null,
    ),
  );
  await nextTick();
  assert.equal(statistics.status.value, "error");
  assert.equal(calls, 0);
  scope.stop();
});

test("quality values stay visible while real counts are loading or fail", async () => {
  const source = readFileSync(new URL("../src/views/EntityBrowsing/components/EntityBrowseOverview.vue", import.meta.url), "utf8");
  const template = parse(source).descriptor.template.content;
  const render = new Function("Vue", compile(template, { mode: "function", prefixIdentifiers: true }).code)(Vue);
  const state = {
    statistics: [{ id: "ontology", label: "对象数量", value: 4 }],
    quality: [
      { id: "resilience", label: "韧性标准应用数", displayValue: "102" },
      { id: "attributeFill", label: "属性填充率", displayValue: "63%" },
    ],
    showStandardContent: true,
  };
  for (const flags of [
    { loading: true, failed: false },
    { loading: false, failed: true },
  ]) {
    const html = await renderToString(Vue.createSSRApp({ render: () => render({ ...state, ...flags }, []) }));
    assert.match(html, /102/);
    assert.match(html, /63%/);
    assert.doesNotMatch(html, />4</);
  }
  const html = await renderToString(Vue.createSSRApp({ render: () => render({ ...state, loading: false, failed: false }, []) }));
  assert.match(html, />4</);
  const hidden = await renderToString(Vue.createSSRApp({ render: () => render({ ...state, loading: false, failed: false, showStandardContent: false }, []) }));
  assert.doesNotMatch(hidden, /韧性标准应用数|属性填充率|102|63%/);
  assert.match(hidden, /对象数量/);
  assert.match(hidden, /entity-browse-overview--statistics-only/);
});

test("duplicate loads are suppressed, stale results and results after disposal are ignored", async () => {
  const scope = effectScope();
  const spaceId = ref("1");
  const pending = new Map();
  const calls = [];
  const loader = (id) => {
    calls.push(id);
    const deferred = createDeferred();
    pending.set(id, deferred);
    return deferred.promise;
  };
  const statistics = scope.run(() => useBrowseStatistics(spaceId, loader, async () => null));
  void statistics.loadBrowseStatistics();
  assert.deepEqual(calls, ["1"]);
  spaceId.value = "2";
  await nextTick();
  pending.get("2").resolve({ ontologyCount: 8 });
  await nextTick();
  await nextTick();
  pending.get("1").resolve({ ontologyCount: 99 });
  await nextTick();
  await nextTick();
  assert.equal(statistics.data.value.ontology, 8);
  spaceId.value = "3";
  await nextTick();
  scope.stop();
  pending.get("3").resolve({ ontologyCount: 70 });
  await nextTick();
  await nextTick();
  assert.notEqual(statistics.data.value.ontology, 70);
});

test("a result resolved immediately after a space change cannot update the new space", async () => {
  const scope = effectScope();
  const spaceId = ref("1");
  const pending = createDeferred();
  const statistics = scope.run(() =>
    useBrowseStatistics(
      spaceId,
      (id) => (id === "1" ? pending.promise : new Promise(() => {})),
      async () => null,
    ),
  );
  pending.resolve({ ontologyCount: 99 });
  spaceId.value = "2";
  await nextTick();
  await nextTick();
  assert.notEqual(statistics.data.value.ontology, 99);
  scope.stop();
});
