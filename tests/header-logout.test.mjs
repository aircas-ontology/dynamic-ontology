import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const headerSource = readFileSync(new URL("../src/layout/components/HeaderBar.vue", import.meta.url), "utf8");

test("header visitor menu logs out by clearing the session token and returning to login", () => {
  assert.match(headerSource, /<el-dropdown\b/);

  assert.doesNotMatch(headerSource, /popper-class="aircas-[^" ]+"/);
  assert.match(headerSource, /访客/);
  assert.match(headerSource, /退出登录/);
  assert.match(headerSource, /clearLoginToken\(\)/);
  assert.match(headerSource, /LOGIN_ROUTE_NAME/);
  assert.match(headerSource, /router\.replace\(\{\s*name:\s*LOGIN_ROUTE_NAME\s*\}\)/);
  assert.match(headerSource, /command !== "logout"/);
});
