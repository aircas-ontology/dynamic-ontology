import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { formatOntologyEntityRowDetailPageRecordLabel } from "../src/utils/behaviorParameters/mapOntologyEntityRowDetailToDataRows.ts";

test("formatOntologyEntityRowDetailPageRecordLabel shows only matched property value", () => {
  const row = {
    dataPrimaryKey: 12,
    props: [
      { propertyApiName: "lon", propertyDisplayName: "经度", propertyValue: 116.3 },
      { propertyApiName: "lat", propertyDisplayName: "纬度", propertyValue: 39.9 },
    ],
  };
  assert.equal(formatOntologyEntityRowDetailPageRecordLabel(row, { propertyDisplayName: "纬度" }), "行 12 · 39.9");
  assert.equal(formatOntologyEntityRowDetailPageRecordLabel(row, { propertyApiName: "lon" }), "行 12 · 116.3");
  assert.equal(formatOntologyEntityRowDetailPageRecordLabel(row), "行 12");
  assert.equal(formatOntologyEntityRowDetailPageRecordLabel(row, { propertyDisplayName: "不存在" }), "行 12");
  assert.equal(formatOntologyEntityRowDetailPageRecordLabel({ dataPrimaryKey: "a1", props: [] }), "行 a1");
  assert.equal(formatOntologyEntityRowDetailPageRecordLabel({ dataPrimaryKey: null, props: [] }), "");
});

test("behavior tree group row loader uses pageSize 10 and caches props", () => {
  const source = readFileSync(new URL("../src/composables/behaviorTree/useBehaviorTreeExecution.ts", import.meta.url), "utf8");
  assert.match(source, /pageSize:\s*10/);
  assert.doesNotMatch(source, /pageSize:\s*200/);
  assert.match(source, /props:\s*rowProps/);
  assert.match(source, /label:\s*`行 \$\{value\}`/);
});

test("BehaviorTreeExecPanel maps list param row labels by current param", () => {
  const source = readFileSync(new URL("../src/components/BehaviorTreeExecPanel.vue", import.meta.url), "utf8");
  assert.match(source, /formatOntologyEntityRowDetailPageRecordLabel/);
  assert.match(source, /mapInputParamRowOptionLabel/);
  assert.match(source, /propertyDisplayName:\s*param\.propertyDisplayName/);
});

test("behavior test storage group option label uses current param match", () => {
  const composable = readFileSync(new URL("../src/composables/behavior/useBehaviorParameters.ts", import.meta.url), "utf8");
  const panel = readFileSync(new URL("../src/components/BehaviorParameterConfig/BehaviorParameterConfig.vue", import.meta.url), "utf8");
  assert.match(composable, /formatOntologyEntityRowDetailPageRecordLabel/);
  assert.match(composable, /propertyApiName:\s*param\.paramName/);
  assert.match(panel, /formatApplicationStorageGroupOptionLabel\(option,\s*asApplicationInputRow\(row\)\)/);
});
