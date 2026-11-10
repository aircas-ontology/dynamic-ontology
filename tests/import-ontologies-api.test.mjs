import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import ts from "typescript";
import { computed, ref } from "vue";

const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("import ontologies api types cover the binary file and empty data object", () => {
  const apiTypeSource = readSource("../src/types/apis/importOntologiesType.ts");
  const typeBarrelSource = readSource("../src/types/index.ts");
  assert.match(apiTypeSource, /export interface ImportOntologiesParams/);
  assert.match(apiTypeSource, /file:\s*File/);
  assert.match(apiTypeSource, /export type ImportOntologiesData = Record<string, unknown>/);
  assert.match(typeBarrelSource, /export type \{ ImportOntologiesData, ImportOntologiesParams \} from "\.\/apis\/importOntologiesType";/);
});

test("import ontologies api posts the file as multipart form data to the prefixed import uri", () => {
  const apiSource = readSource("../src/apis/ontologyObjectManageApi.ts");
  const fn = apiSource.match(/export function postImportOntologiesInterface[\s\S]*?\n\}/);
  assert.ok(fn, "missing import interface");
  assert.match(fn[0], /Promise<ApiResponse<ImportOntologiesData>>/);
  assert.match(fn[0], /request<ImportOntologiesData>\(\{/);
  assert.match(fn[0], /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/meta\/import"/);
  assert.match(fn[0], /method:\s*"post"/);
  assert.match(fn[0], /const formData = new FormData\(\)/);
  assert.match(fn[0], /formData\.append\("file", params\.file\)/);
  assert.match(fn[0], /data:\s*formData/);
  assert.match(fn[0], /Content-Type.*multipart\/form-data/);
  assert.match(apiSource, /import type \{[\s\S]*ImportOntologiesData[\s\S]*ImportOntologiesParams[\s\S]*\} from "@\/types"/);
});

test("apis barrel exports the ontology import interface in dictionary order", () => {
  const apiBarrelSource = readSource("../src/apis/index.ts");
  assert.match(
    apiBarrelSource,
    /import \{[\s\S]*?getOntologyObjectByCategoryIdInterface,[\s\S]*?postImportOntologiesInterface,[\s\S]*?updateOntologyObjectInterface[\s\S]*?\} from "\.\/ontologyObjectManageApi";/,
  );
  assert.match(
    apiBarrelSource,
    /export \{[\s\S]*?postCreateOntologyRelationCategoryTreeInterface,[\s\S]*?postImportOntologiesInterface,[\s\S]*?postImportOntologySpaceInterface[\s\S]*?\};/,
  );
});

test("object create dialog import mode submits the selected file to the import api", () => {
  const dialogSource = readSource("../src/views/ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue");
  const actionsSource = readSource("../src/views/ObjectWorkspacePanel/composables/useObjectWorkspaceObjectActions.ts");
  const panelSource = readSource("../src/views/ObjectWorkspacePanel/index.vue");
  assert.match(dialogSource, /emit\(\s*"submit-import",\s*importFile\.value\s*\)/);
  assert.match(dialogSource, /请先选择文件。/);
  assert.doesNotMatch(dialogSource, /JSON\.parse/);
  assert.match(panelSource, /@submit-import="importOntologyObjects"/);
  assert.match(actionsSource, /postImportOntologiesInterface\(\{ file, spaceId/);
  assert.match(actionsSource, /response\.code !== 200/);
  assert.match(actionsSource, /ElMessage\.success\("导入成功"\)/);
  assert.match(actionsSource, /await load\(\)/);
});

test("import sends the file and current space id in multipart form data", async () => {
  let requestConfig;
  const source = readSource("../src/apis/ontologyObjectManageApi.ts");
  const code = ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 });
  const exports = {};
  new Function("exports", "require", "DOMAIN_CONFIG", code)(
    exports,
    () => ({
      request: (config) => {
        requestConfig = config;
        return Promise.resolve({ code: 200 });
      },
    }),
    { ONTOLOGYMANAGE_URL: "" },
  );
  const file = new File(["[]"], "objects.json", { type: "application/json" });
  await exports.postImportOntologiesInterface({ file, spaceId: 42 });
  assert.equal(requestConfig.data.get("spaceId"), "42");
  assert.equal(requestConfig.data.get("file"), file);
});

test("import action passes the active space id and refreshes after success", async () => {
  let payload;
  let refreshCount = 0;
  const source = readSource("../src/views/ObjectWorkspacePanel/composables/useObjectWorkspaceObjectActions.ts");
  const code = ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 });
  const exports = {};
  new Function("exports", "require", code)(exports, (name) =>
    name === "vue"
      ? { ref, computed }
      : name === "@/apis"
        ? {
            postImportOntologiesInterface: async (value) => {
              payload = value;
              return { code: 200 };
            },
          }
        : { ElMessage: { success() {} } },
  );
  const actions = exports.useObjectWorkspaceObjectActions({
    spaceId: ref("42"),
    workspace: ref(undefined),
    load: async () => {
      refreshCount++;
    },
  });
  const file = new File(["[]"], "objects.json");
  await actions.importOntologyObjects(file);
  assert.deepEqual(payload, { file, spaceId: 42 });
  assert.equal(refreshCount, 1);
  assert.equal(actions.objectCreateSubmitting.value, false);
});

for (const spaceId of ["", "invalid", "-1"]) {
  test(`import rejects invalid space id ${JSON.stringify(spaceId)} without a request`, async () => {
    let calls = 0;
    const source = readSource("../src/views/ObjectWorkspacePanel/composables/useObjectWorkspaceObjectActions.ts");
    const code = ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 });
    const exports = {};
    new Function("exports", "require", code)(exports, (name) =>
      name === "vue"
        ? { ref, computed }
        : name === "@/apis"
          ? {
              postImportOntologiesInterface: async () => {
                calls++;
                return { code: 200 };
              },
            }
          : { ElMessage: { success() {} } },
    );
    const actions = exports.useObjectWorkspaceObjectActions({ spaceId: ref(spaceId), workspace: ref(undefined), load: async () => {} });
    await actions.importOntologyObjects(new File(["[]"], "objects.json"));
    assert.equal(calls, 0);
    assert.match(actions.objectCreateError.value, /空间/);
  });
}
