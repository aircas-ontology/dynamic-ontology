import type { OntologySpaceDraft, OntologySpaceItem, OntologySpaceSortOrder } from "@/types";

/** 查询展示数据，排序和分页均不修改数据源。 */
export function filterSpaces(spaces: OntologySpaceItem[], keyword: string, order: OntologySpaceSortOrder, page: number, pageSize: number) {
  const query = keyword.trim().toLocaleLowerCase();
  const matches = spaces.filter(space => `${space.displayName} ${space.apiName}`.toLocaleLowerCase().includes(query));
  matches.sort((a, b) => (order === "asc" ? 1 : -1) * a.displayName.localeCompare(b.displayName, "zh-CN"));
  const size = Math.max(1, Math.floor(pageSize));
  const current = Math.max(1, Math.min(page, Math.ceil(matches.length / size) || 1));
  return { items: matches.slice((current - 1) * size, current * size), total: matches.length, page: current };
}

export function validateSpace(draft: OntologySpaceDraft): OntologySpaceDraft {
  const value = { ...draft, apiName: draft.apiName.trim(), displayName: draft.displayName.trim(), description: draft.description.trim() };
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]{0,62}$/.test(value.apiName)) throw new Error("API 名称须以字母、下划线或 $ 开头，长度不超过 63 字符。");
  if (!value.displayName || value.displayName.length > 64) throw new Error("空间名称须为 1–64 个字符。");
  if (value.description.length > 256) throw new Error("空间描述不能超过 256 个字符。");
  if (value.iconUrl && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value.iconUrl)) {
    throw new Error("导入图标须为 PNG、JPEG 或 WEBP 的内嵌图片。");
  }
  return value;
}

/** 演示数据只驻留内存，使用固定时间保证可重复。 */
export function saveSpace(spaces: OntologySpaceItem[], draft: OntologySpaceDraft, id?: string): OntologySpaceItem[] {
  // 原有打包资源地址来自受控 Mock，可在编辑时保留。
  const existing = spaces.find(space => space.id === id);
  const value = validateSpace({ ...draft, iconUrl: existing?.iconUrl === draft.iconUrl ? "" : draft.iconUrl });
  value.iconUrl = draft.iconUrl;
  if (id && !existing) throw new Error("空间不存在，请刷新后重试。");
  if (spaces.some(space => space.apiName === value.apiName && space.id !== id)) throw new Error("API 名称已存在。");
  if (existing) return spaces.map(space => space.id === id ? { ...space, ...value, updatedAt: "2026-09-15 12:00" } : space);
  const item: OntologySpaceItem = {
    ...value, id: `mock-${value.apiName}`, category: "自定义", createdBy: "访客",
    createdAt: "2026-09-15 12:00", updatedAt: "2026-09-15 12:00",
    metrics: { ontology: 0, behavior: 0, relation: 0, rule: 0, source: 0 },
    isSubspace: false, parentSpaceDisplayName: "",
  };
  return [...spaces, item];
}

export function removeSpace(spaces: OntologySpaceItem[], id: string): OntologySpaceItem[] {
  if (!spaces.some(space => space.id === id)) throw new Error("空间不存在。");
  return spaces.filter(space => space.id !== id);
}

/** JSON 输入在边界按 unknown 校验，避免直接信任导入文件。 */
export function parseSpaceImport(text: string): OntologySpaceDraft {
  const data: unknown = JSON.parse(text);
  if (!data || typeof data !== "object" || !("ontologySpace" in data)) throw new Error("JSON 缺少 ontologySpace。");
  const space = data.ontologySpace;
  if (!space || typeof space !== "object" || !("apiName" in space) || typeof space.apiName !== "string" || !("displayName" in space) || typeof space.displayName !== "string") throw new Error("JSON 空间名称或 API 名称无效。");
  const description = "description" in space ? space.description : "";
  const iconUrl = "iconUrl" in space ? space.iconUrl : "";
  if (typeof description !== "string" || typeof iconUrl !== "string") throw new Error("JSON 描述或图标格式无效。");
  return validateSpace({ apiName: space.apiName, displayName: space.displayName, description, iconUrl });
}

/** 导出演示空间基本信息；不声称包含尚未接入的对象和实体。 */
export function serializeSpace(space: OntologySpaceDraft): string {
  return JSON.stringify({ ontologySpace: { apiName: space.apiName, displayName: space.displayName, description: space.description, iconUrl: space.iconUrl.startsWith("data:") ? space.iconUrl : "" } }, null, 2);
}
