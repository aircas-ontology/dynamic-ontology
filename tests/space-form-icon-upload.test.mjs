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
});

test("space draft validation accepts remote thumbnail urls for create and edit", () => {
  const operations = readSource("../src/views/OntologySpaceManagement/utils/spaceOperations.ts");
  assert.match(operations, /isAcceptedSpaceIconUrl/);
  assert.match(operations, /https\?:/);
  assert.match(operations, /data:image/);
  assert.match(operations, /png\|jpeg\|webp/);
});
