import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

import {
  buildOntologyFunctionQueryConfig,
  opNeedsList,
  opNeedsRange,
  opNeedsValue,
  parseBasicFilterConfig,
  stringifyBasicFilterConfig,
} from "../src/utils/functionOperatorBasicFilter.ts";
import { BASIC_FILTER_OP_OPTIONS } from "../src/types/pages/ontologyFunctionOperatorBasicFilterType.ts";

/**
 * @description 读取相对 tests 目录的源文件文本。
 * @param relativePath 相对路径。
 * @returns 文件内容。
 */
const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("BASIC_FILTER_OP_OPTIONS matches the standard operator table", () => {
  assert.deepEqual(
    BASIC_FILTER_OP_OPTIONS.map((item) => item.value),
    ["EQ", "NE", "LIKE", "LIKE_LEFT", "LIKE_RIGHT", "IN", "NOT_IN", "BETWEEN", "NOT_BETWEEN", "GT", "GE", "LT", "LE", "IS_NULL", "IS_NOT_NULL"],
  );
  assert.equal(BASIC_FILTER_OP_OPTIONS.find((item) => item.value === "NE")?.label, "不等于 NE");
  assert.equal(BASIC_FILTER_OP_OPTIONS.find((item) => item.value === "GE")?.label, "大于等于 GE");
  assert.equal(BASIC_FILTER_OP_OPTIONS.find((item) => item.value === "LIKE")?.label, "全模糊 LIKE");
  assert.equal(
    BASIC_FILTER_OP_OPTIONS.some((item) => item.value === "NEQ" || item.value === "CONTAINS" || item.value === "GTE"),
    false,
  );
});

test("opNeeds helpers classify range list and null operators", () => {
  assert.equal(opNeedsRange("BETWEEN"), true);
  assert.equal(opNeedsRange("NOT_BETWEEN"), true);
  assert.equal(opNeedsList("IN"), true);
  assert.equal(opNeedsList("NOT_IN"), true);
  assert.equal(opNeedsValue("EQ"), true);
  assert.equal(opNeedsValue("BETWEEN"), false);
  assert.equal(opNeedsValue("IN"), false);
  assert.equal(opNeedsValue("IS_NULL"), false);
});

test("parse and stringify keep IN values and NOT_BETWEEN range", () => {
  const doc = parseBasicFilterConfig(
    JSON.stringify({
      logic: "AND",
      children: [
        { type: "FILTER", filter: { op: "IN", propertyApiName: "tag", valueType: "string", values: ["a", "b"] } },
        { type: "FILTER", filter: { op: "NOT_BETWEEN", propertyApiName: "age", valueType: "number", values: [1, 9] } },
        { type: "FILTER", filter: { op: "NE", propertyApiName: "name", valueType: "string", value: "x" } },
      ],
    }),
  );
  assert.deepEqual(doc.children[0]?.filter?.values, ["a", "b"]);
  assert.deepEqual(doc.children[1]?.filter?.values, [1, 9]);
  assert.equal(doc.children[2]?.filter?.op, "NE");
  const text = stringifyBasicFilterConfig(doc);
  assert.match(text, /"op": "IN"/);
  assert.match(text, /"op": "NOT_BETWEEN"/);
  assert.match(text, /"op": "NE"/);
});

test("buildOntologyFunctionQueryConfig maps IN and NOT_BETWEEN to values", () => {
  const doc = parseBasicFilterConfig(
    JSON.stringify({
      logic: "AND",
      children: [
        { type: "FILTER", filter: { op: "IN", propertyApiName: "id", valueType: "string", values: ["1", "2"] } },
        { type: "FILTER", filter: { op: "NOT_BETWEEN", propertyApiName: "score", valueType: "number", values: [0, 100] } },
      ],
    }),
  );
  const queryConfig = buildOntologyFunctionQueryConfig(doc, "");
  assert.deepEqual(queryConfig.filters.children[0]?.filter?.values, ["1", "2"]);
  assert.equal("value" in (queryConfig.filters.children[0]?.filter ?? {}), false);
  assert.deepEqual(queryConfig.filters.children[1]?.filter?.values, [0, 100]);
});

test("basic filter editor wires list and range helpers", () => {
  const source = readSource("../src/views/OntologySpaceManagementDetail/functionOperatorComponents/BasicFilterGroupEditor.vue");
  assert.match(source, /opNeedsList/);
  assert.match(source, /opNeedsRange/);
  assert.match(source, /updateFilterList/);
  assert.match(source, /逗号分隔/);
});
