import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";
import * as Vue from "vue";
import { compileScript, parse } from "@vue/compiler-sfc";
import { ModuleKind, transpileModule } from "typescript";
import { createSwitchStep, createDefaultSwitchCase } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleFlowFactory.ts";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) specifier = new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href;
    if (specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier)) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(candidate)) specifier = candidate.href;
    }
    return nextResolve(specifier, context);
  },
});
const { buildRuleFlowRegion } = await import("../src/views/SpaceBehaviorScheduleWorkspace/utils/scheduleRuleFlowGraphSerialize.ts");

test("switch case editor adds and deletes cases with at least one, and toggles empty default without phantom nodes", () => {
  const { descriptor } = parse(
    readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/ruleConfig/ScheduleRuleSwitchConfig.vue", import.meta.url), "utf8"),
  );
  const compiled = compileScript(descriptor, { id: "switch-editor" });
  const { outputText } = transpileModule(compiled.content, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  new Function("require", "exports", outputText)(
    (id) => (id === "vue" ? Vue : id.includes("scheduleRuleFlowFactory") ? { createDefaultSwitchCase } : {}),
    exports,
  );
  const step = createSwitchStep();
  const page = exports.default.setup({ step }, { expose() {} });
  const originalId = step.cases[1].id;
  page.addSwitchCase();
  assert.equal(step.cases.length, 3);
  assert.deepEqual(step.cases[2].steps, []);
  page.removeSwitchCase(0);
  assert.equal(step.cases[0].id, originalId);
  page.removeSwitchCase(0);
  page.removeSwitchCase(0);
  assert.equal(step.cases.length, 1);
  page.changeSwitchDefault(false);
  assert.equal(step.defaultSteps, null);
  page.changeSwitchDefault(true);
  assert.deepEqual(step.defaultSteps, []);
});

test("switch port updates preserve surviving edge identities, remove only deleted routes and update labels", async () => {
  const source = readFileSync(new URL("../src/views/SpaceBehaviorScheduleWorkspace/utils/updateScheduleRuleSwitchNode.ts", import.meta.url), "utf8");
  const { outputText } = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } });
  const exports = {};
  const template = {
    isNode: () => true,
    getMarkup: () => ["new-markup"],
    getAttrs: () => ({ summary: "new" }),
    getSize: () => ({ width: 220, height: 200 }),
    getPorts: () => [{ id: "in" }, { id: "case_0" }, { id: "case_1" }],
  };
  const cells = {
    PORT_SWITCH_CASE_PREFIX: "case_",
    PORT_SWITCH_DEFAULT: "default",
    addSwitchNode: (ctx) => ctx.renderBuffer.push(template),
    createEdgeLabelConfig: (text) => [text],
    switchCasePortDisplay: (step, port) => step.cases[Number(port.slice(5))]?.label || port,
  };
  new Function("require", "exports", outputText)((id) => (id.includes("scheduleRuleFlowGraphCells") ? cells : {}), exports);
  const previous = createSwitchStep();
  previous.cases.push(createDefaultSwitchCase("case 3"));
  const updated = structuredClone(previous);
  updated.cases.splice(1, 1);
  updated.defaultSteps = null;
  const routes = ["case_0", "case_1", "case_2", "default"].map((port) => ({
    port,
    removed: false,
    getSourcePortId() {
      return this.port;
    },
    setSource(value) {
      this.port = value.port;
    },
    setLabels(value) {
      this.labels = value;
    },
  }));
  const node = {
    id: "switch",
    position: () => ({ x: 10, y: 20 }),
    setData(value, options) {
      this.data = value;
      this.dataOptions = options;
    },
    setMarkup(value) {
      this.markup = value;
    },
    setAttrs(value) {
      this.attrs = value;
    },
    setSize(value) {
      this.size = value;
    },
    setPropByPath(name, value) {
      this[name] = value;
    },
  };
  const graph = {
    getOutgoingEdges: () => routes,
    removeEdge: (edge) => {
      edge.removed = true;
    },
  };
  exports.updateScheduleRuleSwitchNode(graph, node, previous, updated);
  assert.equal(routes[0].port, "case_0");
  assert.equal(routes[0].removed, false);
  assert.equal(routes[1].removed, true);
  assert.equal(routes[2].removed, false);
  assert.equal(routes[2].port, "case_1");
  assert.deepEqual(routes[2].labels, [updated.cases[1].label]);
  assert.equal(routes[3].removed, true);
  assert.equal(node.data.switchStep, updated);
  assert.deepEqual(node.dataOptions, { overwrite: true });
  assert.deepEqual(node["ports/items"], template.getPorts());
});

test("unconnected enabled default persists through real graph serialization", () => {
  const step = createSwitchStep(undefined, undefined, []);
  const node = { isNode: () => true, getData: () => ({ kind: "switch", switchStep: step }) };
  const graph = { getCellById: () => node, getOutgoingEdges: () => [] };
  const [saved] = buildRuleFlowRegion(graph, step.id, "end");
  assert.deepEqual(saved.defaultSteps, []);
  assert.equal(saved.cases.length, 2);
  step.defaultSteps = null;
  assert.equal(buildRuleFlowRegion(graph, step.id, "end")[0].defaultSteps, null);
});
