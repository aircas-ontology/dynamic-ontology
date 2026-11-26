import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import {
  buildBasicFunctionExternalFilterTestParams,
  collectBasicFunctionExternalFilterParams,
  resolveBasicFunctionExternalFilterValueKind,
} from "../src/utils/behaviorParameters/collectBasicFunctionExternalFilterParams.ts";

/**
 * @description 读取仓库内相对本测试文件的源码文本。
 * @param {string} relativePath 相对路径。
 * @returns {string} 文件内容。
 */
function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("basic function external filter params", () => {
  test("collectBasicFunctionExternalFilterParams walks nested EXTERNAL filters and dedupes by propertyApiName", () => {
    const collected = collectBasicFunctionExternalFilterParams({
      logic: "AND",
      children: [
        { type: "FILTER", filter: { propertyApiName: "name", op: "EQ", source: "EXTERNAL" } },
        { type: "FILTER", filter: { propertyApiName: "id", op: "EQ", source: "EXTERNAL" } },
        { type: "FILTER", filter: { propertyApiName: "speed", op: "GT", source: "FIXED", value: 10 } },
        {
          type: "GROUP",
          group: {
            logic: "OR",
            children: [
              { type: "FILTER", filter: { propertyApiName: "name", op: "LIKE", source: "EXTERNAL" } },
              { type: "FILTER", filter: { propertyApiName: "recordTime", op: "BETWEEN", source: "EXTERNAL" } },
            ],
          },
        },
      ],
    });
    assert.deepEqual(
      collected.map((item) => ({ propertyApiName: item.propertyApiName, op: item.op, valueKind: item.valueKind })),
      [
        { propertyApiName: "name", op: "EQ", valueKind: "single" },
        { propertyApiName: "id", op: "EQ", valueKind: "single" },
        { propertyApiName: "recordTime", op: "BETWEEN", valueKind: "range" },
      ],
    );
    assert.equal(collectBasicFunctionExternalFilterParams(null).length, 0);
    assert.equal(collectBasicFunctionExternalFilterParams(undefined).length, 0);
  });

  test("resolveBasicFunctionExternalFilterValueKind covers single range list and none", () => {
    assert.equal(resolveBasicFunctionExternalFilterValueKind("EQ"), "single");
    assert.equal(resolveBasicFunctionExternalFilterValueKind("BETWEEN"), "range");
    assert.equal(resolveBasicFunctionExternalFilterValueKind("IN"), "list");
    assert.equal(resolveBasicFunctionExternalFilterValueKind("IS_NULL"), "none");
  });

  test("buildBasicFunctionExternalFilterTestParams validates and maps drafts to params", () => {
    const rows = [
      { propertyApiName: "name", op: "EQ", valueKind: "single" },
      { propertyApiName: "recordTime", op: "BETWEEN", valueKind: "range" },
      { propertyApiName: "tags", op: "IN", valueKind: "list" },
      { propertyApiName: "gone", op: "IS_NULL", valueKind: "none" },
    ];
    assert.equal("error" in buildBasicFunctionExternalFilterTestParams(rows, {}), true);
    const built = buildBasicFunctionExternalFilterTestParams(rows, {
      name: { single: "飞机A" },
      recordTime: { left: "2026-11-25 00:00:00", right: "2026-11-25 23:59:59" },
      tags: { list: "a, b, c" },
    });
    assert.equal("error" in built, false);
    if (!("error" in built)) {
      assert.deepEqual(built.params, {
        name: "飞机A",
        recordTime: ["2026-11-25 00:00:00", "2026-11-25 23:59:59"],
        tags: ["a", "b", "c"],
      });
    }
  });

  test("behavior test dialog loads EXTERNAL filters and sends params on basic function test", () => {
    const dialogSource = readSource("../src/components/BehaviorTestDialog/BehaviorTestDialog.vue");
    const typeSource = readSource("../src/types/apis/testOntologyActionType.ts");
    assert.match(dialogSource, /collectBasicFunctionExternalFilterParams/);
    assert.match(dialogSource, /buildBasicFunctionExternalFilterTestParams/);
    assert.match(dialogSource, /basicFunctionExternalFilterParams/);
    assert.match(dialogSource, /外部输入条件/);
    assert.match(dialogSource, /request\.params/);
    assert.match(typeSource, /params\?: Record<string, unknown>/);
    assert.match(typeSource, /propertyApiName/);
  });
});
