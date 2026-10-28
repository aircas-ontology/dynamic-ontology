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
  assert.match(typeSource, /nodeIp:\s*string/);
  assert.match(typeSource, /nodePort:\s*number/);
  assert.match(typeSource, /containerId\?:\s*string/);
  assert.match(typeSource, /lastAction\?:\s*string/);
  assert.match(typeSource, /lastActionAt\?:\s*string/);
  assert.match(typeSource, /message:\s*string/);
  assert.match(typeSource, /imageAddress\?:\s*string/);
  assert.match(typeSource, /heartbeatStatus\?:/);
  assert.match(typeSource, /heartbeatLabel\?:/);
  assert.match(typeSource, /lastHeartbeatAt\?:/);
  assert.match(typeSource, /containerSource\?:/);
  assert.match(typeSource, /containerSourceLabel\?:/);
  assert.match(typeSource, /"USER"/);
  assert.match(typeSource, /"SYSTEM"/);
  assert.match(typeSource, /"HEALTHY"/);
  assert.match(typeSource, /"UNHEALTHY"/);
  assert.match(typeSource, /export type GetOntologyFunctionContainerRuntimeListData = OntologyFunctionContainerRuntimeItem\[\]/);
  assert.match(barrel, /GetOntologyFunctionContainerRuntimeListData/);
  assert.match(barrel, /GetOntologyFunctionContainerRuntimeListParams/);
  assert.match(barrel, /OntologyFunctionContainerRuntimeItem/);
  assert.match(barrel, /OntologyFunctionContainerRuntimePhase/);
  assert.match(barrel, /OntologyFunctionContainerRuntimeHeartbeatStatus/);
  assert.match(barrel, /OntologyFunctionContainerRuntimeSource/);
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
  assert.match(runtimePanelSource, /type="expand"/);
  assert.match(runtimePanelSource, /容器生命周期/);
  assert.match(runtimePanelSource, /镜像地址/);
  assert.match(runtimePanelSource, /最近操作/);
  assert.match(runtimePanelSource, /运行状态/);
  assert.match(runtimePanelSource, /说明/);
  assert.match(runtimePanelSource, /imageAddress/);
  assert.match(runtimePanelSource, /formatRuntimeActionAt/);
  assert.match(runtimePanelSource, /\$\{matched\[1\]\} \$\{matched\[2\]\}/);
  assert.match(runtimePanelSource, /部署信息/);
  assert.match(runtimePanelSource, /label="容器名"/);
  assert.match(runtimePanelSource, /label="宿主机 IP"/);
  assert.match(runtimePanelSource, /label="宿主机端口"/);
  assert.match(runtimePanelSource, /label="容器端口"/);
  assert.match(runtimePanelSource, /label="宿主映射端口"/);
  assert.match(runtimePanelSource, /label="心跳状态"/);
  assert.match(runtimePanelSource, /formatRuntimeHeartbeatStatus/);
  assert.match(runtimePanelSource, /isUserManagedRuntime/);
  assert.match(runtimePanelSource, /containerSource === ["']USER["']/);
  assert.match(runtimePanelSource, /nodeIp/);
  assert.match(runtimePanelSource, /nodePort/);
  assert.match(runtimePanelSource, />\s*启动\s*</);
  assert.match(runtimePanelSource, />\s*停止\s*</);
  assert.match(runtimePanelSource, />\s*重启\s*</);
  assert.match(runtimePanelSource, /postOntologyFunctionContainerRuntimeStartInterface/);
  assert.match(runtimePanelSource, /postOntologyFunctionContainerRuntimeStopInterface/);
  assert.match(runtimePanelSource, /postOntologyFunctionContainerRuntimeRestartInterface/);
  assert.match(runtimePanelSource, /canStartRuntime/);
  assert.match(runtimePanelSource, /canStopRuntime/);
  assert.match(runtimePanelSource, /canRestartRuntime/);
  assert.match(runtimePanelSource, /ElMessage\.success\(.*启动成功/);
  assert.match(runtimePanelSource, /ElMessage\.success\(.*停止成功/);
  assert.match(runtimePanelSource, /ElMessage\.success\(.*重启成功/);
  assert.match(runtimePanelSource, /ElMessage\.error\(.*启动失败/);
  assert.match(runtimePanelSource, /ElMessage\.error\(.*停止失败/);
  assert.match(runtimePanelSource, /ElMessage\.error\(.*重启失败/);
  assert.match(runtimePanelSource, /displayName/);
  assert.match(runtimePanelSource, /phaseLabel/);
  assert.match(runtimePanelSource, /row-key="containerKey"/);
});
