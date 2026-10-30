import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("space form uploads selected icon then stores the returned thumbnail url", () => {
  const dialog = readSource("../src/views/OntologySpaceManagement/components/SpaceFormDialog.vue");
  assert.match(dialog, /postUploadOntologyThumbnailInterface/);
  assert.match(dialog, /draft\.iconUrl\s*=\s*response\.data/);
  assert.doesNotMatch(dialog, /draft\.iconUrl = "data:" \+ file\.type \+ ";base64,"/);
  assert.match(dialog, /code !== 200/);
  assert.match(dialog, /accept="image\/png,image\/jpeg"/);
  assert.doesNotMatch(dialog, /image\/webp/);
  assert.match(dialog, /PNG\/JPEG，最大 2MB/);
});

test("space draft validation accepts remote thumbnail urls for create and edit", () => {
  const operations = readSource("../src/views/OntologySpaceManagement/utils/spaceOperations.ts");
  assert.match(operations, /isAcceptedSpaceIconUrl/);
  assert.match(operations, /https\?:/);
  assert.match(operations, /data:image/);
  assert.match(operations, /png\|jpeg/);
  assert.doesNotMatch(operations, /webp/);
});

test("ontology object create dialog icon upload only allows png and jpeg", () => {
  const dialog = readSource("../src/views/ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue");
  assert.match(dialog, /accept="image\/png,image\/jpeg,\.png,\.jpg,\.jpeg"/);
  assert.match(dialog, /PNG \/ JPG，不超过 2MB/);
  assert.doesNotMatch(dialog, /webp/i);
  assert.doesNotMatch(dialog, /svg/i);
});

test("ontology object create dialog uploads icon via thumbnail api like space form", () => {
  const dialog = readSource("../src/views/ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue");
  assert.match(dialog, /postUploadOntologyThumbnailInterface/);
  assert.match(dialog, /draft\.iconUrl\s*=\s*typeof response\.data === "string" \? response\.data : ""/);
  assert.doesNotMatch(dialog, /readFileAsDataUrl/);
  assert.doesNotMatch(dialog, /readAsDataURL/);
  assert.match(dialog, /iconUploading/);
  assert.match(dialog, /code !== 200/);
});

test("ontology object manual form validates required fields and limits icon upload", () => {
  const dialog = readSource("../src/views/ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue");
  assert.match(dialog, /:error="apiNameError"/);
  assert.match(dialog, /:error="displayNameError"/);
  assert.match(dialog, /:error="categoryError"/);
  assert.match(dialog, /请输入 API 名称/);
  assert.match(dialog, /请输入显示名称/);
  assert.match(dialog, /请选择分类/);
  assert.match(dialog, /v-if="!draft\.iconUrl"/);
  assert.match(dialog, /:limit="1"/);
  assert.match(dialog, /:on-exceed="handleIconExceed"/);
  assert.match(dialog, /picture-card/);
});
