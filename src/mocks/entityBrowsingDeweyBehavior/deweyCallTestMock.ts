import type {
  CallTestFailureScenario,
  CallTestFunctionProfile,
  CallTestHistoricalPoint,
  CallTestHistoryBaseline,
  CallTestHistoryComparison,
  CallTestInput,
  CallTestInputSource,
  CallTestLogEntry,
  CallTestMetrics,
  CallTestServiceCheckResult,
  CallTestStep,
  CallTestStepId,
  CallTestTrajectoryPoint,
  CallTestValidationResult,
} from "@/types/entityBrowsingDeweyCallTest";
import { generateTrajectoryForecast } from "@/utils/trajectoryForecast";

export const CALL_TEST_FUNCTION_PROFILE: Readonly<CallTestFunctionProfile> = {
  behaviorType: "分析模型",
  mountedFunction: "trajectory_predict_v3",
  implementationMode: "MCP工具",
  mcpService: "trajectory-model-mcp",
  toolName: "predict_route",
  version: "v3.2.0",
  serviceStatus: "已注册",
  healthStatus: "未检查",
  sandboxName: "测试沙箱",
  outputType: "GIS轨迹",
};

const CURRENT_INPUT: Readonly<CallTestInput> = {
  startGrid: "A-17",
  longitude: 114.25,
  latitude: 13.46,
  heading: 72,
  speedKnots: 18.4,
  predictionHours: 3,
  pointIntervalMinutes: 15,
  recentTrackPoints: 24,
  envDataVersion: "ENV-20260813-1540",
  modelConfig: "默认配置 v3",
};

const HISTORY_INPUT: Readonly<CallTestInput> = {
  startGrid: "A-17",
  longitude: 114.21,
  latitude: 13.43,
  heading: 70,
  speedKnots: 18.1,
  predictionHours: 3,
  pointIntervalMinutes: 15,
  recentTrackPoints: 24,
  envDataVersion: "ENV-20260730-1540",
  modelConfig: "默认配置 v3",
  sourceExecutionId: "EXEC-20260730-154218",
};

export const CALL_TEST_INPUT_PRESETS: Readonly<Record<CallTestInputSource, Readonly<CallTestInput>>> = {
  current: CURRENT_INPUT,
  history: HISTORY_INPUT,
  custom: CURRENT_INPUT,
};

export const CALL_TEST_HISTORY_BASELINE: Readonly<CallTestHistoryBaseline> = {
  executionId: "EXEC-20260730-154218",
  confidence: 0.87,
  endGrid: "A-19",
  averageSpeed: 18.2,
  endpointLongitude: 117.033,
  endpointLatitude: 14.267,
  version: "v3.2.0",
  inputSource: "状态变化触发",
};

// 杜威号历史轨迹（Part A 数据：9 个轨迹点，当前船位即轨迹终点）
export const CALL_TEST_HISTORICAL_TRACK: readonly CallTestHistoricalPoint[] = [
  { index: 1, longitude: 112.922208, latitude: 12.428569 },
  { index: 2, longitude: 112.917793, latitude: 12.692361 },
  { index: 3, longitude: 113.116954, latitude: 12.787249 },
  { index: 4, longitude: 113.248083, latitude: 12.981339 },
  { index: 5, longitude: 113.442785, latitude: 13.070011 },
  { index: 6, longitude: 113.653566, latitude: 13.234594 },
  { index: 7, longitude: 113.933364, latitude: 13.290043 },
  { index: 8, longitude: 114.079419, latitude: 13.447158 },
  { index: 9, longitude: 114.255391, latitude: 13.462915 },
];

export const CALL_TEST_FAILURE_SCENARIOS: readonly CallTestFailureScenario[] = [
  {
    errorCode: "MCP_CONNECT_TIMEOUT",
    failedStep: "service",
    summary: "MCP 服务连接超时",
    detail: "在规定时间内未完成 trajectory-model-mcp 握手。",
    suggestion: "检查服务网络和注册状态后重试。",
    mockContext: { timeoutMs: 3000 },
  },
  {
    errorCode: "TOOL_UNAVAILABLE",
    failedStep: "service",
    summary: "predict_route 暂时不可用",
    detail: "MCP 服务在线，但 Tool 未返回可调用能力。",
    suggestion: "确认 Tool 注册信息和版本。",
    mockContext: { tool: "predict_route" },
  },
  {
    errorCode: "HEALTH_CHANGED",
    failedStep: "service",
    summary: "服务健康状态发生变化",
    detail: "执行期间服务从正常切换为维护状态。",
    suggestion: "重新检查服务状态后执行。",
    mockContext: { previous: "正常", current: "维护中" },
  },
  {
    errorCode: "MODEL_TIMEOUT",
    failedStep: "model",
    summary: "模型推理超时",
    detail: "模型未在沙箱执行时限内生成三小时预测结果。",
    suggestion: "稍后重试或检查模型负载。",
    mockContext: { timeoutMs: 5000 },
  },
  {
    errorCode: "ENV_VERSION_MISMATCH",
    failedStep: "model",
    summary: "环境数据版本不匹配",
    detail: "输入环境版本与模型当前加载版本不一致。",
    suggestion: "刷新环境数据版本后重试。",
    mockContext: { expected: "ENV-20260813-1540" },
  },
  {
    errorCode: "TRACK_POINTS_INSUFFICIENT",
    failedStep: "model",
    summary: "有效轨迹点数量不足",
    detail: "清洗后可用轨迹点不足以支持三小时预测。",
    suggestion: "补充最近轨迹点后重试。",
    mockContext: { minimum: 12 },
  },
  {
    errorCode: "OUTPUT_FIELD_MISSING",
    failedStep: "output",
    summary: "返回结果缺少坐标字段",
    detail: "部分预测节点缺少 longitude 或 latitude。",
    suggestion: "检查 Tool 输出协议。",
    mockContext: { required: "longitude,latitude" },
  },
  {
    errorCode: "GEOJSON_INVALID",
    failedStep: "output",
    summary: "GeoJSON 格式校验失败",
    detail: "预测轨迹无法转换为有效 LineString。",
    suggestion: "检查坐标数组结构和数值范围。",
    mockContext: { geometry: "LineString" },
  },
  {
    errorCode: "TIME_SEQUENCE_INVALID",
    failedStep: "output",
    summary: "输出时间序列不连续",
    detail: "预测节点时间未按 15 分钟间隔递增。",
    suggestion: "检查模型输出时间戳。",
    mockContext: { intervalMinutes: 15 },
  },
];

export const CALL_TEST_STEP_DEFINITIONS: readonly Pick<CallTestStep, "id" | "index" | "name">[] = [
  { id: "validation", index: 1, name: "参数校验" },
  { id: "service", index: 2, name: "服务调用" },
  { id: "model", index: 3, name: "模型执行" },
  { id: "output", index: 4, name: "输出解析" },
];

const round = (value: number, digits: number): number => Number(value.toFixed(digits));
const randomBetween = (min: number, max: number): number => min + Math.random() * (max - min);
const randomItem = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)]!;
const formatTimestamp = (date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}.${String(date.getMilliseconds()).padStart(3, "0")}`;

export const cloneCallTestInput = (source: CallTestInputSource): CallTestInput => ({ ...CALL_TEST_INPUT_PRESETS[source] });

export const buildCallTestInputJson = (input: CallTestInput, source: CallTestInputSource, writeBack: boolean): Record<string, string | number | boolean> => ({
  start_grid: input.startGrid,
  longitude: input.longitude,
  latitude: input.latitude,
  heading: input.heading,
  speed_knots: input.speedKnots,
  prediction_hours: input.predictionHours,
  point_interval_minutes: input.pointIntervalMinutes,
  recent_track_points: input.recentTrackPoints,
  env_id: input.envDataVersion,
  model_config: input.modelConfig,
  write_back: writeBack,
  source_type: source,
  ...(input.sourceExecutionId ? { source_execution_id: input.sourceExecutionId } : {}),
});

export const validateCallTestInput = (input: CallTestInput): CallTestValidationResult => {
  if (!/^[A-Za-z]+-\d+$/.test(input.startGrid)) return { valid: false, message: "起始网格格式不正确" };
  if (input.longitude < -180 || input.longitude > 180) return { valid: false, message: "经度必须在 -180～180 之间" };
  if (input.latitude < -90 || input.latitude > 90) return { valid: false, message: "纬度必须在 -90～90 之间" };
  if (input.heading < 0 || input.heading > 359) return { valid: false, message: "航向必须在 0～359 之间" };
  if (input.speedKnots <= 0) return { valid: false, message: "航速必须大于 0" };
  if (!Number.isInteger(input.recentTrackPoints) || input.recentTrackPoints <= 0) return { valid: false, message: "最近轨迹点必须为正整数" };
  if (input.predictionHours !== 3 || input.pointIntervalMinutes !== 15) return { valid: false, message: "本测试固定预测 3 小时、每 15 分钟输出一点" };
  return { valid: true, message: "参数校验通过" };
};

export const createServiceCheckResult = (): CallTestServiceCheckResult => {
  const checkedAt = formatTimestamp();
  if (Math.random() < 2) {
    return { success: true, serviceStatus: "在线", healthStatus: "正常", checkedAt, message: randomItem(["服务连接正常", "MCP Tool 可用", "模型服务健康"]) };
  }
  const failure = randomItem([
    { serviceStatus: "维护中" as const, errorCode: "TOOL_UNAVAILABLE", message: "Tool 暂时不可用" },
    { serviceStatus: "连接失败" as const, errorCode: "MCP_CONNECT_TIMEOUT", message: "MCP 服务连接超时" },
    { serviceStatus: "连接失败" as const, errorCode: "HEALTH_CHECK_FAILED", message: "服务健康检查失败" },
  ]);
  return { success: false, healthStatus: "异常", checkedAt, ...failure };
};

export const createTestId = (date = new Date()): string => {
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const timePart = `${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}${String(date.getSeconds()).padStart(2, "0")}`;
  return `TEST-${datePart}-${timePart}-${Math.floor(randomBetween(100, 1000))}`;
};

export const createTrajectoryResult = (input: CallTestInput, startAt = new Date()): CallTestTrajectoryPoint[] => {
  const forecast = generateTrajectoryForecast({
    longitude: input.longitude,
    latitude: input.latitude,
    heading: input.heading,
    speedKnots: input.speedKnots,
    hours: input.predictionHours,
    stepMinutes: input.pointIntervalMinutes,
  });
  return forecast.map((point, index) => {
    const time = new Date(startAt.getTime() + point.minutesFromStart * 60_000);
    return {
      index: index + 1,
      isoTime: time.toISOString(),
      displayTime: formatTimestamp(time).slice(0, 19),
      minutesFromStart: point.minutesFromStart,
      longitude: point.longitude,
      latitude: point.latitude,
      speedKnots: point.speedKnots,
      heading: point.heading,
      errorRadiusNm: point.errorRadiusNm,
      isHourlyNode: point.isHourlyNode,
    };
  });
};

export const createCallTestMetrics = (trajectory: readonly CallTestTrajectoryPoint[], writeBack: boolean): CallTestMetrics => {
  const endpoint = trajectory.at(-1)!;
  const averageSpeed = trajectory.reduce((sum, point) => sum + point.speedKnots, 0) / trajectory.length;
  return {
    endGrid: `A-${Math.max(18, Math.round(17 + endpoint.minutesFromStart / 90))}`,
    endpoint: `${endpoint.longitude.toFixed(4)}°E / ${endpoint.latitude.toFixed(4)}°N`,
    predictedHeading: `${String(endpoint.heading).padStart(3, "0")}°`,
    averageSpeed: `${averageSpeed.toFixed(1)}节`,
    confidence: round(randomBetween(0.82, 0.96), 2),
    riskOverlap: Math.random() < 2 ? "0处" : "1处",
    outputPointCount: trajectory.length,
    writeBackFieldCount: writeBack ? 3 : 0,
  };
};

const distanceNm = (longitudeA: number, latitudeA: number, longitudeB: number, latitudeB: number): number => {
  const meanLatitude = (((latitudeA + latitudeB) / 2) * Math.PI) / 180;
  const longitudeNm = (longitudeA - longitudeB) * 60 * Math.cos(meanLatitude);
  const latitudeNm = (latitudeA - latitudeB) * 60;
  return Math.sqrt(longitudeNm ** 2 + latitudeNm ** 2);
};

export const createHistoryComparison = (
  trajectory: readonly CallTestTrajectoryPoint[],
  metrics: CallTestMetrics,
  source: CallTestInputSource,
): CallTestHistoryComparison => {
  const endpoint = trajectory.at(-1)!;
  const deviation = distanceNm(
    endpoint.longitude,
    endpoint.latitude,
    CALL_TEST_HISTORY_BASELINE.endpointLongitude,
    CALL_TEST_HISTORY_BASELINE.endpointLatitude,
  );
  return {
    historicalConfidence: CALL_TEST_HISTORY_BASELINE.confidence.toFixed(2),
    currentConfidence: metrics.confidence.toFixed(2),
    endpointDeviation: `${deviation.toFixed(1)}海里`,
    trajectoryDifference: `${Math.min(99.9, deviation / 12).toFixed(1)}%`,
    averageSpeedComparison: `${CALL_TEST_HISTORY_BASELINE.averageSpeed.toFixed(1)}节 / ${metrics.averageSpeed}`,
    versionComparison: `相同（${CALL_TEST_HISTORY_BASELINE.version}）`,
    inputDifference: source === "history" ? "无" : "有",
  };
};

export const createInitialSteps = (): CallTestStep[] => CALL_TEST_STEP_DEFINITIONS.map((step) => ({ ...step, status: "pending" }));
export const selectFailureScenario = (): CallTestFailureScenario => {
  const scenario = randomItem(CALL_TEST_FAILURE_SCENARIOS);
  return { ...scenario, mockContext: { ...scenario.mockContext } };
};
export const createStepDelay = (): number => Math.round(randomBetween(500, 800));
// 演示汇报：执行测试固定为 100% 成功，不再按 90% 概率随机失败
export const createRunSuccess = (): boolean => true;
export const createLogEntry = (
  step: CallTestStepId | "system",
  level: CallTestLogEntry["level"],
  message: string,
  extras: Partial<Pick<CallTestLogEntry, "errorCode" | "context">> = {},
): CallTestLogEntry => ({ id: `${Date.now()}-${Math.floor(randomBetween(1000, 9999))}`, timestamp: formatTimestamp(), step, level, message, ...extras });
