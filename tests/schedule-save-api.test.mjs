import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as Vue from "vue";
import { compileScript, parse } from "@vue/compiler-sfc";
import { ModuleKind, transpileModule } from "typescript";
import * as scheduleTypes from "../src/types/pages/ontologySpaceBehaviorScheduleType.ts";
import { fetchBehaviorSchedules } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/fetchBehaviorSchedules.ts";

/** @description 编译实际 API 模块并记录请求配置。 @param {string} serviceUrl 在线服务配置。 @returns {object} API 和请求记录。 */
function createApiHarness(serviceUrl) {
  const source = readFileSync(new URL("../src/apis/ontologyActionApi.ts", import.meta.url), "utf8");
  const { outputText } = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } });
  const calls = [];
  const exports = {};
  new Function("require", "exports", "DOMAIN_CONFIG", outputText)(
    () => ({
      request: async (config) => {
        calls.push(config);
        return { code: 200 };
      },
    }),
    exports,
    { ONTOLOGYMANAGE_URL: serviceUrl },
  );
  return { calls, api: exports };
}

/** @description 编译真实调度页面并注入可控制的保存接口。 @param {Function} handler 保存处理。 @param {Function} listHandler 列表处理。 @returns {object} 页面及观察记录。 */
function createPageHarness(handler, listHandler, detailHandler) {
  const { descriptor } = parse(readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/index.vue", import.meta.url), "utf8"));
  const compiled = compileScript(descriptor, { id: "schedule-save" });
  const { outputText } = transpileModule(compiled.content, { compilerOptions: { module: ModuleKind.CommonJS } });
  const messages = [];
  const cleanup = [];
  const route = Vue.reactive({ params: { spaceId: "1" } });
  const exports = {};
  const listCalls = [];
  const queryList = async (params) => {
    listCalls.push(params);
    if (listHandler) return listHandler(params);
    const records = listCalls.length === 1 ? [] : [listRecord];
    return { code: 200, data: { records, total: records.length, size: 1000, current: 1 } };
  };
  new Function("require", "exports", outputText)((id) => {
    if (id === "vue") return { ...Vue, onBeforeUnmount: (callback) => cleanup.push(callback) };
    if (id === "vue-router") return { useRoute: () => route };
    if (id === "@/types") return scheduleTypes;
    if (id === "@/apis")
      return {
        postCreateBehaviorScheduleInterface: handler,
        getListBehaviorSchedulingInterface: queryList,
        getBehaviorSchedulingDetailInterface:
          detailHandler ||
          (async (params) => ({
            code: 200,
            data: { ...listRecord, id: params.id, ruleVO: { taskCronExpression: "0 0 8 * * ? *", entityJson: '{"actionApi":"app"}' } },
          })),
      };
    if (id.includes("fetchBehaviorSchedules")) return { fetchBehaviorSchedules };
    if (id.includes("fetchScheduleBehaviorOptions")) return { fetchScheduleBehaviorOptions: async () => [] };
    if (id.includes("cloneBehaviorParameterSnapshot")) return { cloneBehaviorParameterSnapshot: structuredClone };
    if (id.includes("scheduleRuleFlowFactory")) return { cloneScheduleRuleFlow: structuredClone };
    if (id === "element-plus")
      return { ElMessage: { success: (message) => messages.push(["success", message]), error: (message) => messages.push(["error", message]) } };
    return {};
  }, exports);
  const scope = Vue.effectScope();
  const page = scope.run(() => exports.default.setup({}, { expose() {} }));
  page.formVisible.value = true;
  return { page, messages, cleanup, route, scope, listCalls };
}

const listRecord = {
  id: 99,
  ontologyName: "ship",
  ontologyIdentifier: "ship",
  actionApi: "app",
  actionName: "action",
  schedulingName: "new",
  description: "",
  type: "TASK",
  status: "START",
};

/** @description 等待页面监听与异步列表查询。 @returns {Promise<void>} 等待完成。 */
async function settleSchedulePage() {
  await Vue.nextTick();
  await new Promise((resolve) => setImmediate(resolve));
}

const draft = { name: "new", strategy: "周期调度", weekdays: [], description: "", ruleFlow: null };
const request = {
  ontologyIdentifier: "ship",
  actionApi: "app",
  name: "new",
  description: "",
  type: "TASK",
  task: { taskCronExpression: "0 0 8 * * ? *", entityJson: '{"actionApi":"app"}' },
};

test("schedule API posts the exact envelope using the configured online service", async () => {
  for (const serviceUrl of ["http://172.16.18.58:37002", "https://ontology.example.test"]) {
    const { api, calls } = createApiHarness(serviceUrl);
    await api.postCreateBehaviorScheduleInterface(request);
    assert.deepEqual(calls, [{ url: `${serviceUrl}/ontology/action/scheduling`, method: "post", data: request }]);
  }
});

test("schedule waits for success and prevents duplicate submissions", async () => {
  let resolveRequest;
  const calls = [];
  const harness = createPageHarness((payload) => {
    calls.push(payload);
    return new Promise((resolve) => {
      resolveRequest = resolve;
    });
  });
  const { page, scope } = harness;
  await settleSchedulePage();
  const count = page.schedules.value.length;
  const pending = page.submitScheduleForm(draft, request);
  await page.submitScheduleForm(draft, request);
  assert.equal(page.createStatus.value, "submitting");
  assert.equal(page.formVisible.value, true);
  assert.equal(calls.length, 1);
  page.openCreateScheduleDialog();
  page.openEditScheduleDialog(page.schedules.value[0]);
  page.openViewScheduleDialog(page.schedules.value[0]);
  assert.equal(page.createStatus.value, "submitting");
  assert.equal(page.formMode.value, "create");
  resolveRequest({ code: 200, success: true, message: "已保存" });
  await pending;
  assert.equal(page.schedules.value.length, count + 1);
  assert.equal(page.formVisible.value, false);
  assert.deepEqual(harness.messages, [["success", "已保存"]]);
  assert.equal(harness.listCalls.length, 2);
  scope.stop();
});

test("schedule preserves draft on business or transport failure and permits retry", async () => {
  for (const failure of [{ code: 500, message: "保存被拒绝" }, new Error("连接失败"), { code: 200, success: false, message: "业务失败" }]) {
    let retry = false;
    const { page, messages, scope } = createPageHarness(async () => {
      if (retry) return { code: 200 };
      if (failure instanceof Error) throw failure;
      return failure;
    });
    const count = page.schedules.value.length;
    await page.submitScheduleForm(draft, request);
    assert.equal(page.createStatus.value, "error");
    assert.equal(page.schedules.value.length, count);
    assert.equal(page.formVisible.value, true);
    assert.deepEqual(messages, [["error", failure.message]]);
    retry = true;
    await page.submitScheduleForm(draft, request);
    assert.equal(page.formVisible.value, false);
    scope.stop();
  }
});

test("schedule ignores responses after unmount or space switch", async () => {
  for (const changeSpace of [false, true]) {
    let resolveRequest;
    const { page, messages, cleanup, route, scope } = createPageHarness(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
      async () => ({ code: 200, data: { records: [], total: 0, size: 1000, current: 1 } }),
    );
    const count = page.schedules.value.length;
    const pending = page.submitScheduleForm(draft, request);
    if (changeSpace) {
      route.params.spaceId = "2";
      await Vue.nextTick();
    } else cleanup.forEach((callback) => callback());
    resolveRequest({ code: 200 });
    await pending;
    assert.equal(page.schedules.value.length, count);
    assert.equal(messages.length, 0);
    scope.stop();
  }
});

test("schedule requires a periodic payload while retaining local rule and edit flows", async () => {
  let calls = 0;
  const { page, scope } = createPageHarness(async () => {
    calls += 1;
    return { code: 200 };
  });
  await settleSchedulePage();
  await page.submitScheduleForm(draft);
  assert.equal(page.createStatus.value, "error");
  assert.equal(calls, 0);
  const count = page.schedules.value.length;
  await page.submitScheduleForm({ ...draft, strategy: "规则调度" });
  assert.equal(page.schedules.value.length, count + 1);
  page.openEditScheduleDialog(page.schedules.value[0]);
  await page.submitScheduleForm({ ...page.formDraft.value, name: "edited" });
  assert.equal(page.schedules.value[0].name, "edited");
  assert.equal(calls, 0);
  scope.stop();
});

test("schedule list API sends only paging parameters through the shared service", async () => {
  const { api, calls } = createApiHarness("https://ontology.example.test");
  await api.getListBehaviorSchedulingInterface({ pageNum: 2, pageSize: 1000 });
  assert.deepEqual(calls, [{ url: "https://ontology.example.test/ontology/action/scheduling/list", method: "get", params: { pageNum: 2, pageSize: 1000 } }]);
});

test("schedule page loads server-filtered rows and fetches actual details", async () => {
  const { page, messages, scope } = createPageHarness(
    async () => ({ code: 200 }),
    async (params) => {
      const records = params.type === "TASK" ? [listRecord] : [listRecord, { ...listRecord, id: 100, type: "RULE", schedulingName: "rule" }];
      return { code: 200, data: { records, total: records.length, size: params.pageSize, current: params.pageNum } };
    },
  );
  assert.equal(page.schedules.value.length, 0);
  assert.equal(page.scheduleListLoading.value, true);
  await settleSchedulePage();
  assert.equal(page.scheduleListLoading.value, false);
  assert.equal(page.schedules.value.length, 2);
  page.keyword.value = "new";
  page.strategy.value = "周期调度";
  page.applyFilters();
  await settleSchedulePage();
  assert.deepEqual(
    page.filteredSchedules.value.map((item) => item.id),
    ["99"],
  );
  page.resetFilters();
  await settleSchedulePage();
  assert.equal(page.filteredSchedules.value.length, 2);
  page.formVisible.value = false;
  await page.openViewScheduleDialog(page.schedules.value[0]);
  assert.equal(page.formVisible.value, true);
  assert.equal(page.formDraft.value.cronExpression, "0 0 8 * * ? *");
  await page.openEditScheduleDialog(page.schedules.value[0]);
  assert.equal(page.formMode.value, "edit");
  page.openInvocationLogDialog(page.schedules.value[0]);
  assert.deepEqual(page.invocationLogs.value, []);
  scope.stop();
});

test("schedule list exposes errors, supports retry and prevents duplicate queries", async () => {
  let resolveList;
  let calls = 0;
  const { page, scope } = createPageHarness(
    async () => ({ code: 200 }),
    () => {
      calls += 1;
      return new Promise((resolve) => {
        resolveList = resolve;
      });
    },
  );
  await page.fetchScheduleList();
  assert.equal(calls, 1);
  resolveList({ code: 500, message: "列表加载失败" });
  await settleSchedulePage();
  assert.equal(page.scheduleListLoading.value, false);
  assert.equal(page.scheduleListError.value, "列表加载失败");
  const retry = page.fetchScheduleList();
  assert.equal(calls, 2);
  resolveList({ code: 200, data: { records: [], total: 0, size: 1000, current: 1 } });
  await retry;
  assert.equal(page.scheduleListError.value, "");
  assert.equal(page.schedules.value.length, 0);
  scope.stop();
});

test("schedule list cannot overwrite a newer session or mutate after unmount", async () => {
  const pending = [];
  const { page, route, cleanup, scope } = createPageHarness(
    async () => ({ code: 200 }),
    () => new Promise((resolve) => pending.push(resolve)),
  );
  route.params.spaceId = "2";
  await Vue.nextTick();
  assert.equal(pending.length, 2);
  pending[1]({ code: 200, data: { records: [listRecord], total: 1, size: 1000, current: 1 } });
  await settleSchedulePage();
  pending[0]({ code: 500, message: "old failure" });
  await settleSchedulePage();
  assert.equal(page.schedules.value[0].id, "99");
  assert.equal(page.scheduleListError.value, "");
  const refresh = page.fetchScheduleList();
  cleanup.forEach((callback) => callback());
  pending[2]({ code: 200, data: { records: [], total: 0, size: 1000, current: 1 } });
  await refresh;
  assert.equal(page.schedules.value.length, 1);
  scope.stop();
});

test("saved schedule remains successful when list refresh fails and can be retried", async () => {
  let fail = false;
  const { page, messages, scope } = createPageHarness(
    async () => ({ code: 200, message: "保存成功" }),
    async () => {
      if (fail) throw new Error("刷新失败");
      return { code: 200, data: { records: [], total: 0, size: 1000, current: 1 } };
    },
  );
  await settleSchedulePage();
  fail = true;
  await page.submitScheduleForm(draft, request);
  assert.equal(page.formVisible.value, false);
  assert.equal(page.createStatus.value, "idle");
  assert.equal(page.scheduleListError.value, "刷新失败");
  assert.deepEqual(messages, [["success", "保存成功"]]);
  fail = false;
  await page.fetchScheduleList();
  assert.equal(page.scheduleListError.value, "");
  scope.stop();
});

test("detail API uses id and type query parameters", async () => {
  const { api, calls } = createApiHarness("https://ontology.example.test");
  await api.getBehaviorSchedulingDetailInterface({ id: 99, type: "TASK" });
  assert.deepEqual(calls, [{ url: "https://ontology.example.test/ontology/action/scheduling/detail", method: "get", params: { id: 99, type: "TASK" } }]);
});

test("detail loading prevents duplicate clicks and supports retry after failure", async () => {
  let resolveDetail;
  const calls = [];
  const h = createPageHarness(
    async () => ({ code: 200 }),
    async () => ({ code: 200, data: { records: [listRecord], total: 1, size: 1000, current: 1 } }),
    (params) => {
      calls.push(params);
      return new Promise((resolve) => {
        resolveDetail = resolve;
      });
    },
  );
  await settleSchedulePage();
  h.page.formVisible.value = false;
  const first = h.page.openViewScheduleDialog(h.page.schedules.value[0]);
  await h.page.openEditScheduleDialog(h.page.schedules.value[0]);
  assert.equal(calls.length, 1);
  resolveDetail({ code: 500, message: "详情失败" });
  await first;
  assert.equal(h.page.formVisible.value, false);
  assert.deepEqual(h.messages, [["error", "详情失败"]]);
  const retry = h.page.openEditScheduleDialog(h.page.schedules.value[0]);
  resolveDetail({ code: 200, data: { ...listRecord, ruleVO: { taskCronExpression: "0 0 8 * * ? *", entityJson: '{"params":{"amount":0}}' } } });
  await retry;
  assert.equal(h.page.formDraft.value.savedEntityJson, '{"params":{"amount":0}}');
  assert.equal(h.page.formMode.value, "edit");
  h.scope.stop();
});

test("detail response cannot open a dialog after space switch or unmount", async () => {
  for (const changeSpace of [false, true]) {
    let resolveDetail;
    const h = createPageHarness(
      async () => ({ code: 200 }),
      async () => ({ code: 200, data: { records: [listRecord], total: 1, size: 1000, current: 1 } }),
      () =>
        new Promise((resolve) => {
          resolveDetail = resolve;
        }),
    );
    await settleSchedulePage();
    h.page.formVisible.value = false;
    const pending = h.page.openViewScheduleDialog(h.page.schedules.value[0]);
    if (changeSpace) {
      h.route.params.spaceId = "2";
      await Vue.nextTick();
    } else h.cleanup.forEach((callback) => callback());
    resolveDetail({ code: 200, data: listRecord });
    await pending;
    assert.equal(h.page.formVisible.value, false);
    h.scope.stop();
  }
});

test("TASK detail reads actual taskVO parameters before legacy ruleVO in view and edit", async () => {
  const entityJson = JSON.stringify({
    ontologySpaceId: "156",
    actionApi: "act.ap.window",
    inputParams: { max_mach: [{ entityPrimaryKey: 5 }, { entityPrimaryKey: 4 }] },
    entityPrimaryKeys: { from: [1, 6, 2, 5], to: [1, 2, 3, 4] },
  });
  for (const mode of ["view", "edit"]) {
    const h = createPageHarness(
      async () => ({ code: 200 }),
      async () => ({ code: 200, data: { records: [listRecord], total: 1, size: 1000, current: 1 } }),
      async () => ({
        code: 200,
        data: { ...listRecord, taskVO: { taskCronExpression: "0 0 8 * * ? *", entityJson }, ruleVO: { entityJson: "{}", taskCronExpression: "old" } },
      }),
    );
    await settleSchedulePage();
    if (mode === "view") await h.page.openViewScheduleDialog(h.page.schedules.value[0]);
    else await h.page.openEditScheduleDialog(h.page.schedules.value[0]);
    assert.equal(h.page.formDraft.value.savedEntityJson, entityJson);
    assert.equal(h.page.formDraft.value.cronExpression, "0 0 8 * * ? *");
    assert.equal(h.page.formMode.value, mode);
    h.scope.stop();
  }
});

test("schedule filters and pagination send applied conditions and reset page", async () => {
  const h = createPageHarness(
    async () => ({ code: 200 }),
    async (params) => ({ code: 200, data: { records: [listRecord], total: 55, size: params.pageSize, current: params.pageNum } }),
  );
  await settleSchedulePage();
  assert.deepEqual(h.listCalls[0], { pageNum: 1, pageSize: 10 });
  h.page.keyword.value = "  test  ";
  h.page.strategy.value = "周期调度";
  h.page.applyFilters();
  await settleSchedulePage();
  assert.deepEqual(h.listCalls.at(-1), { pageNum: 1, pageSize: 10, name: "test", type: "TASK" });
  assert.equal(h.page.filteredSchedules.value.length, 1);
  h.page.keyword.value = "unapplied";
  h.page.changeSchedulePage(3);
  await settleSchedulePage();
  assert.deepEqual(h.listCalls.at(-1), { pageNum: 3, pageSize: 10, name: "test", type: "TASK" });
  h.page.changeSchedulePageSize(20);
  await settleSchedulePage();
  assert.deepEqual(h.listCalls.at(-1), { pageNum: 1, pageSize: 20, name: "test", type: "TASK" });
  assert.equal(h.page.scheduleTotal.value, 55);
  h.page.strategy.value = "规则调度";
  h.page.applyFilters();
  await settleSchedulePage();
  assert.equal(h.listCalls.at(-1).type, "RULE");
  h.page.resetFilters();
  await settleSchedulePage();
  assert.deepEqual(h.listCalls.at(-1), { pageNum: 1, pageSize: 20 });
  h.scope.stop();
});

test("rapid filter requests ignore old results and preserve latest total", async () => {
  const pending = [];
  const h = createPageHarness(
    async () => ({ code: 200 }),
    (params) => new Promise((resolve) => pending.push({ params, resolve })),
  );
  h.page.keyword.value = "latest";
  h.page.applyFilters();
  assert.equal(pending.length, 2);
  pending[1].resolve({ code: 200, data: { records: [listRecord], total: 21, size: 10, current: 1 } });
  await settleSchedulePage();
  pending[0].resolve({ code: 200, data: { records: [], total: 0, size: 10, current: 1 } });
  await settleSchedulePage();
  assert.equal(h.page.scheduleTotal.value, 21);
  assert.equal(h.page.schedules.value.length, 1);
  const count = pending.length;
  h.page.changeSchedulePage(1);
  h.page.changeSchedulePage(-1);
  h.page.changeSchedulePageSize(10);
  h.page.changeSchedulePageSize(5);
  assert.equal(pending.length, count);
  h.scope.stop();
});
