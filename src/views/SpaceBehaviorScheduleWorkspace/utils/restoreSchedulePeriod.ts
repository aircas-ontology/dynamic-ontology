import type { BehaviorScheduleDraft, BehaviorSchedulePeriodKind, BehaviorScheduleWeekday } from "@/types";

type PeriodFields = Pick<BehaviorScheduleDraft, "periodKind" | "weekdays" | "monthDay" | "executeTime" | "cronExpression">;
const periodKinds: Readonly<Record<string, BehaviorSchedulePeriodKind>> = {
  DAILY: "每天",
  WEEKLY: "每周",
  MONTHLY: "每月",
  CRON: "Cron",
  每天: "每天",
  每周: "每周",
  每月: "每月",
  Cron: "Cron",
};
const weekdayValues: Readonly<Record<string, BehaviorScheduleWeekday>> = {
  SUN: "周日",
  MON: "周一",
  TUE: "周二",
  WED: "周三",
  THU: "周四",
  FRI: "周五",
  SAT: "周六",
  "1": "周日",
  "2": "周一",
  "3": "周二",
  "4": "周三",
  "5": "周四",
  "6": "周五",
  "7": "周六",
};

/** @description 按保存的周期类型恢复页面输入，不能无损表示时回退Cron原文，避免编辑丢失限制。 @param periodType 接口周期类型，兼容历史中文值。 @param expression 保存的Cron表达式。 @returns 周期配置字段。 */
export function restoreSchedulePeriod(periodType: string | null | undefined, expression: string): PeriodFields {
  const fallback: PeriodFields = { periodKind: "Cron", weekdays: [], monthDay: null, executeTime: "", cronExpression: expression };
  const kind = periodKinds[periodType?.trim() ?? ""];
  if (!kind || kind === "Cron") return fallback;
  const fields = expression.trim().toUpperCase().split(/\s+/);
  if (fields.length === 6) fields.push("*");
  if (fields.length !== 7) return fallback;
  const [second = "", minute = "", hour = "", day = "", month = "", weekday = "", year = ""] = fields;
  if (
    !/^\d{1,2}$/.test(second) ||
    Number(second) > 59 ||
    !/^\d{1,2}$/.test(minute) ||
    Number(minute) > 59 ||
    !/^\d{1,2}$/.test(hour) ||
    Number(hour) > 23 ||
    month !== "*" ||
    year !== "*"
  )
    return fallback;
  const executeTime = [hour, minute, second].map((value) => value.padStart(2, "0")).join(":");
  if (kind === "每天" && (day === "*" || day === "1/1") && weekday === "?") return { ...fallback, periodKind: kind, executeTime };
  if (kind === "每月" && /^\d{1,2}$/.test(day) && Number(day) >= 1 && Number(day) <= 31 && weekday === "?")
    return { ...fallback, periodKind: kind, executeTime, monthDay: Number(day) };
  if (kind === "每周" && day === "?") {
    const weekdays: BehaviorScheduleWeekday[] = [];
    for (const value of weekday.split(",")) {
      const selected = weekdayValues[value];
      if (!selected) return fallback;
      if (!weekdays.includes(selected)) weekdays.push(selected);
    }
    return { ...fallback, periodKind: kind, executeTime, weekdays };
  }
  return fallback;
}
