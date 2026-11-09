import { onBeforeUnmount, ref } from "vue";
import type {
  CallTestFailureScenario,
  CallTestInput,
  CallTestInputSource,
  CallTestLogEntry,
  CallTestMetrics,
  CallTestRunStatus,
  CallTestStep,
  CallTestStepId,
  CallTestSummary,
  CallTestTrajectoryPoint,
} from "@/types";
import {
  CALL_TEST_FUNCTION_PROFILE,
  createCallTestMetrics,
  createInitialSteps,
  createLogEntry,
  createRunSuccess,
  createStepDelay,
  createTestId,
  createTrajectoryResult,
  selectFailureScenario,
  validateCallTestInput,
} from "@/mocks/entityBrowsingDeweyBehavior/deweyCallTestMock";

const STEP_SUCCESS_MESSAGES: Readonly<Record<CallTestStepId, string>> = {
  validation: "输入参数及业务约束校验通过",
  service: "MCP 服务连接及 Tool 能力确认完成",
  model: "模型推理完成并生成 13 个预测点",
  output: "输出结构、时间序列及坐标范围校验通过",
};

export const useCallTestExecution = () => {
  const status = ref<CallTestRunStatus>("idle");
  const steps = ref<CallTestStep[]>(createInitialSteps());
  const summary = ref<CallTestSummary | null>(null);
  const trajectory = ref<CallTestTrajectoryPoint[]>([]);
  const metrics = ref<CallTestMetrics | null>(null);
  const logs = ref<CallTestLogEntry[]>([]);
  const failure = ref<CallTestFailureScenario | null>(null);
  const activeTimers = new Map<ReturnType<typeof setTimeout>, (active: boolean) => void>();
  let executionToken = 0;

  const appendLog = (entry: CallTestLogEntry): void => {
    logs.value = [...logs.value, entry];
  };

  const wait = (milliseconds: number, token: number): Promise<boolean> =>
    new Promise((resolve) => {
      const timer = setTimeout(() => {
        activeTimers.delete(timer);
        resolve(token === executionToken);
      }, milliseconds);
      activeTimers.set(timer, resolve);
    });

  const updateStep = (id: CallTestStepId, patch: Partial<CallTestStep>): void => {
    steps.value = steps.value.map((step) => (step.id === id ? { ...step, ...patch } : { ...step }));
  };

  const finishFailedRun = (scenario: CallTestFailureScenario, startedAt: Date): void => {
    const completedAt = new Date();
    status.value = "failed";
    failure.value = { ...scenario, mockContext: { ...scenario.mockContext } };
    summary.value = summary.value
      ? {
          ...summary.value,
          completedAt: completedAt.toISOString(),
          durationSeconds: Number(((completedAt.getTime() - startedAt.getTime()) / 1000).toFixed(2)),
          failureReason: scenario.summary,
        }
      : null;
    appendLog(createLogEntry(scenario.failedStep, "ERROR", scenario.detail, { errorCode: scenario.errorCode, context: scenario.mockContext }));
    appendLog(createLogEntry("system", "WARNING", `建议：${scenario.suggestion}`));
    appendLog(createLogEntry("system", "ERROR", "测试已终止，后续步骤未执行"));
  };

  const execute = async (input: CallTestInput, source: CallTestInputSource, writeBack: boolean, serviceHealthy: boolean): Promise<boolean> => {
    executionToken += 1;
    const token = executionToken;
    const startedAt = new Date();
    const testId = createTestId(startedAt);
    status.value = "running";
    steps.value = createInitialSteps();
    trajectory.value = [];
    metrics.value = null;
    logs.value = [createLogEntry("system", "INFO", `创建测试任务 ${testId}`), createLogEntry("system", "INFO", `读取输入来源：${source}`)];
    failure.value = null;
    summary.value = { testId, startedAt: startedAt.toISOString(), outputType: CALL_TEST_FUNCTION_PROFILE.outputType };

    const validation = validateCallTestInput(input);
    updateStep("validation", { status: "running", startedAt: new Date().toISOString() });
    appendLog(createLogEntry("validation", "INFO", "开始校验输入结构和业务参数"));
    const validationDelay = createStepDelay();
    if (!(await wait(validationDelay, token))) return false;
    if (!validation.valid) {
      updateStep("validation", { status: "failed", completedAt: new Date().toISOString(), durationMs: validationDelay, message: validation.message });
      const scenario: CallTestFailureScenario = {
        errorCode: "INPUT_VALIDATION_FAILED",
        failedStep: "validation",
        summary: validation.message,
        detail: validation.message,
        suggestion: "修正输入参数后重新执行。",
        mockContext: { source },
      };
      status.value = "failed";
      failure.value = scenario;
      summary.value = { ...summary.value, completedAt: new Date().toISOString(), durationSeconds: validationDelay / 1000, failureReason: validation.message };
      appendLog(createLogEntry("validation", "ERROR", validation.message, { errorCode: scenario.errorCode }));
      return false;
    }
    updateStep("validation", { status: "success", completedAt: new Date().toISOString(), durationMs: validationDelay, message: validation.message });
    appendLog(createLogEntry("validation", "SUCCESS", "参数结构校验通过"));
    appendLog(
      createLogEntry("validation", "SUCCESS", "参数业务校验通过", {
        context: { trackPoints: input.recentTrackPoints, predictionHours: input.predictionHours },
      }),
    );

    if (!serviceHealthy) {
      const scenario: CallTestFailureScenario = {
        errorCode: "SERVICE_NOT_READY",
        failedStep: "service",
        summary: "服务尚未通过健康检查",
        detail: "执行前未确认 MCP 服务处于在线状态。",
        suggestion: "先点击检查服务。",
        mockContext: { service: CALL_TEST_FUNCTION_PROFILE.mcpService },
      };
      updateStep("service", {
        status: "failed",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 0,
        message: scenario.summary,
      });
      finishFailedRun(scenario, startedAt);
      return false;
    }

    const shouldSucceed = createRunSuccess();
    const selectedFailure = shouldSucceed ? null : selectFailureScenario();
    const executionSteps: readonly CallTestStepId[] = ["service", "model", "output"];
    for (const stepId of executionSteps) {
      const stepStartedAt = new Date();
      updateStep(stepId, { status: "running", startedAt: stepStartedAt.toISOString() });
      if (stepId === "service") {
        appendLog(createLogEntry(stepId, "INFO", `检查 ${CALL_TEST_FUNCTION_PROFILE.mcpService} 服务状态`));
        appendLog(createLogEntry(stepId, "INFO", `调用 Tool：${CALL_TEST_FUNCTION_PROFILE.toolName}`));
      } else if (stepId === "model") {
        appendLog(createLogEntry(stepId, "INFO", `加载环境数据 ${input.envDataVersion}`));
        appendLog(createLogEntry(stepId, "INFO", `加载最近轨迹点：${input.recentTrackPoints} 个`));
        appendLog(createLogEntry(stepId, "INFO", "模型推理开始"));
      } else {
        appendLog(createLogEntry(stepId, "INFO", "开始校验输出结构和时间序列"));
      }
      const delay = createStepDelay();
      if (!(await wait(delay, token))) return false;
      if (selectedFailure?.failedStep === stepId) {
        updateStep(stepId, { status: "failed", completedAt: new Date().toISOString(), durationMs: delay, message: selectedFailure.summary });
        finishFailedRun(selectedFailure, startedAt);
        return false;
      }
      updateStep(stepId, { status: "success", completedAt: new Date().toISOString(), durationMs: delay, message: STEP_SUCCESS_MESSAGES[stepId] });
      appendLog(createLogEntry(stepId, "SUCCESS", STEP_SUCCESS_MESSAGES[stepId]));
    }

    const generatedTrajectory = createTrajectoryResult(input, startedAt);
    const generatedMetrics = createCallTestMetrics(generatedTrajectory, writeBack);
    const completedAt = new Date();
    trajectory.value = generatedTrajectory.map((point) => ({ ...point }));
    metrics.value = { ...generatedMetrics };
    status.value = "success";
    summary.value = {
      ...summary.value,
      completedAt: completedAt.toISOString(),
      durationSeconds: Number(((completedAt.getTime() - startedAt.getTime()) / 1000).toFixed(2)),
      outputPointCount: generatedTrajectory.length,
      confidence: generatedMetrics.confidence,
      writeBackStatus: writeBack ? "写回成功" : "未写回",
    };
    appendLog(createLogEntry("model", "SUCCESS", `生成预测轨迹：${generatedTrajectory.length} 个点`));
    appendLog(createLogEntry("output", "SUCCESS", "误差包络与结果指标计算完成"));
    appendLog(createLogEntry("output", writeBack ? "SUCCESS" : "INFO", writeBack ? "已模拟写回预测位置、预测路线和预测置信度" : "沙箱模式：未写回原本体实例"));
    appendLog(createLogEntry("system", "SUCCESS", "调用测试执行完成"));
    return true;
  };

  const reset = (): void => {
    executionToken += 1;
    activeTimers.forEach((resolve, timer) => {
      clearTimeout(timer);
      resolve(false);
    });
    activeTimers.clear();
    status.value = "idle";
    steps.value = createInitialSteps();
    summary.value = null;
    trajectory.value = [];
    metrics.value = null;
    logs.value = [];
    failure.value = null;
  };

  onBeforeUnmount(reset);
  return { status, steps, summary, trajectory, metrics, logs, failure, execute, reset };
};
