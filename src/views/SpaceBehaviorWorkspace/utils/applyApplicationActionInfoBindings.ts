import type {
  GetOntologyActionInfoFunctionParam,
  GetOntologyActionInfoMappingIn,
  SpaceBehaviorApplicationInputBinding,
  SpaceBehaviorApplicationInputSourceType,
  SpaceBehaviorApplicationOutputBinding,
  SpaceBehaviorApplicationOutputMode,
} from "@/types";
import type { ApplicationFunctionParamRow } from "./flattenApplicationFunctionParamRows.ts";

/** 应用行为详情 mappingIns 回填种子。 */
export interface SpaceBehaviorApplicationBindingSeed {
  category: "INPUT" | "OUTPUT";
  functionParamId: number | null;
  parameterName: string;
  paramPath: string;
  inputBinding?: SpaceBehaviorApplicationInputBinding;
  outputBinding?: SpaceBehaviorApplicationOutputBinding;
}

/**
 * @description 判断 mappingIns 行属于入参还是出参。
 * @param item mapping 行。
 * @param functionParam 对应函数参数定义。
 * @returns INPUT 或 OUTPUT。
 */
export function resolveApplicationMappingCategory(
  item: GetOntologyActionInfoMappingIn,
  functionParam: GetOntologyActionInfoFunctionParam | null,
): "INPUT" | "OUTPUT" {
  const rawCategory = (item.category ?? "").trim().toUpperCase();
  if (rawCategory === "OUTPUT") return "OUTPUT";
  if (rawCategory === "INPUT") return "INPUT";
  const paramCategory = (functionParam?.category ?? "").trim().toUpperCase();
  if (paramCategory === "OUTPUT") return "OUTPUT";
  if (paramCategory === "INPUT") return "INPUT";
  const expression = (item.functionParamExpression ?? "").trim();
  const outputMode = (item.outputMode ?? "").trim().toUpperCase();
  if (expression || outputMode === "WRITE_PROPERTY" || outputMode === "RESULT_ONLY") return "OUTPUT";
  return "INPUT";
}

/**
 * @description 收窄入参 sourceType。
 * @param value 详情来源。
 * @returns PROPERTY / FIXED / EXTERNAL。
 */
function mapApplicationInputSourceType(value: string | null | undefined): SpaceBehaviorApplicationInputSourceType {
  const normalized = (value ?? "").trim().toUpperCase();
  if (normalized === "FIXED") return "FIXED";
  if (normalized === "EXTERNAL") return "EXTERNAL";
  return "PROPERTY";
}

/**
 * @description 收窄出参 outputMode。
 * @param item mapping 行。
 * @returns RESULT_ONLY / WRITE_PROPERTY。
 */
function mapApplicationOutputMode(item: GetOntologyActionInfoMappingIn): SpaceBehaviorApplicationOutputMode {
  const outputMode = (item.outputMode ?? "").trim().toUpperCase();
  if (outputMode === "WRITE_PROPERTY") return "WRITE_PROPERTY";
  if (outputMode === "RESULT_ONLY") return "RESULT_ONLY";
  if ((item.propertyUniqueIdentifier ?? "").trim() || (item.functionParamExpression ?? "").trim()) return "WRITE_PROPERTY";
  return "RESULT_ONLY";
}

/**
 * @description 将详情 mappingIns 转为编辑回填种子。
 * @param mappingIns 详情绑定列表。
 * @param functionParams 详情函数参数定义。
 * @returns 入出参种子列表。
 */
export function mapApplicationActionInfoBindingSeeds(
  mappingIns: GetOntologyActionInfoMappingIn[] | null | undefined,
  functionParams: GetOntologyActionInfoFunctionParam[] | null | undefined,
): SpaceBehaviorApplicationBindingSeed[] {
  const params = Array.isArray(functionParams) ? functionParams : [];
  const mappings = Array.isArray(mappingIns) ? mappingIns : [];
  const seeds: SpaceBehaviorApplicationBindingSeed[] = [];

  for (const item of mappings) {
    const functionParamId = typeof item.functionParamId === "number" && Number.isInteger(item.functionParamId) ? item.functionParamId : null;
    const functionParam = functionParamId === null ? null : (params.find((entry) => entry.paramId === functionParamId) ?? null);
    const category = resolveApplicationMappingCategory(item, functionParam);
    const parameterName = (item.parameterName ?? "").trim() || (functionParam?.paramName ?? "").trim();
    const paramPath = (item.paramPath ?? "").trim();
    const seed: SpaceBehaviorApplicationBindingSeed = {
      category,
      functionParamId,
      parameterName,
      paramPath,
    };

    if (category === "INPUT") {
      const sourceType = mapApplicationInputSourceType(item.sourceType);
      const sourceConfig = (item.sourceConfig ?? "").trim();
      seed.inputBinding = {
        sourceType,
        ontologyUniqueIdentifier: (item.ontologyUniqueIdentifier ?? "").trim(),
        propertyUniqueIdentifier: (item.propertyUniqueIdentifier ?? "").trim(),
        fixedValue: sourceType === "FIXED" ? sourceConfig : "",
        enableDefaultValue: sourceType === "EXTERNAL" && Boolean(sourceConfig),
        defaultValue: sourceType === "EXTERNAL" ? sourceConfig : "",
      };
    } else {
      seed.outputBinding = {
        outputMode: mapApplicationOutputMode(item),
        ontologyUniqueIdentifier: (item.ontologyUniqueIdentifier ?? "").trim(),
        propertyUniqueIdentifier: (item.propertyUniqueIdentifier ?? "").trim(),
      };
    }
    seeds.push(seed);
  }

  return seeds;
}

/**
 * @description 在扁平行中匹配详情绑定对应的参数行。
 * @param rows 入参或出参扁平行。
 * @param seed 绑定种子。
 * @returns 匹配行；未找到时为 null。
 */
export function findApplicationParamRowForBindingSeed(
  rows: ApplicationFunctionParamRow[],
  seed: Pick<SpaceBehaviorApplicationBindingSeed, "functionParamId" | "parameterName" | "paramPath">,
): ApplicationFunctionParamRow | null {
  const candidates = rows.filter((row) => !row.isObject);
  if (!candidates.length) return null;

  const withId = typeof seed.functionParamId === "number" ? candidates.filter((row) => row.functionParamId === seed.functionParamId) : candidates;
  const pool = withId.length ? withId : candidates;
  const paramPath = seed.paramPath.trim();
  const parameterName = seed.parameterName.trim();

  if (paramPath) {
    const exactPath = pool.find((row) => row.paramPath === paramPath);
    if (exactPath) return exactPath;
    const suffixPath = pool.find((row) => row.paramPath.endsWith(`.${paramPath}`) || row.fullPath === paramPath || row.fullPath.endsWith(`.${paramPath}`));
    if (suffixPath) return suffixPath;
    if (parameterName) {
      const byNameAndPath = pool.find((row) => row.paramName === parameterName && (row.paramPath === paramPath || row.paramPath.endsWith(`.${paramPath}`)));
      if (byNameAndPath) return byNameAndPath;
    }
  }

  if (parameterName) {
    const topLevel = pool.find((row) => !row.paramPath && row.paramName === parameterName);
    if (topLevel) return topLevel;
    const byName = pool.find((row) => row.paramName === parameterName);
    if (byName) return byName;
  }

  return null;
}

/**
 * @description 将详情绑定种子应用到函数详情展开后的入出参行。
 * @param seeds 绑定种子。
 * @param inputRows 入参扁平行。
 * @param outputRows 出参扁平行。
 * @returns 按 rowKey 索引的入出参绑定。
 */
export function applyApplicationActionInfoBindings(
  seeds: SpaceBehaviorApplicationBindingSeed[],
  inputRows: ApplicationFunctionParamRow[],
  outputRows: ApplicationFunctionParamRow[],
): {
  applicationInputBindings: Record<string, SpaceBehaviorApplicationInputBinding>;
  applicationOutputBindings: Record<string, SpaceBehaviorApplicationOutputBinding>;
} {
  const applicationInputBindings: Record<string, SpaceBehaviorApplicationInputBinding> = {};
  const applicationOutputBindings: Record<string, SpaceBehaviorApplicationOutputBinding> = {};

  for (const seed of seeds) {
    if (seed.category === "INPUT" && seed.inputBinding) {
      const row = findApplicationParamRowForBindingSeed(inputRows, seed);
      if (!row) continue;
      applicationInputBindings[row.rowKey] = seed.inputBinding;
      continue;
    }
    if (seed.category === "OUTPUT" && seed.outputBinding) {
      const row = findApplicationParamRowForBindingSeed(outputRows, seed);
      if (!row) continue;
      applicationOutputBindings[row.rowKey] = seed.outputBinding;
    }
  }

  return { applicationInputBindings, applicationOutputBindings };
}
