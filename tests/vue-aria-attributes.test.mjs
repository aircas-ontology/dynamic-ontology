import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const projectRoot = path.resolve(import.meta.dirname, "..");
const augmentationPath = path.join(projectRoot, "src/types/global/vueAriaAttributesType.ts");
const fixturePath = path.join(projectRoot, "tests/vueAriaAttributesFixture.ts");
const fixtureSource = `
import type { AllowedComponentProps } from "vue";
import type { ElInput, ElSelect } from "element-plus";
const validLabel: AllowedComponentProps = { "aria-label": "搜索" };
const optionalLabel: AllowedComponentProps = { "aria-label": undefined };
const originalProps: AllowedComponentProps = { class: "search", style: { color: "red" } };
const inputProps: InstanceType<typeof ElInput>["$props"] = { "aria-label": "搜索" };
const selectProps: InstanceType<typeof ElSelect>["$props"] = { "aria-label": "筛选" };
const numericLabel: AllowedComponentProps = { "aria-label": 123 };
const misspelledLabel: AllowedComponentProps = { "aria-lable": "搜索" };
const unrelatedProp: AllowedComponentProps = { "unexpected-property": "value" };
`;

/**
 * @description 使用项目编译选项检查内存中的类型样例，并仅加载项目实际包含的目标全局扩展。
 * @returns {{ diagnostics: readonly ts.Diagnostic[], included: boolean }} 编译诊断及声明文件包含状态。
 */
function checkAriaTypes() {
  const config = ts.readConfigFile(path.join(projectRoot, "tsconfig.json"), ts.sys.readFile);
  assert.equal(config.error, undefined);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, projectRoot);
  assert.deepEqual(parsed.errors, []);
  const included = parsed.fileNames.includes(augmentationPath);
  const host = ts.createCompilerHost(parsed.options);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) =>
    fileName === fixturePath
      ? ts.createSourceFile(fileName, fixtureSource, languageVersion, true)
      : originalGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
  const program = ts.createProgram({
    rootNames: [fixturePath, ...(included ? [augmentationPath] : [])],
    options: parsed.options,
    host,
  });
  return { diagnostics: ts.getPreEmitDiagnostics(program), included };
}

const result = checkAriaTypes();

/**
 * @description 根据样例变量名找到该语句对应的编译诊断。
 * @param {string} variableName 类型样例的变量名。
 * @returns {readonly ts.Diagnostic[]} 该语句对应的诊断。
 */
function getStatementDiagnostics(variableName) {
  const lineIndex = fixtureSource.split("\n").findIndex((line) => line.startsWith(`const ${variableName}:`));
  assert.notEqual(lineIndex, -1);
  return result.diagnostics.filter(
    (diagnostic) => diagnostic.file?.fileName === fixturePath && diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line === lineIndex,
  );
}

test("Vue and Element Plus accept standard string aria-label without local v-bind", () => {
  for (const variableName of ["validLabel", "optionalLabel", "originalProps", "inputProps", "selectProps"]) {
    assert.deepEqual(
      getStatementDiagnostics(variableName).map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")),
      [],
      variableName,
    );
  }
  assert.equal(result.included, true, "全局类型扩展须由现有 tsconfig 自动包含");
});

test("ARIA augmentation rejects numeric labels, misspellings and unrelated props", () => {
  assert.deepEqual(
    getStatementDiagnostics("numericLabel").map((diagnostic) => diagnostic.code),
    [2322],
  );
  for (const variableName of ["misspelledLabel", "unrelatedProp"]) {
    assert.deepEqual(
      getStatementDiagnostics(variableName).map((diagnostic) => diagnostic.code),
      [2353],
    );
  }
  assert.equal(result.diagnostics.length, 3, "不应存在样例以外的编译错误");
});
