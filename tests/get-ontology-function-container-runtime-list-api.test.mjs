import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

/**
 * @description 读取相对 tests 目录的源文件文本。
 * @param relativePath 相对路径。
 * @returns 文件内容。
 */
const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("container runtime list types expose spaceId params and runtime item data", () => {
  const typeSource = readSource("../src/types/apis/getOntologyFunctionContainerRuntimeListType.ts");
  const barrel = readSource("../src/types/index.ts");
  assert.match(typeSource, /export interface GetOntologyFunctionContainerRuntimeListParams/);
  assert.match(typeSource, /spaceId:\s*number/);
  assert.match(typeSource, /export type OntologyFunctionContainerRuntimePhase/);
  assert.match(typeSource, /"CREATED"/);
  assert.match(typeSource, /"RUNNING"/);
  assert.match(typeSource, /"STOPPING"/);
  assert.match(typeSource, /"STOPPED"/);
  assert.match(typeSource, /"RESTARTING"/);
  assert.match(typeSource, /"FAILED"/);
  assert.match(typeSource, /export interface OntologyFunctionContainerRuntimeItem/);
  assert.match(typeSource, /containerKey:\s*string/);
  assert.match(typeSource, /ontologySpaceId:\s*number/);
  assert.match(typeSource, /displayName:\s*string/);
  assert.match(typeSource, /containerName:\s*string/);
  assert.match(typeSource, /phase:\s*OntologyFunctionContainerRuntimePhase/);
  assert.match(typeSource, /phaseLabel:\s*string/);
  assert.match(typeSource, /hostPort:\s*number/);
  assert.match(typeSource, /containerPort:\s*number/);
  assert.match(typeSource, /message:\s*string/);
  assert.match(typeSource, /export type GetOntologyFunctionContainerRuntimeListData = OntologyFunctionContainerRuntimeItem\[\]/);
  assert.match(barrel, /GetOntologyFunctionContainerRuntimeListData/);
  assert.match(barrel, /GetOntologyFunctionContainerRuntimeListParams/);
  assert.match(barrel, /OntologyFunctionContainerRuntimeItem/);
  assert.match(barrel, /OntologyFunctionContainerRuntimePhase/);
});

test("container runtime list api gets spaceId query on manage domain uri", () => {
  const apiSource = readSource("../src/apis/functionApi.ts");
  assert.match(
    apiSource,
    /export function getOntologyFunctionContainerRuntimeListInterface\(\s*params: GetOntologyFunctionContainerRuntimeListParams,?\s*\):\s*Promise<ApiResponse<GetOntologyFunctionContainerRuntimeListData>>/,
  );
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/function\/container\/runtime\/list"/);
  assert.match(apiSource, /method:\s*"get"/);
  assert.match(apiSource, /params,/);
  assert.match(apiSource, /@description/);
});

test("apis barrel exports the container runtime list interface", () => {
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /getOntologyFunctionContainerRuntimeListInterface/);
});

test("container runtime list mock mirrors SUCCESS sample item", () => {
  const mockSource = readSource("../src/mocks/getOntologyFunctionContainerRuntimeListMock/getOntologyFunctionContainerRuntimeListMock.ts");
  assert.match(mockSource, /export const getOntologyFunctionContainerRuntimeListMock: ApiResponse<GetOntologyFunctionContainerRuntimeListData> = \{/);
  assert.match(mockSource, /code: 200,/);
  assert.match(mockSource, /message: "SUCCESS",/);
  assert.match(mockSource, /success: true,/);
  assert.match(mockSource, /containerKey:\s*["']e7b65c92b0a24e17bf42c7f0b8c5ed5b["']/);
  assert.match(mockSource, /displayName:\s*["']rongqi["']/);
  assert.match(mockSource, /phase:\s*["']CREATED["']/);
  assert.match(mockSource, /phaseLabel:\s*["']已创建["']/);
  assert.match(mockSource, /hostPort:\s*18080/);
  assert.match(mockSource, /containerPort:\s*8080/);
});

test("function operator panel wires runtime config button and secondary panel", () => {
  const panelSource = readSource("../src/views/FunctionOperatorPanel/index.vue");
  const runtimePanelSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorContainerRuntimePanel.vue");
  assert.match(panelSource, /运行配置/);
  assert.match(panelSource, /FunctionOperatorContainerRuntimePanel/);
  assert.match(panelSource, /runtimePanelVisible/);
  assert.doesNotMatch(runtimePanelSource, /el-dialog/);
  assert.doesNotMatch(runtimePanelSource, /fullscreen/);
  assert.match(runtimePanelSource, />返回</);
  assert.match(runtimePanelSource, /emit\(['"]back['"]\)/);
  assert.match(runtimePanelSource, /getOntologyFunctionContainerRuntimeListInterface/);
  assert.match(runtimePanelSource, /label="容器算子名"/);
  assert.match(runtimePanelSource, /label="运行状态"/);
  assert.match(runtimePanelSource, /label="操作"/);
  assert.match(runtimePanelSource, />\s*启动\s*</);
  assert.match(runtimePanelSource, />\s*停止\s*</);
  assert.match(runtimePanelSource, /postOntologyFunctionContainerRuntimeStartInterface/);
  assert.match(runtimePanelSource, /postOntologyFunctionContainerRuntimeStopInterface/);
  assert.match(runtimePanelSource, /canStartRuntime/);
  assert.match(runtimePanelSource, /canStopRuntime/);
  assert.match(runtimePanelSource, /ElMessage\.success\(.*启动成功/);
  assert.match(runtimePanelSource, /ElMessage\.success\(.*停止成功/);
  assert.match(runtimePanelSource, /ElMessage\.error\(.*启动失败/);
  assert.match(runtimePanelSource, /ElMessage\.error\(.*停止失败/);
  assert.match(runtimePanelSource, /displayName/);
  assert.match(runtimePanelSource, /phaseLabel/);
  assert.match(runtimePanelSource, /row-key="containerKey"/);
});
