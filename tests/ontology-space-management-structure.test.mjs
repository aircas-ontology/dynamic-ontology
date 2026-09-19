import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pageSource = readFileSync(
  new URL("../src/views/OntologySpaceManagement/index.vue", import.meta.url),
  "utf8",
);

test("space management entry only composes page sections and lifecycle", () => {
  assert.match(pageSource, /SpaceCollection/);
  assert.match(pageSource, /SpaceCommandDialogs/);
  assert.match(pageSource, /useSpaceManagementActions/);
  assert.doesNotMatch(pageSource, /useRouter|ElMessage|downloadSpaceJson|serializeSpace/);
  assert.doesNotMatch(pageSource, /<el-dialog/);
});

test("space collection delegates table and card rendering", () => {
  const source = readFileSync(
    new URL("../src/views/OntologySpaceManagement/components/SpaceCollection.vue", import.meta.url),
    "utf8",
  );
  assert.match(source, /SpaceTableView/);
  assert.match(source, /SpaceCardGrid/);
  assert.match(source, /el-pagination/);
});
