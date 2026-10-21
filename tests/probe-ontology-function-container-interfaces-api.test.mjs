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

test("probe ontology function container interfaces types expose docPath params and interface list data", () => {
  const typeSource = readSource("../src/types/apis/probeOntologyFunctionContainerInterfacesType.ts");
  const barrel = readSource("../src/types/index.ts");
  assert.match(typeSource, /export interface ProbeOntologyFunctionContainerInterfacesParams/);
  assert.match(typeSource, /docPath:\s*string/);
  assert.match(typeSource, /export interface ProbeOntologyFunctionContainerInterfaceParameter/);
  assert.match(typeSource, /export interface ProbeOntologyFunctionContainerInterfaceItem/);
  assert.match(typeSource, /inputParameters:\s*ProbeOntologyFunctionContainerInterfaceParameter\[\]/);
  assert.match(typeSource, /outputParameters:\s*ProbeOntologyFunctionContainerInterfaceParameter\[\]/);
  assert.match(typeSource, /export type ProbeOntologyFunctionContainerInterfacesData = ProbeOntologyFunctionContainerInterfaceItem\[\]/);
  assert.match(barrel, /ProbeOntologyFunctionContainerInterfaceItem/);
  assert.match(barrel, /ProbeOntologyFunctionContainerInterfaceParameter/);
  assert.match(barrel, /ProbeOntologyFunctionContainerInterfacesData/);
  assert.match(barrel, /ProbeOntologyFunctionContainerInterfacesParams/);
});

test("probe ontology function container interfaces api posts docPath to manage domain uri", () => {
  const apiSource = readSource("../src/apis/functionApi.ts");
  assert.match(
    apiSource,
    /export function postProbeOntologyFunctionContainerInterfacesInterface\(\s*params: ProbeOntologyFunctionContainerInterfacesParams,?\s*\):\s*Promise<ApiResponse<ProbeOntologyFunctionContainerInterfacesData>>/,
  );
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/function\/container\/probe_interfaces"/);
  assert.match(apiSource, /method:\s*"post"/);
  assert.match(apiSource, /data:\s*params/);
  assert.match(apiSource, /@description/);
});

test("apis barrel exports the container interfaces probe interface", () => {
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /postProbeOntologyFunctionContainerInterfacesInterface/);
});

test("probe ontology function container interfaces mock mirrors SUCCESS sample with interface list", () => {
  const mockSource = readSource("../src/mocks/probeOntologyFunctionContainerInterfacesMock/probeOntologyFunctionContainerInterfacesMock.ts");
  assert.match(mockSource, /export const probeOntologyFunctionContainerInterfacesMock: ApiResponse<ProbeOntologyFunctionContainerInterfacesData> = \{/);
  assert.match(mockSource, /code: 200,/);
  assert.match(mockSource, /message: "SUCCESS",/);
  assert.match(mockSource, /success: true,/);
  assert.match(mockSource, /name:\s*["']getEcho["']/);
  assert.match(mockSource, /api:\s*["']GET \/get["']/);
  assert.match(mockSource, /inputParameters:/);
  assert.match(mockSource, /outputParameters:/);
  assert.match(mockSource, /name:\s*["']postEcho["']/);
});

test("mockData registers container interfaces probe route with interface list", () => {
  const routes = readSource("../src/mockData/routes.json");
  assert.match(routes, /\/ontology\/function\/container\/probe_interfaces/);
  const fixture = readSource("../src/mockData/fixtures/ontology/function/container/probe_interfaces.post.json");
  assert.match(fixture, /"code":\s*200/);
  assert.match(fixture, /"name":\s*"getEcho"/);
  assert.match(fixture, /"inputParameters"/);
  assert.match(fixture, /"outputParameters"/);
  assert.match(fixture, /"name":\s*"postEcho"/);
});

test("docker form shows discovered interfaces multi-select expandable table", () => {
  const formSource = readSource("../src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue");
  assert.match(formSource, /dockerDiscoveredInterfaces/);
  assert.match(formSource, /dockerSelectedInterfaceApis/);
  assert.match(formSource, /已发现接口/);
  assert.match(formSource, /type="selection"/);
  assert.match(formSource, /type="expand"/);
  assert.match(formSource, /label="接口名称"/);
  assert.match(formSource, /label="请求方式"/);
  assert.match(formSource, /label="路径"/);
  assert.match(formSource, /label="说明"/);
  assert.match(formSource, /入参/);
  assert.match(formSource, /出参/);
  assert.match(formSource, /onDockerDiscoveredInterfacesSelectionChange/);
  assert.match(formSource, /resolveDockerDiscoveredInterfaceRowKey/);
});
