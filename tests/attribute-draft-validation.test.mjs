import test from "node:test";
import assert from "node:assert/strict";
import { validateAttributeDefaultValue } from "../src/views/OntologyObjectAttributePanel/utils/validateAttributeDefaultValue.ts";
test("validates default values for supported types without rejecting optional empty values", () => {
  for (const [type, value] of [
    ["Int", "42"],
    ["Boolean", "false"],
    ["Array", "[1]"],
    ["Date", "2026-10-26"],
    ["Timestamp", "123"],
    ["Double", "1.2"],
    ["Long", "9223372036854775807"],
    ["String", "hello"],
  ])
    assert.equal(validateAttributeDefaultValue(type, value), "");
  assert.equal(validateAttributeDefaultValue("Int", ""), "");
  for (const [type, value] of [
    ["Int", "1.1"],
    ["Int", "2147483648"],
    ["Byte", "128"],
    ["Boolean", "yes"],
    ["Array", "{}"],
    ["Array", "["],
    ["Date", "2026-02-30"],
    ["Double", "Infinity"],
    ["Long", "9223372036854775808"],
  ])
    assert.notEqual(validateAttributeDefaultValue(type, value), "");
});
