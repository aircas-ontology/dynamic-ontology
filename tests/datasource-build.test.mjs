import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { computed, reactive, ref } from "vue";

/** @description 创建可执行的向导状态，注入字段查询接口。 @returns {object} 向导状态与操作。 */
function createFieldWizard() {
  const source = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/DatasourceBuildDialog.vue", import.meta.url), "utf8");
  const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/import[\s\S]*?from\s+"[^"]+";/g, "");
  const emitted = [];
  const deps = {
    computed,
    reactive,
    ref,
    watch: () => {},
    onBeforeUnmount: () => {},
    defineProps: () => ({ spaceId: "1", categoryTree: [{ id: "3", label: "分类", children: [] }] }),
    defineModel: () => ref(true),
    defineEmits:
      () =>
      (...args) =>
        emitted.push(args),
    ElLoading: { directive: {} },
    getDatasourceTableColumnsInterface: async () => ({
      code: 200,
      data: [
        {
          tableName: "ships",
          columns: [
            { columnName: "name", ontologyDataType: "String", nativeType: "varchar" },
            { columnName: "geometry", ontologyDataType: "Geometry", nativeType: "geometry" },
            { columnName: "unknown", nativeType: "jsonb" },
          ],
        },
      ],
    }),
  };
  const code = ts.transpile(
    `${script}\nobjectName.value = "舰船"; categoryId.value = "3"; return { step, tables, selected, primary, fieldIdsByTable, nextStep, selectAllFields, clearFields, setFieldSelected, error };`,
    { target: ts.ScriptTarget.ES2022 },
  );
  return { ...new Function(...Object.keys(deps), code)(...Object.values(deps)), emitted };
}

test("datasource field selection excludes unsupported types on load, single selection and select all", async () => {
  const wizard = createFieldWizard();
  wizard.tables.value = [{ id: "ships", name: "ships", storageName: "ships", fields: [] }];
  wizard.selected.value = ["ships"];
  wizard.primary.value = "ships";
  wizard.step.value = 1;
  await wizard.nextStep();
  assert.deepEqual(wizard.fieldIdsByTable.ships, ["ships-name"]);
  wizard.setFieldSelected("ships", "ships-geometry", true);
  assert.deepEqual(wizard.fieldIdsByTable.ships, ["ships-name"]);
  wizard.clearFields();
  wizard.selectAllFields();
  assert.deepEqual(wizard.fieldIdsByTable.ships, ["ships-name"]);
  wizard.step.value = 1;
  wizard.fieldIdsByTable.ships.push("ships-geometry");
  await wizard.nextStep();
  assert.deepEqual(wizard.fieldIdsByTable.ships, ["ships-name"]);
  wizard.fieldIdsByTable.ships.push("ships-geometry");
  await wizard.nextStep();
  assert.equal(wizard.emitted.length, 0);
  assert.match(wizard.error.value, /不支持/);
});

test("object creation exposes datasource build mode and three-step workflow", () => {
  const dialog = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue", import.meta.url), "utf8");
  assert.match(dialog, /数据源构建/);
  assert.match(dialog, /DatasourceBuildDialog/);
  assert.match(dialog, /handleDatasourceSubmit/);
  const wizard = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/DatasourceBuildDialog.vue", import.meta.url), "utf8");
  for (const title of ["选择 schema", "选择数据库表", "字段与外键"]) assert.match(wizard, new RegExp(title));
  assert.match(wizard, /主表/);
  assert.match(wizard, /外键/);
});

test("datasource fields display as rows with editable descriptions", () => {
  const wizard = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/DatasourceBuildDialog.vue", import.meta.url), "utf8");
  assert.match(wizard, /:data="activeTable.fields"/);
  assert.match(wizard, /v-model="row.description"/);
  assert.match(wizard, /field.description/);
  assert.match(wizard, /row\.isPrimaryKey === true/);
  assert.match(wizard, /（主键）/);
});

test("datasource mock covers both supported database types and connection validation", () => {
  const mock = readFileSync(new URL("../src/mocks/datasourceBuildMock/datasourceBuildMock.ts", import.meta.url), "utf8");
  assert.match(mock, /mysql/);
  assert.match(mock, /postgresql/);
  assert.match(mock, /validateDatasourceConnection/);
});

test("datasource table APIName and description are editable and retained for submission", () => {
  const wizard = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/DatasourceBuildDialog.vue", import.meta.url), "utf8");
  const dialog = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue", import.meta.url), "utf8");
  assert.match(wizard, /label="APIName"/);
  assert.match(wizard, /v-model="row.comment"/);
  assert.doesNotMatch(wizard, /入库名/);
  assert.match(dialog, /draft.description = primaryTable\?\.comment/);
});

test("target table name remains data but is not shown in the table selector", () => {
  const wizard = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/DatasourceBuildDialog.vue", import.meta.url), "utf8");
  assert.doesNotMatch(wizard, /<el-table-column label="入库表名"/);
  assert.match(wizard, /targetName: previousTables\.get\(table\.tableName\)\?\.targetName \?\? table\.tableName/);
});
