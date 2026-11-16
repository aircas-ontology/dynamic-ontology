import assert from "node:assert/strict";
import test from "node:test";
import { hydrateRuleDetailVariableNames } from "../src/views/SpaceBehaviorScheduleWorkspace/utils/hydrateRuleDetailVariableNames.ts";

/** @description 创建包含单个变量的独立详情。 @returns {object} 详情和变量。 */
function example() {
  const variable = { kind: "variable", objectId: "plane", objectName: "plane", propertyId: "prop", propertyName: "prop", instanceIds: ["5"] };
  return {
    variable,
    groups: [
      {
        flow: {
          steps: [
            {
              kind: "branch",
              condition: { type: "composite", logic: "and", children: [{ type: "leaf", left: variable, right: { kind: "input", text: "1" } }] },
              then: [],
              otherwise: null,
            },
          ],
        },
        actionDetails: {},
      },
    ],
  };
}
const services = {
  getOntologyCategoryTreeInterface: async () => ({ code: 200, data: { ontologyMetaInfos: [{ uniqueIdentifier: "plane", displayName: "飞机" }] } }),
  getOntologyPropertyByOntologyIdInterface: async () => ({ code: 200, data: [{ uniqueIdentifier: "prop", displayName: "经度" }] }),
  getOntologyEntitiesInterface: async () => ({ code: 200, data: { total: 1, records: [{ primaryKey: 5, displayName: "飞机5" }] } }),
};
test("hydrates object, property and instance names from matching identifiers", async () => {
  const { groups, variable } = example();
  const result = await hydrateRuleDetailVariableNames(groups, "156", services, () => true);
  assert.equal(result, "");
  assert.equal(variable.objectName, "飞机");
  assert.equal(variable.propertyName, "经度");
  assert.deepEqual(variable.instanceNames, ["飞机5"]);
});
test("reports missing names and failed metadata, keeping identifiers visible", async () => {
  const { groups, variable } = example();
  const result = await hydrateRuleDetailVariableNames(
    groups,
    "156",
    {
      ...services,
      getOntologyPropertyByOntologyIdInterface: async () => {
        throw new Error("error");
      },
    },
    () => true,
  );
  assert.match(result, /名称/);
  assert.equal(variable.propertyName, "prop");
});
test("does not update names after the detail session is invalidated", async () => {
  const { groups, variable } = example();
  let active = true;
  const result = await hydrateRuleDetailVariableNames(
    groups,
    "156",
    {
      ...services,
      getOntologyCategoryTreeInterface: async () => {
        active = false;
        return services.getOntologyCategoryTreeInterface();
      },
    },
    () => active,
  );
  assert.equal(result, "");
  assert.equal(variable.objectName, "plane");
});

test("resolves nested objects and later instance pages, deduplicating requests", async () => {
  const { groups, variable } = example();
  const leaf = groups[0].flow.steps[0].condition.children[0];
  leaf.right = { ...variable, propertyId: "", propertyName: "longitude", instanceIds: ["6"] };
  const calls = [];
  const result = await hydrateRuleDetailVariableNames(
    groups,
    "156",
    {
      getOntologyCategoryTreeInterface: async () => ({
        code: 0,
        data: { children: [{ ontologyMetaInfos: [{ uniqueIdentifier: "plane", apiName: "Plane" }] }] },
      }),
      getOntologyPropertyByOntologyIdInterface: async () => {
        calls.push("property");
        return { code: 200, data: [{ uniqueIdentifier: "prop", apiName: "longitude", displayName: "经度" }] };
      },
      getOntologyEntitiesInterface: async ({ pageNum }) => {
        calls.push(pageNum);
        return {
          code: 200,
          data: { total: 101, records: pageNum === 1 ? [{ primaryKey: 5, displayName: "飞机5" }] : [{ primaryKey: 6, displayName: "飞机6" }] },
        };
      },
    },
    () => true,
  );
  assert.equal(result, "");
  assert.deepEqual(calls, ["property", 1, 2]);
  assert.equal(variable.objectName, "Plane");
  assert.equal(leaf.right.propertyName, "经度");
  assert.deepEqual(leaf.right.instanceNames, ["飞机6"]);
});

test("reports missing objects, properties and instances, or malformed pages", async () => {
  const variants = [
    { getOntologyCategoryTreeInterface: async () => ({ code: 500 }) },
    { getOntologyCategoryTreeInterface: async () => ({ code: 200, data: {} }) },
    { getOntologyPropertyByOntologyIdInterface: async () => ({ code: 200, data: [] }) },
    { getOntologyEntitiesInterface: async () => ({ code: 200, data: { total: 0, records: [] } }) },
    { getOntologyEntitiesInterface: async () => ({ code: 200, data: { total: 101, records: [] } }) },
    { getOntologyEntitiesInterface: async () => ({ code: 500 }) },
  ];
  for (const variant of variants) {
    const { groups } = example();
    assert.match(await hydrateRuleDetailVariableNames(groups, "156", { ...services, ...variant }, () => true), /名称/);
  }
});

test("ignores stale property and instance responses", async () => {
  for (const field of ["getOntologyPropertyByOntologyIdInterface", "getOntologyEntitiesInterface"]) {
    const { groups, variable } = example();
    let active = true;
    const result = await hydrateRuleDetailVariableNames(
      groups,
      "156",
      {
        ...services,
        [field]: async (...args) => {
          active = false;
          return services[field](...args);
        },
      },
      () => active,
    );
    assert.equal(result, "");
    if (field === "getOntologyPropertyByOntologyIdInterface") assert.equal(variable.propertyName, "prop");
    else assert.equal(variable.instanceNames, undefined);
  }
});

test("skips all requests when no condition contains variables", async () => {
  const result = await hydrateRuleDetailVariableNames([{ flow: { steps: [] }, actionDetails: {} }], "156", services, () => true);
  assert.equal(result, "");
});
