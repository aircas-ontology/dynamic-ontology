import type { BehaviorTreeNodeExecDraft, PostOntologyActionTreeTestParams } from "@/types";
import { createBehaviorTreeNodeExecDraft } from "@/utils/behaviorTreeExecutePlan";

/**
 * @description 判断未知值是否为普通对象。
 * @param value 未知值。
 * @returns 是否为对象记录。
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @description 将未知主键格式化为输入框文本。
 * @param value 主键。
 * @returns 展示文本。
 */
function formatPrimaryKeyText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (value == null) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

/**
 * @description 将已保存的行为树试跑请求回填到执行面板草稿；格式无效时返回错误文案。
 * @param payload 试跑请求或 JSON 字符串。
 * @param treeApi 当前行为树 api。
 * @param spaceId 当前空间。
 * @param drafts 面板草稿容器。
 * @returns 错误文案；成功为空字符串。
 */
export function hydrateScheduleTreeParameters(
  payload: unknown,
  treeApi: string,
  spaceId: string,
  drafts: {
    externalInputDraft: Record<string, string>;
    blackboardObjectKeys: Record<string, string>;
    nodeDrafts: Record<string, BehaviorTreeNodeExecDraft>;
  },
): string {
  let request: unknown = payload;
  if (typeof payload === "string") {
    try {
      request = JSON.parse(payload);
    } catch {
      return "已保存的行为树参数 JSON 格式无效";
    }
  }
  if (!isRecord(request)) return "已保存的行为树参数必须为对象";
  if (String(request.treeApi ?? "") !== treeApi.trim()) return "已保存参数与当前行为不匹配";
  if (Number(request.ontologySpaceId) !== Number(spaceId)) return "已保存参数与当前空间不匹配";

  for (const key of Object.keys(drafts.externalInputDraft)) delete drafts.externalInputDraft[key];
  for (const key of Object.keys(drafts.blackboardObjectKeys)) delete drafts.blackboardObjectKeys[key];
  for (const key of Object.keys(drafts.nodeDrafts)) delete drafts.nodeDrafts[key];

  if (isRecord(request.inputs)) {
    for (const [key, value] of Object.entries(request.inputs)) {
      drafts.externalInputDraft[key] = typeof value === "string" ? value : formatPrimaryKeyText(value);
    }
  }
  if (isRecord(request.entityPrimaryKeys)) {
    for (const [objectId, value] of Object.entries(request.entityPrimaryKeys)) {
      drafts.blackboardObjectKeys[objectId] = formatPrimaryKeyText(value);
    }
  }
  if (isRecord(request.nodeExecutes)) {
    for (const [nodeId, raw] of Object.entries(request.nodeExecutes)) {
      if (!isRecord(raw)) continue;
      const draft = createBehaviorTreeNodeExecDraft();
      if (isRecord(raw.params)) {
        for (const [key, value] of Object.entries(raw.params)) {
          draft.params[key] = typeof value === "string" ? value : formatPrimaryKeyText(value);
        }
      }
      if (isRecord(raw.entityPrimaryKeys)) {
        for (const [key, value] of Object.entries(raw.entityPrimaryKeys)) {
          draft.entityPrimaryKeys[key] = formatPrimaryKeyText(value);
        }
      }
      if (raw.entityPrimaryKey != null && raw.entityPrimaryKey !== "") {
        draft.entityPrimaryKeys.self = formatPrimaryKeyText(raw.entityPrimaryKey);
      }
      if (isRecord(raw.inputParams)) {
        for (const [key, value] of Object.entries(raw.inputParams)) {
          if (Array.isArray(value)) {
            const records = value.filter(isRecord);
            const entityPrimaryKey = records.length ? formatPrimaryKeyText(records[0]?.entityPrimaryKey) : "";
            const rowKeys = records
              .map((item) => {
                if (!isRecord(item.dataPrimaryKeys)) return "";
                const first = Object.values(item.dataPrimaryKeys)[0];
                return formatPrimaryKeyText(first);
              })
              .filter(Boolean);
            draft.inputParams[key] = {
              entityPrimaryKey,
              entityPrimaryKeys: entityPrimaryKey ? [entityPrimaryKey] : [],
              rows: {},
              rowKeys,
            };
            continue;
          }
          if (!isRecord(value)) continue;
          const entityPrimaryKey = formatPrimaryKeyText(value.entityPrimaryKey);
          const rowKeys: string[] = [];
          const rows: Record<string, string> = {};
          if (isRecord(value.dataPrimaryKeys)) {
            for (const [group, row] of Object.entries(value.dataPrimaryKeys)) {
              const text = formatPrimaryKeyText(row);
              if (!group.trim() || !text) continue;
              rows[group.trim()] = text;
              rowKeys.push(text);
            }
          }
          draft.inputParams[key] = {
            entityPrimaryKey,
            entityPrimaryKeys: entityPrimaryKey ? [entityPrimaryKey] : [],
            rows,
            rowKeys,
          };
        }
      }
      if (isRecord(raw.outputParams)) {
        for (const [key, value] of Object.entries(raw.outputParams)) {
          if (!isRecord(value)) continue;
          draft.outputParams[key] = {
            entityPrimaryKey: formatPrimaryKeyText(value.entityPrimaryKey),
            rowKey: "",
          };
        }
      }
      drafts.nodeDrafts[nodeId] = draft;
    }
  }
  return "";
}

/**
 * @description 收窄未知值为行为树试跑请求。
 * @param value 未知值。
 * @returns 请求或 null。
 */
export function asScheduleTreeTestParams(value: unknown): PostOntologyActionTreeTestParams | null {
  if (!isRecord(value) || typeof value.treeApi !== "string" || value.ontologySpaceId == null || value.ontologySpaceId === "") return null;
  return value as unknown as PostOntologyActionTreeTestParams;
}
