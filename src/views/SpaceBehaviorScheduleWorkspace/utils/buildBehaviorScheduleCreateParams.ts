import type { BehaviorScheduleDraft, CreateBehaviorScheduleParams, TestOntologyActionParams } from "@/types";

const weekdayNames: Record<string, string> = { 周一: "MON", 周二: "TUE", 周三: "WED", 周四: "THU", 周五: "FRI", 周六: "SAT", 周日: "SUN" };
const unixWeekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

/** @description 检查 Cron 基础字段的列表、范围和步长。 @param field 字段。 @param min 最小值。 @param max 最大值。 @returns 是否在范围内。 */
function isCronFieldValid(field: string, min: number, max: number): boolean {
  return field.split(",").every((part) => {
    const pieces = part.split("/");
    if (pieces.length > 2 || (pieces[1] !== undefined && (!/^\d+$/.test(pieces[1]) || Number(pieces[1]) < 1 || Number(pieces[1]) > max))) return false;
    if (pieces[0] === "*") return true;
    const bounds = (pieces[0] ?? "").split("-");
    return (
      bounds.length <= 2 &&
      bounds.every((value) => /^\d+$/.test(value) && Number(value) >= min && Number(value) <= max) &&
      (bounds.length < 2 || Number(bounds[0]) <= Number(bounds[1]))
    );
  });
}

/** @description 将标准五段或 Quartz 六七段表达式转换为七段，避免同时约束日期与星期。 @param expression 输入表达式。 @returns 七段表达式，无效时为空。 */
function normalizeScheduleCron(expression: string): string {
  let fields = expression.trim().toUpperCase().split(/\s+/);
  if (fields.length === 5) {
    const [minute = "", hour = "", day = "", month = "", weekday = ""] = fields;
    if (day !== "*" && weekday !== "*") return "";
    if (!isCronFieldValid(weekday, 0, 7)) return "";
    const selected = new Set<number>();
    for (const part of weekday.split(",")) {
      const [base = "", stepText] = part.split("/");
      const step = Number(stepText ?? 1);
      const [startText = "", endText] = base.split("-");
      const start = base === "*" ? 0 : Number(startText);
      const end = base === "*" ? 7 : endText === undefined ? (stepText === undefined ? start : 7) : Number(endText);
      for (let value = start; value <= end; value += step) selected.add(value % 7);
    }
    fields = ["0", minute, hour, weekday === "*" ? day : "?", month, weekday === "*" ? "?" : [...selected].map((value) => unixWeekdays[value]).join(","), "*"];
  }
  if (fields.length === 6) fields.push("*");
  if (fields.length !== 7) return "";
  const [second = "", minute = "", hour = "", day = "", month = "", weekday = "", year = ""] = fields;
  const numericMonth = month.replace(/JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC/g, (name) =>
    String(["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"].indexOf(name) + 1),
  );
  const numericWeekday = weekday.replace(/SUN|MON|TUE|WED|THU|FRI|SAT/g, (name) => String(unixWeekdays.indexOf(name) + 1));
  if (
    !isCronFieldValid(second, 0, 59) ||
    !isCronFieldValid(minute, 0, 59) ||
    !isCronFieldValid(hour, 0, 23) ||
    !isCronFieldValid(numericMonth, 1, 12) ||
    !isCronFieldValid(year, 1970, 2199)
  )
    return "";
  if (day !== "?" && !isCronFieldValid(day, 1, 31) && !/^(L|LW|L-([1-9]|[12]\d|30)|([1-9]|[12]\d|3[01])W)$/.test(day)) return "";
  if (weekday !== "?" && !isCronFieldValid(numericWeekday, 1, 7) && !/^[1-7](L|#[1-5])$/.test(numericWeekday)) return "";
  if (day === "*" && weekday === "*") fields[5] = "?";
  else if ((day === "?") === (weekday === "?")) return "";
  return fields.join(" ");
}

/** @description 将已校验行为参数与周期配置组装为创建请求，不包含界面快照。 @param draft 调度草稿。 @param ontologyIdentifier 挂载本体标识。 @param behaviorRequest 完整行为执行参数。 @returns 创建参数或可展示错误。 */
export function buildBehaviorScheduleCreateParams(
  draft: BehaviorScheduleDraft,
  ontologyIdentifier: string,
  behaviorRequest: TestOntologyActionParams,
): { ok: true; request: CreateBehaviorScheduleParams } | { ok: false; error: string } {
  if (!ontologyIdentifier.trim()) return { ok: false, error: "行为缺少所属本体标识，请重新选择行为" };
  if (!draft.name.trim() || !draft.behaviorActionApi || draft.behaviorActionApi !== behaviorRequest.actionApi)
    return { ok: false, error: "调度名称或行为参数不匹配" };
  let cron = "";
  if (draft.periodKind === "Cron") cron = normalizeScheduleCron(draft.cronExpression);
  else {
    const time = /^(\d{2}):(\d{2}):(\d{2})$/.exec(draft.executeTime);
    if (!time) return { ok: false, error: "请选择有效执行时间" };
    const hour = Number(time[1]);
    const minute = Number(time[2]);
    const second = Number(time[3]);
    if (hour > 23 || minute > 59 || second > 59) return { ok: false, error: "请选择有效执行时间" };
    if (draft.periodKind === "每天") cron = `${second} ${minute} ${hour} * * ? *`;
    if (draft.periodKind === "每周" && draft.weekdays.length && draft.weekdays.every((day) => weekdayNames[day]))
      cron = `${second} ${minute} ${hour} ? * ${[...new Set(draft.weekdays)].map((day) => weekdayNames[day]).join(",")} *`;
    if (draft.periodKind === "每月" && draft.monthDay !== null && Number.isInteger(draft.monthDay) && draft.monthDay >= 1 && draft.monthDay <= 31)
      cron = `${second} ${minute} ${hour} ${draft.monthDay} * ? *`;
  }
  if (!cron) return { ok: false, error: "请检查执行周期或 Cron 表达式，日期与星期不可同时约束" };
  return {
    ok: true,
    request: {
      ontologyIdentifier: ontologyIdentifier.trim(),
      actionApi: draft.behaviorActionApi,
      name: draft.name.trim(),
      description: draft.description,
      type: "TASK",
      task: { taskCronExpression: cron, entityJson: JSON.stringify(behaviorRequest) },
    },
  };
}
