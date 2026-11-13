import type { BehaviorTreeValueType } from "@/types";

/**
 * @description 将文本按黑板值类型解析为运行时值。
 * @param raw 原始文本。
 * @param type 值类型。
 * @returns 解析结果。
 */
export function parseBehaviorTreeTypedValue(raw: string | null | undefined, type: BehaviorTreeValueType | string): { ok: boolean; value: unknown } {
  const value = String(raw ?? "").trim();
  try {
    switch (type) {
      case "STRING":
      case "CHAR":
      case "DATE":
        return { ok: true, value };
      case "INTEGER":
      case "SHORT":
      case "BYTE": {
        if (!/^[-+]?\d+$/.test(value)) return { ok: false, value: null };
        const n = Number.parseInt(value, 10);
        return Number.isSafeInteger(n) ? { ok: true, value: n } : { ok: false, value: null };
      }
      case "LONG": {
        if (!/^[-+]?\d+$/.test(value)) return { ok: false, value: null };
        const n = Number(value);
        return Number.isFinite(n) ? { ok: true, value: n } : { ok: false, value: null };
      }
      case "FLOAT":
      case "DOUBLE": {
        const n = Number(value);
        return Number.isFinite(n) ? { ok: true, value: n } : { ok: false, value: null };
      }
      case "BOOL": {
        if (/^true$/i.test(value)) return { ok: true, value: true };
        if (/^false$/i.test(value)) return { ok: true, value: false };
        return { ok: false, value: null };
      }
      case "LIST": {
        try {
          const parsed: unknown = JSON.parse(value);
          if (Array.isArray(parsed)) return { ok: true, value: parsed };
        } catch {
          /* 逗号分隔 */
        }
        return {
          ok: true,
          value: value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        };
      }
      case "OBJECT": {
        try {
          const parsed: unknown = JSON.parse(value);
          return parsed && typeof parsed === "object" ? { ok: true, value: parsed } : { ok: false, value: null };
        } catch {
          return { ok: false, value: null };
        }
      }
      default:
        return { ok: true, value };
    }
  } catch {
    return { ok: false, value: null };
  }
}

/**
 * @description 将运行时值转为表单文本。
 * @param value 运行时值。
 * @returns 文本。
 */
export function behaviorTreeValueToText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * @description 解析可空整数。
 * @param value 原始值。
 * @returns 整数或 null。
 */
export function behaviorTreeIntOrNull(value: unknown): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isInteger(n) ? n : null;
}

/**
 * @description 空串转 null。
 * @param value 原始文本。
 * @returns 去空白后空则为 null。
 */
export function behaviorTreeEmptyToNull(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text ? text : null;
}
