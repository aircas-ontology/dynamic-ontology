import type { PowerExecutionRecord, PowerExecutionStatistics } from "@/types/entityBrowsingDeweyBehavior";

/** 杜威号动力层行为 · 静态执行记录（无接口）。 */

const SUCCESS_LOGO =
  "data:image/svg+xml," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="7" fill="%233ecf8e"/></svg>');

const FAIL_LOGO =
  "data:image/svg+xml," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="7" fill="%23f06666"/></svg>');

/**
 * @description 按挂载函数生成静态执行记录列表。
 * @param mountedFunction 挂载函数。
 * @param instanceName 行为名称。
 * @returns 统计与记录。
 */
export function createDeweyBehaviorExecutionData(
  mountedFunction: string,
  instanceName: string,
): { statistics: PowerExecutionStatistics; records: PowerExecutionRecord[] } {
  const records: PowerExecutionRecord[] = [
    {
      executionId: `EXEC-${mountedFunction}-001`,
      time: "2026-08-14 15:35:12",
      trigger: "状态变化触发",
      inputDescription: `${instanceName} · 自动触发`,
      version: "v1.0.0",
      duration: 2.48,
      remark: "静态样例",
      status: "success",
      logo: SUCCESS_LOGO,
      detail: {
        executionId: `EXEC-${mountedFunction}-001`,
        inputDescription: `${instanceName} · 自动触发`,
        duration: 2.48,
        status: "success",
        logo: SUCCESS_LOGO,
        outputSummary: `${instanceName}执行成功（静态 Mock）`,
      },
    },
    {
      executionId: `EXEC-${mountedFunction}-002`,
      time: "2026-08-13 09:18:40",
      trigger: "手动调用",
      inputDescription: `${instanceName} · 调用测试`,
      version: "v1.0.0",
      duration: 1.92,
      remark: "静态样例",
      status: "success",
      logo: SUCCESS_LOGO,
      detail: {
        executionId: `EXEC-${mountedFunction}-002`,
        inputDescription: `${instanceName} · 调用测试`,
        duration: 1.92,
        status: "success",
        logo: SUCCESS_LOGO,
        outputSummary: `${instanceName}手动调用成功（静态 Mock）`,
      },
    },
    {
      executionId: `EXEC-${mountedFunction}-003`,
      time: "2026-08-11 21:04:08",
      trigger: "定时触发",
      inputDescription: `${instanceName} · 定时任务`,
      version: "v1.0.0",
      duration: null,
      remark: "超时",
      status: "failed",
      logo: FAIL_LOGO,
      detail: {
        executionId: `EXEC-${mountedFunction}-003`,
        inputDescription: `${instanceName} · 定时任务`,
        duration: null,
        status: "failed",
        logo: FAIL_LOGO,
        outputSummary: "执行超时（静态 Mock）",
      },
    },
  ];

  return {
    statistics: {
      total: records.length,
      success: records.filter((item) => item.status === "success").length,
      failed: records.filter((item) => item.status === "failed").length,
      avgDuration: 2.2,
      latestExecution: records[0]?.time ?? "",
    },
    records,
  };
}
