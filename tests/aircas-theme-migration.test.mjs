import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as sass from "sass";

test("compiled Aircas themes declare every referenced token without legacy styles", () => {
  const css = sass.compile("src/styles/index.scss", { logger: sass.Logger.silent }).css;
  const declared = new Set([...css.matchAll(/(--aircas-[\w-]+)\s*:/g)].map((match) => match[1]));
  for (const match of css.matchAll(/var\(\s*(--aircas-[\w-]+)/g)) assert.ok(declared.has(match[1]), match[1]);
  assert.match(css, /:root:not\(\.dark\)/);
  assert.match(css, /:root\.dark/);
  assert.doesNotMatch(css, /\[theme=/);
  const main = readFileSync("src/main.ts", "utf8");
  assert.doesNotMatch(main, /styles\/aircas\//);
  assert.match(main, /import "@\/styles\/index\.scss";/);
  assert.ok(main.indexOf("element-plus/dist/index.css") < main.indexOf("element-plus/theme-chalk/dark/css-vars.css"));
  assert.ok(main.indexOf("element-plus/theme-chalk/dark/css-vars.css") < main.indexOf("@/styles/index.scss"));
});
