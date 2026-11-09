export type CallTestInputSource = "current" | "history" | "custom";
export type CallTestRunStatus = "idle" | "running" | "success" | "failed";
export type CallTestStepId = "validation" | "service" | "model" | "output";
export type CallTestStepStatus = "pending" | "running" | "success" | "failed";
export type CallTestLogLevel = "INFO" | "SUCCESS" | "WARNING" | "ERROR";
export type CallTestServiceStatus = "已注册" | "在线" | "维护中" | "连接失败";
export type CallTestHealthStatus = "未检查" | "正常" | "异常";

export interface CallTestFunctionProfile {
  behaviorType: string;
  mountedFunction: string;
  implementationMode: string;
  mcpService: string;
  toolName: string;
  version: string;
  serviceStatus: CallTestServiceStatus;
  healthStatus: CallTestHealthStatus;
  sandboxName: string;
  outputType: string;
}

export interface CallTestInput {
  startGrid: string;
  longitude: number;
  latitude: number;
  heading: number;
  speedKnots: number;
  predictionHours: number;
  pointIntervalMinutes: number;
  recentTrackPoints: number;
  envDataVersion: string;
  modelConfig: string;
  sourceExecutionId?: string;
}

export interface CallTestServiceCheckResult {
  success: boolean;
  serviceStatus: CallTestServiceStatus;
  healthStatus: CallTestHealthStatus;
  checkedAt: string;
  message: string;
  errorCode?: string;
}

export interface CallTestStep {
  id: CallTestStepId;
  index: number;
  name: string;
  status: CallTestStepStatus;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  message?: string;
}

export interface CallTestHistoricalPoint {
  index: number;
  longitude: number;
  latitude: number;
}

export interface CallTestTrajectoryPoint {
  index: number;
  isoTime: string;
  displayTime: string;
  minutesFromStart: number;
  longitude: number;
  latitude: number;
  speedKnots: number;
  heading: number;
  errorRadiusNm: number;
  isHourlyNode: boolean;
}

export interface CallTestMetrics {
  endGrid: string;
  endpoint: string;
  predictedHeading: string;
  averageSpeed: string;
  confidence: number;
  riskOverlap: string;
  outputPointCount: number;
  writeBackFieldCount: number;
}

export interface CallTestFailureScenario {
  errorCode: string;
  failedStep: CallTestStepId;
  summary: string;
  detail: string;
  suggestion: string;
  mockContext: Readonly<Record<string, string | number>>;
}

export interface CallTestLogEntry {
  id: string;
  timestamp: string;
  level: CallTestLogLevel;
  step: CallTestStepId | "system";
  message: string;
  errorCode?: string;
  context?: Readonly<Record<string, string | number | boolean>>;
}

export interface CallTestSummary {
  testId: string;
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  outputType: string;
  outputPointCount?: number;
  confidence?: number;
  writeBackStatus?: "未写回" | "写回成功";
  failureReason?: string;
}

export interface CallTestHistoryBaseline {
  executionId: string;
  confidence: number;
  endGrid: string;
  averageSpeed: number;
  endpointLongitude: number;
  endpointLatitude: number;
  version: string;
  inputSource: string;
}

export interface CallTestHistoryComparison {
  historicalConfidence: string;
  currentConfidence: string;
  endpointDeviation: string;
  trajectoryDifference: string;
  averageSpeedComparison: string;
  versionComparison: string;
  inputDifference: string;
}

export interface CallTestRunResult {
  status: Extract<CallTestRunStatus, "success" | "failed">;
  summary: CallTestSummary;
  steps: readonly CallTestStep[];
  trajectory: readonly CallTestTrajectoryPoint[];
  metrics: CallTestMetrics | null;
  logs: readonly CallTestLogEntry[];
  failure: CallTestFailureScenario | null;
}

export interface CallTestValidationResult {
  valid: boolean;
  message: string;
}
