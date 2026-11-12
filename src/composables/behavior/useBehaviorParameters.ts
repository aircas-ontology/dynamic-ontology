import type {
  ApplicationInputBindingRecord,
  ApplicationOntologyEntityPicker,
  ApplicationStorageGroupEntitySlot,
  ApplicationStorageGroupPicker,
  BehaviorParameterSnapshot,
  BehaviorTestEntityDataRow,
  BehaviorTestEntityRow,
  BehaviorTestParamRow,
  OntologyEntityInfo,
  RelationMountSide,
  SpaceBehaviorActionInfoViewParamRow,
  SpaceBehaviorItem,
} from "@/types";

import { computed, reactive, ref, onScopeDispose } from "vue";
import type * as BehaviorApis from "@/apis";
import type { BuildApplicationTestRequestParamsResult } from "@/utils/behaviorParameters/buildApplicationTestRequestParams";
import { cloneBehaviorParameterSnapshot } from "@/utils/behaviorParameters/cloneBehaviorParameterSnapshot";
import { buildApplicationTestRequestParams, type ApplicationTestParamBindingSelection } from "@/utils/behaviorParameters/buildApplicationTestRequestParams";
import { coerceBehaviorTestParamValue } from "@/utils/behaviorParameters/coerceBehaviorTestParamValue";
import {
  buildApplicationOntologyPickerKey,
  buildApplicationStorageGroupPickerKey,
  collectApplicationPropertyOntologyPickers,
  collectApplicationStorageGroupPickers,
  formatApplicationInputSourceTypeLabel,
  formatApplicationOutputModeLabel,
  type ApplicationOntologyPickerSide,
} from "@/utils/behaviorParameters/collectApplicationPropertyOntologyPickers";
import { mapOntologyEntityRowDetailPageToDataRows } from "@/utils/behaviorParameters/mapOntologyEntityRowDetailToDataRows";
import { mapOntologyActionInfoToViewState } from "@/utils/behaviorParameters/mapOntologyActionInfoToViewState";
import { isMainStorageGroup, normalizeStorageGroup } from "@/utils/behaviorParameters/resolveAttributeValueSelection";
/** @description 创建独立的行为参数配置状态，销毁时使未完成请求失效。 @param props 当前空间和行为。 @param apis 调用方提供的数据查询接口，不包含测试执行接口。 @returns 参数状态、选择方法及快照校验能力。 */
export function useBehaviorParameters(
  props: {
    spaceId: string;
    behavior: Pick<SpaceBehaviorItem, "id" | "kind" | "valueType" | "basicAction" | "ontologyUniqIdentifier" | "behaviorApiName"> | null;
  },
  apis: {
    getOntologyActionInfoInterface: typeof BehaviorApis.getOntologyActionInfoInterface;
    getOntologyEntitiesInterface: typeof BehaviorApis.getOntologyEntitiesInterface;
    getOntologyLinkByUniqueIdentifierInterface: typeof BehaviorApis.getOntologyLinkByUniqueIdentifierInterface;
    postGetOntologyEntityRowDetailPageInterface: typeof BehaviorApis.postGetOntologyEntityRowDetailPageInterface;
  },
) {
  const {
    getOntologyActionInfoInterface,
    getOntologyEntitiesInterface,
    getOntologyLinkByUniqueIdentifierInterface,
    postGetOntologyEntityRowDetailPageInterface,
  } = apis;
  let pendingActionKey = "";

  const detailLoading = ref(false);

  const detailError = ref("");

  const paramRows = ref<BehaviorTestParamRow[]>([]);

  const paramValues = reactive<Record<string, string>>({});

  const resolvedActionApi = ref("");

  const resolvedStorageGroup = ref("");

  /** 行为详情顶层对象标识；应用测试组装 entityPrimaryKey 时使用。 */
  const resolvedOntologyUniqIdentifier = ref("");

  const detailLoadToken = ref(0);

  /** 应用行为测试 INPUT 行。 */
  const applicationInputRows = ref<SpaceBehaviorActionInfoViewParamRow[]>([]);

  /** 应用行为测试 WRITE_PROPERTY 出参行。 */
  const applicationWritePropertyOutputRows = ref<SpaceBehaviorActionInfoViewParamRow[]>([]);

  /** 应用行为 PROPERTY / WRITE_PROPERTY 对象实例选择器。 */
  const applicationOntologyPickers = ref<ApplicationOntologyEntityPicker[]>([]);

  const applicationOntologyLoadTokens: Record<string, number> = {};

  /** 应用行为非 main 存储分组数据行选择器。 */
  const applicationStorageGroupPickers = ref<ApplicationStorageGroupPicker[]>([]);

  const applicationStorageGroupLoadTokens: Record<string, number> = {};

  /** 入参 PROPERTY 多选已添加绑定记录（按参数名）。 */
  const applicationInputBindingRecords = ref<Record<string, ApplicationInputBindingRecord[]>>({});

  /** 应用行为详情是否配置了关系 linkMapping。 */
  const applicationHasLinkMapping = ref(false);

  const relationContextLoading = ref(false);

  const relationContextError = ref("");

  const ontologyLinkUniqIdentifier = ref("");

  const ontologyNameFrom = ref("");

  const ontologyNameTo = ref("");

  const ontologyUniqueIdentifierFrom = ref("");

  const ontologyUniqueIdentifierTo = ref("");

  const relationMountSide = ref<RelationMountSide>("");

  const relationContextLoadToken = ref(0);

  const fromEntityLoading = ref(false);

  const fromEntityError = ref("");

  const fromEntityRows = ref<BehaviorTestEntityRow[]>([]);

  const fromEntityTotal = ref(0);

  const fromEntityPage = ref(1);

  const fromEntityPageSize = ref(10);

  const selectedFromEntityRowKeys = ref<string[]>([]);

  const selectedFromEntities = ref<BehaviorTestEntityRow[]>([]);

  const fromEntityLoadToken = ref(0);

  const toEntityLoading = ref(false);

  const toEntityError = ref("");

  const toEntityRows = ref<BehaviorTestEntityRow[]>([]);

  const toEntityTotal = ref(0);

  const toEntityPage = ref(1);

  const toEntityPageSize = ref(10);

  const selectedToEntityRowKeys = ref<string[]>([]);

  const selectedToEntities = ref<BehaviorTestEntityRow[]>([]);

  const toEntityLoadToken = ref(0);

  const isApplicationTest = computed(() => props.behavior?.kind === "application");

  const isRelationInstanceTest = computed(() => !isApplicationTest.value && props.behavior?.valueType === "relationInstance");

  /** 关系实例测试，或应用行为配置了 linkMapping 时展示关系两端表单。 */
  const showRelationLinkForm = computed(() => isRelationInstanceTest.value || (isApplicationTest.value && applicationHasLinkMapping.value));

  const behaviorOntologyUniqueIdentifier = computed(() => (props.behavior?.ontologyUniqIdentifier?.trim() || resolvedOntologyUniqIdentifier.value).trim());

  const selectedFromEntityRows = computed(() => {
    const byKey = new Map(selectedFromEntities.value.map((item) => [item.rowKey, item]));
    for (const row of fromEntityRows.value) {
      if (selectedFromEntityRowKeys.value.includes(row.rowKey)) byKey.set(row.rowKey, { ...row, savedPrimaryKey: byKey.get(row.rowKey)?.savedPrimaryKey });
    }
    return selectedFromEntityRowKeys.value.map((key) => byKey.get(key)).filter((item): item is BehaviorTestEntityRow => Boolean(item));
  });

  const selectedToEntityRows = computed(() => {
    const byKey = new Map(selectedToEntities.value.map((item) => [item.rowKey, item]));
    for (const row of toEntityRows.value) {
      if (selectedToEntityRowKeys.value.includes(row.rowKey)) byKey.set(row.rowKey, { ...row, savedPrimaryKey: byKey.get(row.rowKey)?.savedPrimaryKey });
    }
    return selectedToEntityRowKeys.value.map((key) => byKey.get(key)).filter((item): item is BehaviorTestEntityRow => Boolean(item));
  });

  /**
   * @description 将未知主键值格式化为表格文案。
   * @param value 主键值。
   * @returns 展示文案。
   */
  function formatPrimaryKeyLabel(value: unknown): string {
    if (value === null || value === undefined) return "—";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  /**
   * @description 从实体记录读取显示名称。
   * @param record 实体记录。
   * @returns 显示名称。
   */
  function readEntityDisplayName(record: OntologyEntityInfo): string {
    const direct = typeof record.displayName === "string" ? record.displayName.trim() : "";
    if (direct) return direct;
    const properties = record.properties;
    if (properties && typeof properties === "object" && !Array.isArray(properties)) {
      const name = properties.name;
      if (typeof name === "string" && name.trim()) return name.trim();
    }
    return "—";
  }

  /**
   * @description 从实体记录读取对象名称。
   * @param record 实体记录。
   * @returns 对象名称。
   */
  function readEntityOntologyName(record: OntologyEntityInfo): string {
    const direct = typeof record.ontologyName === "string" ? record.ontologyName.trim() : "";
    return direct || "—";
  }

  /**
   * @description 从实体记录读取主键。
   * @param record 实体记录。
   * @returns 主键值。
   */
  function readEntityPrimaryKey(record: OntologyEntityInfo): string | number {
    if (record.entityPrimaryKey !== undefined && record.entityPrimaryKey !== null && record.entityPrimaryKey !== "") {
      return record.entityPrimaryKey;
    }
    if (record.primaryKey !== undefined && record.primaryKey !== null && record.primaryKey !== "") {
      const primaryKey = record.primaryKey;
      if (typeof primaryKey === "string" || typeof primaryKey === "number") return primaryKey;
      return formatPrimaryKeyLabel(primaryKey);
    }
    if (record.id !== undefined && record.id !== null && record.id !== "") return record.id;
    return "";
  }

  /**
   * @description 汇总实体主属性为短文案。
   * @param record 实体记录。
   * @returns 摘要。
   */
  function buildEntityPropertySummary(record: OntologyEntityInfo): string {
    const properties = record.properties;
    if (!properties || typeof properties !== "object") return "—";
    if (Array.isArray(properties)) {
      return properties.length ? `${properties.length} 项属性` : "—";
    }
    const entries = Object.entries(properties)
      .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
      .slice(0, 3)
      .map(([key, value]) => `${key}=${formatPrimaryKeyLabel(value)}`);
    return entries.length ? entries.join("；") : "—";
  }

  /**
   * @description 将接口实体记录映射为表格行。
   * @param record 实体记录。
   * @param index 行序号。
   * @returns 表格行。
   */
  function mapEntityRecordToRow(record: OntologyEntityInfo, index: number): BehaviorTestEntityRow {
    const primaryKey = readEntityPrimaryKey(record);
    const rowKey = String(primaryKey || record.id || `entity-${index}`);
    return {
      rowKey,
      displayName: readEntityDisplayName(record),
      primaryKeyLabel: formatPrimaryKeyLabel(primaryKey) || "—",
      ontologyName: readEntityOntologyName(record),
      propertySummary: buildEntityPropertySummary(record),
      primaryKey,
      raw: record,
    };
  }

  /**
   * @description 将查看态入参行映射为测试参数行；仅保留外部输入。
   * @param rows 查看态入参行。
   * @returns 外部输入参数行。
   */
  function mapExternalParamRows(rows: SpaceBehaviorActionInfoViewParamRow[]): BehaviorTestParamRow[] {
    return rows
      .filter((item) => item.sourceType === "EXTERNAL")
      .map((item) => {
        const paramName = item.paramName;
        const propertyDisplayName = item.propertyDisplayName.trim() || paramName;
        const propertyType = item.propertyType.trim() || item.paramType || "—";
        return {
          rowKey: item.rowKey,
          paramName,
          propertyDisplayName,
          propertyType,
        };
      })
      .filter((item) => item.paramName && item.paramName !== "—");
  }

  /**
   * @description 重置参数输入值。
   * @param rows 外部输入参数行。
   */
  function resetParamValues(rows: BehaviorTestParamRow[]): void {
    Object.keys(paramValues).forEach((key) => {
      delete paramValues[key];
    });
    rows.forEach((row) => {
      paramValues[row.paramName] = "";
    });
  }

  /**
   * @description 清空关系实例测试上下文与双端实体列表。
   */
  function clearRelationTestState(): void {
    relationContextLoading.value = false;
    relationContextError.value = "";
    ontologyLinkUniqIdentifier.value = "";
    ontologyNameFrom.value = "";
    ontologyNameTo.value = "";
    ontologyUniqueIdentifierFrom.value = "";
    ontologyUniqueIdentifierTo.value = "";
    relationMountSide.value = "";
    fromEntityRows.value = [];
    fromEntityTotal.value = 0;
    fromEntityError.value = "";
    fromEntityLoading.value = false;
    fromEntityPage.value = 1;
    fromEntityPageSize.value = 10;
    selectedFromEntityRowKeys.value = [];
    selectedFromEntities.value = [];
    toEntityRows.value = [];
    toEntityTotal.value = 0;
    toEntityError.value = "";
    toEntityLoading.value = false;
    toEntityPage.value = 1;
    toEntityPageSize.value = 10;
    selectedToEntityRowKeys.value = [];
    selectedToEntities.value = [];
  }

  /** @description 清空参数详情状态。 */
  function clearDetailParamState(): void {
    paramRows.value = [];
    resetParamValues([]);
    detailError.value = "";
    detailLoading.value = false;
    resolvedActionApi.value = "";
    resolvedStorageGroup.value = "";
    resolvedOntologyUniqIdentifier.value = "";
    clearApplicationTestFormState();
  }

  /**
   * @description 清空应用行为测试入参、写回出参与对象实例选择器。
   */
  function clearApplicationTestFormState(): void {
    applicationInputRows.value = [];
    applicationWritePropertyOutputRows.value = [];
    applicationOntologyPickers.value = [];
    applicationStorageGroupPickers.value = [];
    applicationInputBindingRecords.value = {};
    applicationHasLinkMapping.value = false;
    configurationError.value = "";
    for (const key of Object.keys(applicationOntologyLoadTokens)) applicationOntologyLoadTokens[key] = (applicationOntologyLoadTokens[key] ?? 0) + 1;
    for (const key of Object.keys(applicationStorageGroupLoadTokens))
      applicationStorageGroupLoadTokens[key] = (applicationStorageGroupLoadTokens[key] ?? 0) + 1;
  }

  /**
   * @description 从出参行过滤 WRITE_PROPERTY 写回属性行。
   * @param outputRows 行为详情出参行。
   * @returns WRITE_PROPERTY 行列表。
   */
  function filterWritePropertyOutputRows(outputRows: SpaceBehaviorActionInfoViewParamRow[]): SpaceBehaviorActionInfoViewParamRow[] {
    return outputRows.filter((row) => (row.outputMode ?? "").trim().toUpperCase() === "WRITE_PROPERTY");
  }

  /**
   * @description 规范化应用入参 sourceType。
   * @param sourceType 原始来源。
   * @returns 大写来源；空为 "".
   */
  function normalizeApplicationSourceType(sourceType: string): string {
    return sourceType.trim().toUpperCase();
  }

  /**
   * @description 将表格行收窄为应用行为 INPUT 行。
   * @param row 表格行。
   * @returns INPUT 行。
   */
  function asApplicationInputRow(row: unknown): SpaceBehaviorActionInfoViewParamRow {
    return row as SpaceBehaviorActionInfoViewParamRow;
  }

  /**
   * @description 按参数名与侧别查找应用行为实例选择器。
   * @param paramName 参数名；也可直接传完整 pickerKey。
   * @param side 侧别；省略时仅在唯一匹配或完整 pickerKey 时返回。
   * @returns 选择器；未找到或同名多侧歧义时为 null。
   */
  function findApplicationOntologyPicker(paramName: string, side?: ApplicationOntologyPickerSide): ApplicationOntologyEntityPicker | null {
    const key = paramName.trim();
    if (!key) return null;
    if (side) {
      const pickerKey = buildApplicationOntologyPickerKey(side, key);
      return applicationOntologyPickers.value.find((item) => item.pickerKey === pickerKey) ?? null;
    }
    const byPickerKey = applicationOntologyPickers.value.find((item) => item.pickerKey === key);
    if (byPickerKey) return byPickerKey;
    const byParamName = applicationOntologyPickers.value.filter((item) => item.paramName === key);
    return byParamName.length === 1 ? (byParamName[0] ?? null) : null;
  }

  /**
   * @description 按选择器键查找非 main 存储分组数据行选择器。
   * @param pickerKey paramName::storageGroup。
   * @returns 选择器；未找到为 null。
   */
  function findApplicationStorageGroupPicker(pickerKey: string): ApplicationStorageGroupPicker | null {
    const key = pickerKey.trim();
    if (!key) return null;
    return applicationStorageGroupPickers.value.find((item) => item.pickerKey === key) ?? null;
  }

  /**
   * @description 按参数行查找对应的非 main 存储分组数据行选择器。
   * @param row 入参或写回出参行。
   * @returns 选择器；main/空或不存在时为 null。
   */
  function findApplicationStorageGroupPickerForRow(row: SpaceBehaviorActionInfoViewParamRow): ApplicationStorageGroupPicker | null {
    const paramName = (row.paramName ?? "").trim();
    const storageGroup = normalizeStorageGroup(row.storageGroup);
    if (!paramName || !storageGroup || isMainStorageGroup(storageGroup)) return null;
    return findApplicationStorageGroupPicker(buildApplicationStorageGroupPickerKey(paramName, storageGroup));
  }

  /**
   * @description 更新指定存储分组数据行选择器的部分字段。
   * @param pickerKey 选择器键。
   * @param patch 部分字段。
   */
  function patchApplicationStorageGroupPicker(pickerKey: string, patch: Partial<ApplicationStorageGroupPicker>): void {
    const key = pickerKey.trim();
    applicationStorageGroupPickers.value = applicationStorageGroupPickers.value.map((item) => (item.pickerKey === key ? { ...item, ...patch } : item));
  }

  /**
   * @description 格式化存储分组数据行下拉选项文案（仅展示数据行主键，不展示属性个数）。
   * @param row 数据行。
   * @returns 选项文案。
   */
  function formatApplicationStorageGroupOptionLabel(row: BehaviorTestEntityDataRow): string {
    return row.dataPrimaryKeyLabel.trim() || "—";
  }

  /**
   * @description 组装存储分组数据行下拉选项；已选行不在当前页时前置保留以便回显。
   * @param picker 存储分组选择器。
   * @returns 选项列表。
   */
  /**
   * @description 按实体行键定位存储分组槽位。
   * @param picker 存储分组选择器。
   * @param entityRowKey 实体行键。
   * @returns 槽位或 null。
   */
  function findApplicationStorageGroupEntitySlot(
    picker: ApplicationStorageGroupPicker | null | undefined,
    entityRowKey: string,
  ): ApplicationStorageGroupEntitySlot | null {
    if (!picker) return null;
    return picker.entitySlots.find((item) => item.entityRowKey === entityRowKey) ?? null;
  }

  /**
   * @description 组装存储分组槽位下拉选项；已选行不在当前页时前置保留。
   * @param slot 数据行槽位。
   * @returns 选项列表。
   */
  function listApplicationStorageGroupSlotOptions(slot: ApplicationStorageGroupEntitySlot | null | undefined): BehaviorTestEntityDataRow[] {
    if (!slot) return [];
    const selected = slot.selectedDataRow;
    if (!selected || !slot.selectedRowKey) return slot.rows;
    if (slot.rows.some((item) => item.rowKey === selected.rowKey)) return slot.rows;
    return [selected, ...slot.rows];
  }

  /**
   * @description 清空指定参数下所有非 main 分组数据行槽位。
   * @param paramName 参数名。
   */
  function clearApplicationStorageGroupSelectionsForParam(paramName: string): void {
    const key = paramName.trim();
    applicationStorageGroupPickers.value = applicationStorageGroupPickers.value.map((item) => (item.paramName === key ? { ...item, entitySlots: [] } : item));
  }

  /**
   * @description 生成入参绑定记录稳定键。
   * @param entityPrimaryKey 实体主键。
   * @param dataPrimaryKey 可选数据行主键。
   * @returns 记录键。
   */
  function buildApplicationInputBindingRecordKey(
    entityPrimaryKey: string | number | boolean | Record<string, unknown>,
    dataPrimaryKey?: string | number | boolean | Record<string, unknown> | null,
  ): string {
    const entityPart = formatPrimaryKeyLabel(entityPrimaryKey);
    if (dataPrimaryKey === undefined || dataPrimaryKey === null || dataPrimaryKey === "") {
      return `entity:${entityPart}`;
    }
    return `entity:${entityPart}|data:${formatPrimaryKeyLabel(dataPrimaryKey)}`;
  }

  /**
   * @description 列出入参参数已添加的绑定记录。
   * @param paramName 参数名。
   * @returns 记录列表。
   */
  function listApplicationInputBindingRecords(paramName: string): ApplicationInputBindingRecord[] {
    return applicationInputBindingRecords.value[paramName.trim()] ?? [];
  }

  /**
   * @description 格式化已添加绑定记录展示文案。
   * @param record 绑定记录。
   * @returns 展示文案。
   */
  function formatApplicationInputBindingRecordLabel(record: ApplicationInputBindingRecord): string {
    const entityLabel = record.entityDisplayName.trim() || formatPrimaryKeyLabel(record.entityPrimaryKey) || "未命名实体";
    const dataLabel = (record.dataPrimaryKeyLabel ?? "").trim();
    if (!dataLabel) return entityLabel;
    return `${entityLabel} · ${dataLabel}`;
  }

  /**
   * @description 格式化入参已添加绑定数量提示。
   * @param paramName 参数名。
   * @returns 提示文案。
   */
  function formatApplicationInputBindingRecordsHint(paramName: string): string {
    const count = listApplicationInputBindingRecords(paramName).length;
    if (count === 0) return "当前未选择参数";
    return `当前选择参数：${count}个`;
  }

  /**
   * @description 清空入参参数草稿选择（多选下拉与非 main 数据行槽）。
   * @param paramName 参数名。
   */
  function clearApplicationInputParamDraft(paramName: string): void {
    const key = paramName.trim();
    patchApplicationOntologyPicker(key, { selectedRowKeys: [], selectedEntities: [] }, "input");
    clearApplicationStorageGroupSelectionsForParam(key);
  }

  /**
   * @description 将入参草稿选择添加为可删绑定记录，成功后清空草稿。
   * @param paramName 参数名。
   */
  function addApplicationInputBindingRecords(paramName: string): void {
    configurationError.value = "";
    const key = paramName.trim();
    const picker = findApplicationOntologyPicker(key, "input");
    if (!picker || picker.selectionMode !== "multiple") return;
    if (picker.loading) {
      reportParameterError("请等待对象实例列表加载完成后再添加");
      return;
    }
    const selectedEntities = picker.selectedEntities;
    if (selectedEntities.length === 0) {
      reportParameterError(`请先选择「${picker.label || key}」实例`);
      return;
    }
    const inputRow = applicationInputRows.value.find((item) => (item.paramName ?? "").trim() === key) ?? null;
    const storageGroup = normalizeStorageGroup(inputRow?.storageGroup ?? "");
    const needsDataRow = !isMainStorageGroup(storageGroup) && Boolean(storageGroup);
    const storagePicker = needsDataRow ? findApplicationStorageGroupPicker(buildApplicationStorageGroupPickerKey(key, storageGroup)) : null;
    if (needsDataRow && !storagePicker) {
      reportParameterError(`请先选择参数「${key}」存储分组「${storageGroup}」的数据行`);
      return;
    }

    const existing = listApplicationInputBindingRecords(key);
    const existingKeys = new Set(existing.map((item) => item.recordKey));
    const pending: ApplicationInputBindingRecord[] = [];
    let skippedDuplicate = 0;

    for (const entity of selectedEntities) {
      if (entity.primaryKey === "") {
        reportParameterError(`请先选择「${picker.label || key}」实例`);
        return;
      }
      let dataPrimaryKey: ApplicationInputBindingRecord["dataPrimaryKey"];
      let dataPrimaryKeyLabel = "";
      if (needsDataRow && storagePicker) {
        const slot = findApplicationStorageGroupEntitySlot(storagePicker, entity.rowKey);
        if (!slot) {
          reportParameterError(`请先为实例「${entity.displayName.trim() || "未命名实体"}」选择存储分组「${storageGroup}」的数据行`);
          return;
        }
        if (slot.loading) {
          reportParameterError("请等待数据行列表加载完成后再添加");
          return;
        }
        if (!slot.selectedDataRow) {
          reportParameterError(`请先为实例「${slot.entityDisplayName}」选择存储分组「${storageGroup}」的数据行`);
          return;
        }
        dataPrimaryKey = slot.selectedDataRow.dataPrimaryKey;
        dataPrimaryKeyLabel = slot.selectedDataRow.dataPrimaryKeyLabel.trim();
      }
      const recordKey = buildApplicationInputBindingRecordKey(entity.savedPrimaryKey ?? entity.primaryKey, dataPrimaryKey);
      if (existingKeys.has(recordKey) || pending.some((item) => item.recordKey === recordKey)) {
        skippedDuplicate += 1;
        continue;
      }
      pending.push({
        recordKey,
        entityPrimaryKey: entity.savedPrimaryKey ?? entity.primaryKey,
        entityDisplayName: entity.displayName.trim() || "未命名实体",
        dataPrimaryKey,
        dataPrimaryKeyLabel,
      });
    }

    if (pending.length === 0) {
      reportParameterError(skippedDuplicate > 0 ? "所选绑定已在列表中" : "没有可添加的绑定");
      return;
    }

    applicationInputBindingRecords.value = {
      ...applicationInputBindingRecords.value,
      [key]: [...existing, ...pending],
    };
    clearApplicationInputParamDraft(key);
    if (skippedDuplicate > 0) {
      reportParameterError(`已添加 ${pending.length} 条，跳过 ${skippedDuplicate} 条重复项`);
    }
  }

  /**
   * @description 删除入参已添加的绑定记录。
   * @param paramName 参数名。
   * @param recordKey 记录键。
   */
  function removeApplicationInputBindingRecord(paramName: string, recordKey: string): void {
    const key = paramName.trim();
    const next = listApplicationInputBindingRecords(key).filter((item) => item.recordKey !== recordKey);
    applicationInputBindingRecords.value = {
      ...applicationInputBindingRecords.value,
      [key]: next,
    };
  }

  /**
   * @description 按已选实体同步非 main 分组数据行槽位并加载列表。
   * @param paramName 参数名。
   */
  function syncApplicationStorageGroupSlotsForParam(paramName: string): void {
    const key = paramName.trim();
    const ontologyPicker = findApplicationOntologyPicker(key, "input");
    const entities = ontologyPicker?.selectedEntities ?? [];
    for (const storagePicker of applicationStorageGroupPickers.value) {
      if (storagePicker.paramName !== key) continue;
      const prevByKey = new Map(storagePicker.entitySlots.map((slot) => [slot.entityRowKey, slot]));
      const nextSlots: ApplicationStorageGroupEntitySlot[] = entities.map((entity) => {
        const existing = prevByKey.get(entity.rowKey);
        if (existing) {
          return {
            ...existing,
            entityPrimaryKey: entity.savedPrimaryKey ?? entity.primaryKey,
            entityDisplayName: entity.displayName.trim() || "未命名实体",
          };
        }
        return {
          entityRowKey: entity.rowKey,
          entityPrimaryKey: entity.savedPrimaryKey ?? entity.primaryKey,
          entityDisplayName: entity.displayName.trim() || "未命名实体",
          loading: false,
          error: "",
          rows: [],
          total: 0,
          page: 1,
          pageSize: 10,
          selectedRowKey: "",
          selectedDataRow: null,
        };
      });
      patchApplicationStorageGroupPicker(storagePicker.pickerKey, { entitySlots: nextSlots });
      for (const slot of nextSlots) {
        void loadApplicationStorageGroupDataRows(storagePicker.pickerKey, slot.entityRowKey);
      }
    }
  }

  /**
   * @description 更新存储分组选择器中某个实体槽位。
   * @param pickerKey 选择器键。
   * @param entityRowKey 实体行键。
   * @param patch 槽位补丁。
   */
  function patchApplicationStorageGroupEntitySlot(pickerKey: string, entityRowKey: string, patch: Partial<ApplicationStorageGroupEntitySlot>): void {
    const picker = findApplicationStorageGroupPicker(pickerKey);
    if (!picker) return;
    patchApplicationStorageGroupPicker(pickerKey, {
      entitySlots: picker.entitySlots.map((slot) => (slot.entityRowKey === entityRowKey ? { ...slot, ...patch } : slot)),
    });
  }

  /**
   * @description 加载应用行为非 main 存储分组下某实例的数据行分页列表。
   * @param pickerKey 选择器键。
   * @param entityRowKey 实体行键。
   */
  async function loadApplicationStorageGroupDataRows(pickerKey: string, entityRowKey: string): Promise<void> {
    const key = pickerKey.trim();
    const entityKey = entityRowKey.trim();
    const picker = findApplicationStorageGroupPicker(key);
    const slot = findApplicationStorageGroupEntitySlot(picker, entityKey);
    if (!picker || !slot) return;
    if (slot.entityPrimaryKey === "") {
      patchApplicationStorageGroupEntitySlot(key, entityKey, {
        loading: false,
        error: "",
        rows: [],
        total: 0,
        selectedRowKey: "",
        selectedDataRow: null,
      });
      return;
    }
    const tokenKey = `${key}::${entityKey}`;
    const requestToken = (applicationStorageGroupLoadTokens[tokenKey] ?? 0) + 1;
    applicationStorageGroupLoadTokens[tokenKey] = requestToken;
    patchApplicationStorageGroupEntitySlot(key, entityKey, { loading: true, error: "" });
    try {
      const response = await postGetOntologyEntityRowDetailPageInterface({
        ontologyUniqueIdentifier: picker.ontologyUniqueIdentifier,
        entityPrimaryKey: slot.entityPrimaryKey,
        sort: "DESC",
        storageGroup: picker.storageGroup,
        pageNum: slot.page,
        pageSize: slot.pageSize,
      });
      if (applicationStorageGroupLoadTokens[tokenKey] !== requestToken) return;
      if (response.code !== 200) throw new Error(response.message || "实体行数据加载失败");
      const pageData = response.data ?? null;
      const rows = mapOntologyEntityRowDetailPageToDataRows(pageData, picker.storageGroup);
      const latestSlot = findApplicationStorageGroupEntitySlot(findApplicationStorageGroupPicker(key), entityKey);
      const selectedOnPage = latestSlot?.selectedRowKey ? (rows.find((item) => item.rowKey === latestSlot.selectedRowKey) ?? null) : null;
      patchApplicationStorageGroupEntitySlot(key, entityKey, {
        loading: false,
        error: "",
        rows,
        total: typeof pageData?.total === "number" ? pageData.total : 0,
        selectedDataRow: selectedOnPage ?? latestSlot?.selectedDataRow ?? null,
      });
    } catch (error) {
      if (applicationStorageGroupLoadTokens[tokenKey] !== requestToken) return;
      patchApplicationStorageGroupEntitySlot(key, entityKey, {
        loading: false,
        error: error instanceof Error ? error.message : "实体行数据加载失败",
        rows: [],
        total: 0,
      });
    }
  }

  /**
   * @description 切换应用行为存储分组数据行列表页码。
   * @param pickerKey 选择器键。
   * @param entityRowKey 实体行键。
   * @param page 页码。
   */
  function changeApplicationStorageGroupRowPage(pickerKey: string, entityRowKey: string, page: number): void {
    patchApplicationStorageGroupEntitySlot(pickerKey, entityRowKey, { page });
    void loadApplicationStorageGroupDataRows(pickerKey, entityRowKey);
  }

  /**
   * @description 更新应用行为存储分组数据行下拉选中值。
   * @param pickerKey 选择器键。
   * @param entityRowKey 实体行键。
   * @param selectedRowKey 选中行键；空串表示清空。
   */
  function updateApplicationStorageGroupRowSelection(pickerKey: string, entityRowKey: string, selectedRowKey: string): void {
    const picker = findApplicationStorageGroupPicker(pickerKey);
    const slot = findApplicationStorageGroupEntitySlot(picker, entityRowKey);
    if (!picker || !slot) return;
    const nextKey = selectedRowKey.trim();
    if (!nextKey) {
      patchApplicationStorageGroupEntitySlot(pickerKey, entityRowKey, { selectedRowKey: "", selectedDataRow: null });
      return;
    }
    const matched =
      listApplicationStorageGroupSlotOptions(slot).find((item) => item.rowKey === nextKey) ?? slot.rows.find((item) => item.rowKey === nextKey) ?? null;
    patchApplicationStorageGroupEntitySlot(pickerKey, entityRowKey, {
      selectedRowKey: nextKey,
      selectedDataRow: matched,
    });
  }

  /**
   * @description 按 PROPERTY / WRITE_PROPERTY 行组装参数绑定选择快照。
   * @param rows 参数行。
   * @param sideLabel 错误文案侧别名。
   * @returns 选择列表或错误。
   */
  function collectApplicationParamBindingSelections(
    rows: SpaceBehaviorActionInfoViewParamRow[],
    sideLabel: string,
  ): { ok: true; selections: ApplicationTestParamBindingSelection[] } | { ok: false; error: string } {
    const selections: ApplicationTestParamBindingSelection[] = [];
    /** 写回出参仅选实例，不绑定非 main 数据行。 */
    const isOutputSide = sideLabel === "出参";
    const pickerSide: ApplicationOntologyPickerSide = isOutputSide ? "output" : "input";
    for (const row of rows) {
      const paramName = (row.paramName ?? "").trim();
      if (!paramName) return { ok: false, error: `${sideLabel}缺少参数名，无法测试` };
      const ontologyId = (row.ontologyUniqueIdentifier ?? "").trim();
      if (!ontologyId) return { ok: false, error: `${sideLabel}参数「${paramName}」缺少对象标识，无法测试` };
      const ontologyPicker = findApplicationOntologyPicker(paramName, pickerSide);
      if (!ontologyPicker) return { ok: false, error: `${sideLabel}缺少参数「${paramName}」实例选择器` };
      if (ontologyPicker.loading) return { ok: false, error: "请等待对象实例列表加载完成后再测试" };
      const storageGroup = isOutputSide ? "" : normalizeStorageGroup(row.storageGroup);
      const needsDataRow = !isOutputSide && !isMainStorageGroup(storageGroup) && Boolean(storageGroup);

      if (ontologyPicker.selectionMode === "multiple") {
        const records = listApplicationInputBindingRecords(paramName);
        if (records.length === 0) {
          return { ok: false, error: `请先添加「${ontologyPicker.label || paramName}」实例绑定` };
        }
        for (const record of records) {
          if (record.entityPrimaryKey === "") {
            return { ok: false, error: `请先添加「${ontologyPicker.label || paramName}」实例绑定` };
          }
          if (needsDataRow && (record.dataPrimaryKey === undefined || record.dataPrimaryKey === null || record.dataPrimaryKey === "")) {
            return { ok: false, error: `请先为实例「${record.entityDisplayName}」添加存储分组「${storageGroup}」的数据行绑定` };
          }
          selections.push({
            paramName,
            ontologyUniqueIdentifier: ontologyId,
            entityPrimaryKey: record.entityPrimaryKey,
            storageGroup,
            dataPrimaryKey: needsDataRow ? record.dataPrimaryKey : undefined,
          });
        }
        continue;
      }

      const selectedEntities = ontologyPicker.selectedEntities;
      if (selectedEntities.length === 0) {
        return { ok: false, error: `请先选择「${ontologyPicker.label || paramName}」实例` };
      }
      if (selectedEntities.length > 1) {
        return { ok: false, error: `${sideLabel}参数「${paramName}」仅支持选择一个实例` };
      }
      const storagePicker = needsDataRow ? findApplicationStorageGroupPicker(buildApplicationStorageGroupPickerKey(paramName, storageGroup)) : null;
      if (needsDataRow && !storagePicker) {
        return { ok: false, error: `请先选择${sideLabel}参数「${paramName}」存储分组「${storageGroup}」的数据行` };
      }
      for (const selectedEntity of selectedEntities) {
        if (selectedEntity.primaryKey === "") {
          return { ok: false, error: `请先选择「${ontologyPicker.label || paramName}」实例` };
        }
        let dataPrimaryKey: ApplicationTestParamBindingSelection["dataPrimaryKey"];
        if (needsDataRow && storagePicker) {
          const slot = findApplicationStorageGroupEntitySlot(storagePicker, selectedEntity.rowKey);
          if (!slot) {
            return { ok: false, error: `请先选择${sideLabel}参数「${paramName}」存储分组「${storageGroup}」的数据行` };
          }
          if (slot.loading) return { ok: false, error: "请等待数据行列表加载完成后再测试" };
          if (!slot.selectedDataRow) {
            return { ok: false, error: `请先为实例「${slot.entityDisplayName}」选择存储分组「${storageGroup}」的数据行` };
          }
          dataPrimaryKey = slot.selectedDataRow.dataPrimaryKey;
        }
        selections.push({
          paramName,
          ontologyUniqueIdentifier: ontologyId,
          entityPrimaryKey: selectedEntity.savedPrimaryKey ?? selectedEntity.primaryKey,
          storageGroup,
          dataPrimaryKey,
        });
      }
    }
    return { ok: true, selections };
  }

  /**
   * @description 更新指定参数实例选择器的部分字段。
   * @param paramName 参数名或完整 pickerKey。
   * @param patch 部分字段。
   * @param side 侧别；与 findApplicationOntologyPicker 一致。
   */
  function patchApplicationOntologyPicker(paramName: string, patch: Partial<ApplicationOntologyEntityPicker>, side?: ApplicationOntologyPickerSide): void {
    const picker = findApplicationOntologyPicker(paramName, side);
    if (!picker) return;
    const pickerKey = picker.pickerKey;
    applicationOntologyPickers.value = applicationOntologyPickers.value.map((item) => (item.pickerKey === pickerKey ? { ...item, ...patch } : item));
  }

  /**
   * @description 格式化应用行为实例下拉选项文案（仅展示名称，不展示主键）。
   * @param row 实体行。
   * @returns 选项文案。
   */
  function formatApplicationEntityOptionLabel(row: BehaviorTestEntityRow): string {
    return row.displayName.trim() || "未命名实体";
  }

  /**
   * @description 组装下拉选项；已选实体不在当前页时前置保留以便回显。
   * @param picker 对象实例选择器。
   * @returns 选项列表。
   */
  function listApplicationOntologySelectOptions(picker: ApplicationOntologyEntityPicker | null | undefined): BehaviorTestEntityRow[] {
    if (!picker) return [];
    const offPage = picker.selectedEntities.filter((item) => !picker.rows.some((row) => row.rowKey === item.rowKey));
    return offPage.length ? [...offPage, ...picker.rows] : picker.rows;
  }

  /**
   * @description 加载应用行为 PROPERTY / WRITE_PROPERTY 参数对应对象的实体分页列表。
   * @param paramName 参数名或完整 pickerKey。
   * @param side 侧别。
   */
  async function loadApplicationOntologyEntityList(paramName: string, side?: ApplicationOntologyPickerSide): Promise<void> {
    const picker = findApplicationOntologyPicker(paramName, side);
    if (!picker) return;
    const tokenKey = picker.pickerKey;
    const ontologyId = picker.ontologyUniqueIdentifier.trim();
    if (!ontologyId) {
      patchApplicationOntologyPicker(tokenKey, {
        loading: false,
        error: "缺少对象标识，无法加载实体列表",
        rows: [],
        total: 0,
      });
      return;
    }
    const requestToken = (applicationOntologyLoadTokens[tokenKey] ?? 0) + 1;
    applicationOntologyLoadTokens[tokenKey] = requestToken;
    patchApplicationOntologyPicker(tokenKey, { loading: true, error: "" });
    try {
      const response = await getOntologyEntitiesInterface({
        ontologyUniqueIdentifier: ontologyId,
        pageNum: picker.page,
        pageSize: picker.pageSize,
      });
      if (applicationOntologyLoadTokens[tokenKey] !== requestToken) return;
      if (response.code !== 200 || !response.data) throw new Error(response.message || "实体列表加载失败");
      const records = Array.isArray(response.data.records) ? response.data.records : [];
      const rows = records.map((item, index) => mapEntityRecordToRow(item, index));
      const previousByKey = new Map(picker.selectedEntities.map((item) => [item.rowKey, item]));
      for (const row of rows) {
        if (picker.selectedRowKeys.includes(row.rowKey)) previousByKey.set(row.rowKey, row);
      }
      const selectedEntities = picker.selectedRowKeys.map((rowKey) => previousByKey.get(rowKey)).filter((item): item is BehaviorTestEntityRow => Boolean(item));
      patchApplicationOntologyPicker(tokenKey, {
        loading: false,
        error: "",
        rows,
        total: Number(response.data.total) || records.length,
        selectedEntities,
      });
    } catch (error) {
      if (applicationOntologyLoadTokens[tokenKey] !== requestToken) return;
      patchApplicationOntologyPicker(tokenKey, {
        loading: false,
        error: error instanceof Error ? error.message : "实体列表加载失败",
        rows: [],
        total: 0,
      });
    }
  }

  /**
   * @description 切换应用行为参数实例列表页码。
   * @param paramName 参数名或完整 pickerKey。
   * @param page 页码。
   * @param side 侧别。
   */
  function changeApplicationOntologyEntityPage(paramName: string, page: number, side?: ApplicationOntologyPickerSide): void {
    patchApplicationOntologyPicker(paramName, { page }, side);
    void loadApplicationOntologyEntityList(paramName, side);
  }

  /**
   * @description 更新应用行为参数实例下拉选中值；草稿始终最多 1 个，变更后同步非 main 分组数据行槽位。
   * @param paramName 参数名或完整 pickerKey。
   * @param selectedRowKeys 选中行键列表；空数组表示清空。
   * @param side 侧别。
   */
  function updateApplicationOntologyEntitySelection(
    paramName: string,
    selectedRowKeys: string[] | string | null | undefined,
    side?: ApplicationOntologyPickerSide,
  ): void {
    const picker = findApplicationOntologyPicker(paramName, side);
    if (!picker) return;
    const rawKeys = Array.isArray(selectedRowKeys) ? selectedRowKeys : selectedRowKeys ? [String(selectedRowKeys)] : [];
    const nextKeys = rawKeys
      .map((item) => String(item ?? "").trim())
      .filter(Boolean)
      .slice(0, 1);
    if (nextKeys.length === 0) {
      patchApplicationOntologyPicker(paramName, { selectedRowKeys: [], selectedEntities: [] }, side);
      if (picker.selectionMode === "multiple") clearApplicationStorageGroupSelectionsForParam(picker.paramName);
      return;
    }
    const optionByKey = new Map(listApplicationOntologySelectOptions(picker).map((item) => [item.rowKey, item]));
    for (const row of picker.rows) optionByKey.set(row.rowKey, row);
    for (const entity of picker.selectedEntities) optionByKey.set(entity.rowKey, entity);
    const selectedEntities = nextKeys.map((key) => optionByKey.get(key)).filter((item): item is BehaviorTestEntityRow => Boolean(item));
    patchApplicationOntologyPicker(
      paramName,
      {
        selectedRowKeys: nextKeys,
        selectedEntities,
      },
      side,
    );
    if (picker.selectionMode === "multiple") syncApplicationStorageGroupSlotsForParam(picker.paramName);
  }

  /**
   * @description 按关系唯一标识加载应用行为关系两端上下文（不强制挂载侧匹配）。
   * @param linkId 关系唯一标识。
   */
  async function loadApplicationLinkContext(linkId: string): Promise<void> {
    const uniqueIdentifier = linkId.trim();
    if (!uniqueIdentifier) {
      applicationHasLinkMapping.value = false;
      clearRelationTestState();
      return;
    }
    const requestToken = ++relationContextLoadToken.value;
    applicationHasLinkMapping.value = true;
    relationContextLoading.value = true;
    relationContextError.value = "";
    try {
      ontologyLinkUniqIdentifier.value = uniqueIdentifier;
      const linkResponse = await getOntologyLinkByUniqueIdentifierInterface({ uniqueIdentifier });
      if (requestToken !== relationContextLoadToken.value) return;
      if (linkResponse.code !== 200 || !linkResponse.data) throw new Error(linkResponse.message || "关系详情加载失败");
      const linkData = linkResponse.data;
      ontologyNameFrom.value = (linkData.ontologyNameFrom ?? "").trim();
      ontologyNameTo.value = (linkData.ontologyNameTo ?? "").trim();
      ontologyUniqueIdentifierFrom.value = (linkData.ontologyUniqueIdentifierFrom ?? "").trim();
      ontologyUniqueIdentifierTo.value = (linkData.ontologyUniqueIdentifierTo ?? "").trim();
      const mountOntologyId = behaviorOntologyUniqueIdentifier.value;
      if (mountOntologyId && mountOntologyId === ontologyUniqueIdentifierFrom.value) {
        relationMountSide.value = "from";
      } else if (mountOntologyId && mountOntologyId === ontologyUniqueIdentifierTo.value) {
        relationMountSide.value = "to";
      } else {
        relationMountSide.value = "";
      }
      fromEntityPage.value = 1;
      toEntityPage.value = 1;
      selectedFromEntityRowKeys.value = [];
      selectedFromEntities.value = [];
      selectedToEntityRowKeys.value = [];
      selectedToEntities.value = [];
      await Promise.all([loadFromEntityList(), loadToEntityList()]);
    } catch (error) {
      if (requestToken !== relationContextLoadToken.value) return;
      ontologyLinkUniqIdentifier.value = "";
      ontologyNameFrom.value = "";
      ontologyNameTo.value = "";
      ontologyUniqueIdentifierFrom.value = "";
      ontologyUniqueIdentifierTo.value = "";
      relationMountSide.value = "";
      fromEntityRows.value = [];
      toEntityRows.value = [];
      relationContextError.value = error instanceof Error ? error.message : "关系信息加载失败";
    } finally {
      if (requestToken === relationContextLoadToken.value) relationContextLoading.value = false;
    }
  }

  /**
   * @description 加载应用行为测试表单：详情 INPUT 行、PROPERTY 实例选择，以及可选关系两端。
   */
  async function loadApplicationTestForm(): Promise<void> {
    const actionApi = (props.behavior?.behaviorApiName ?? "").trim();
    const ontologySpaceId = props.spaceId.trim();
    if (!actionApi) {
      clearDetailParamState();
      detailError.value = "当前行为缺少 apiName，无法加载参数";
      return;
    }
    if (!ontologySpaceId) {
      clearDetailParamState();
      detailError.value = "缺少对象空间 id，无法加载参数";
      return;
    }
    const actionKey = `${ontologySpaceId}:${actionApi}`;
    if (detailLoading.value && pendingActionKey === actionKey) return;
    cancelParameterRequests();
    pendingActionKey = actionKey;
    const requestToken = ++detailLoadToken.value;
    detailLoading.value = true;
    detailError.value = "";
    applicationInputRows.value = [];
    applicationWritePropertyOutputRows.value = [];
    applicationOntologyPickers.value = [];
    applicationStorageGroupPickers.value = [];
    applicationInputBindingRecords.value = {};
    applicationHasLinkMapping.value = false;
    clearRelationTestState();
    try {
      const response = await getOntologyActionInfoInterface({ actionApi, ontologySpaceId });
      if (requestToken !== detailLoadToken.value) return;
      if (response.code !== 200 || !response.data) throw new Error(response.message || "行为详情加载失败");
      const viewState = mapOntologyActionInfoToViewState(response.data);
      resolvedActionApi.value = viewState.actionApi || actionApi;
      resolvedStorageGroup.value = viewState.storageGroup.trim();
      resolvedOntologyUniqIdentifier.value = viewState.ontologyUniqIdentifier.trim();
      applicationInputRows.value = viewState.inputRows;
      const writePropertyOutputRows = filterWritePropertyOutputRows(viewState.outputRows);
      applicationWritePropertyOutputRows.value = writePropertyOutputRows;
      const externalRows = mapExternalParamRows(viewState.inputRows);
      paramRows.value = externalRows;
      resetParamValues(externalRows);
      const pickerSeeds = collectApplicationPropertyOntologyPickers(viewState.inputRows, writePropertyOutputRows);
      applicationOntologyPickers.value = pickerSeeds.map((seed) => ({
        pickerKey: seed.pickerKey,
        paramName: seed.paramName,
        ontologyUniqueIdentifier: seed.ontologyUniqueIdentifier,
        label: seed.label,
        selectionMode: seed.side === "input" ? "multiple" : "single",
        loading: false,
        error: "",
        rows: [],
        total: 0,
        page: 1,
        pageSize: 10,
        selectedRowKeys: [],
        selectedEntities: [],
      }));
      const storageGroupSeeds = collectApplicationStorageGroupPickers(viewState.inputRows, writePropertyOutputRows);
      applicationStorageGroupPickers.value = storageGroupSeeds.map((seed) => ({
        pickerKey: seed.pickerKey,
        paramName: seed.paramName,
        ontologyUniqueIdentifier: seed.ontologyUniqueIdentifier,
        storageGroup: seed.storageGroup,
        label: seed.label,
        entitySlots: [],
      }));
      await Promise.all(pickerSeeds.map((seed) => loadApplicationOntologyEntityList(seed.paramName, seed.side)));
      if (requestToken !== detailLoadToken.value) return;
      const linkId = viewState.linkRelationId.trim();
      if (linkId) {
        await loadApplicationLinkContext(linkId);
      }
    } catch (error) {
      if (requestToken !== detailLoadToken.value) return;
      applicationInputRows.value = [];
      applicationWritePropertyOutputRows.value = [];
      applicationOntologyPickers.value = [];
      applicationStorageGroupPickers.value = [];
      applicationInputBindingRecords.value = {};
      applicationHasLinkMapping.value = false;
      paramRows.value = [];
      resetParamValues([]);
      resolvedActionApi.value = "";
      resolvedStorageGroup.value = "";
      resolvedOntologyUniqIdentifier.value = "";
      detailError.value = error instanceof Error ? error.message : "行为详情加载失败";
    } finally {
      if (requestToken === detailLoadToken.value) detailLoading.value = false;
    }
  }

  /**
   * @description 将表格行收窄为测试实体行类型。
   * @param row 表格行。
   * @returns 实体行。
   */
  function asEntityRow(row: unknown): BehaviorTestEntityRow {
    return row as BehaviorTestEntityRow;
  }

  /**
   * @description 切换关系 From 侧实体行选择；应用行为多选，关系实例单选。
   * @param row 实体行。
   */
  function toggleFromEntityRow(row: BehaviorTestEntityRow): void {
    const key = row.rowKey;
    if (selectedFromEntityRowKeys.value.includes(key)) {
      selectedFromEntityRowKeys.value = selectedFromEntityRowKeys.value.filter((item) => item !== key);
      selectedFromEntities.value = selectedFromEntities.value.filter((item) => item.rowKey !== key);
      return;
    }
    if (isRelationInstanceTest.value) {
      selectedFromEntityRowKeys.value = [key];
      selectedFromEntities.value = [row];
      return;
    }
    selectedFromEntityRowKeys.value = [...selectedFromEntityRowKeys.value, key];
    selectedFromEntities.value = [...selectedFromEntities.value.filter((item) => item.rowKey !== key), row];
  }

  /**
   * @description 点击 From 实体行时切换多选。
   * @param row 表格行。
   */
  function handleFromEntityRowClick(row: unknown): void {
    toggleFromEntityRow(asEntityRow(row));
  }

  /**
   * @description 切换关系 To 侧实体行选择；应用行为多选，关系实例单选。
   * @param row 实体行。
   */
  function toggleToEntityRow(row: BehaviorTestEntityRow): void {
    const key = row.rowKey;
    if (selectedToEntityRowKeys.value.includes(key)) {
      selectedToEntityRowKeys.value = selectedToEntityRowKeys.value.filter((item) => item !== key);
      selectedToEntities.value = selectedToEntities.value.filter((item) => item.rowKey !== key);
      return;
    }
    if (isRelationInstanceTest.value) {
      selectedToEntityRowKeys.value = [key];
      selectedToEntities.value = [row];
      return;
    }
    selectedToEntityRowKeys.value = [...selectedToEntityRowKeys.value, key];
    selectedToEntities.value = [...selectedToEntities.value.filter((item) => item.rowKey !== key), row];
  }

  /**
   * @description 点击 To 实体行时切换多选。
   * @param row 表格行。
   */
  function handleToEntityRowClick(row: unknown): void {
    toggleToEntityRow(asEntityRow(row));
  }

  /**
   * @description 更新外部输入参数值。
   * @param paramName 参数名。
   * @param value 输入值。
   */
  function updateParamValue(paramName: string, value: string): void {
    paramValues[paramName] = value;
  }

  /**
   * @description 按对象标识分页加载关系 From 侧实体列表。
   */
  async function loadFromEntityList(): Promise<void> {
    const ontologyUniqueIdentifier = ontologyUniqueIdentifierFrom.value.trim();
    if (!ontologyUniqueIdentifier) {
      fromEntityRows.value = [];
      fromEntityTotal.value = 0;
      fromEntityError.value = "关系缺少 From 对象标识，无法加载实体列表";
      return;
    }
    const requestToken = ++fromEntityLoadToken.value;
    fromEntityLoading.value = true;
    fromEntityError.value = "";
    try {
      const response = await getOntologyEntitiesInterface({
        ontologyUniqueIdentifier,
        pageNum: fromEntityPage.value,
        pageSize: fromEntityPageSize.value,
      });
      if (requestToken !== fromEntityLoadToken.value) return;
      if (response.code !== 200 || !response.data) throw new Error(response.message || "实体列表加载失败");
      const records = Array.isArray(response.data.records) ? response.data.records : [];
      fromEntityRows.value = records.map((item, index) => mapEntityRecordToRow(item, index));
      fromEntityTotal.value = Number(response.data.total) || records.length;
      selectedFromEntities.value = selectedFromEntityRows.value;
    } catch (error) {
      if (requestToken !== fromEntityLoadToken.value) return;
      fromEntityRows.value = [];
      fromEntityTotal.value = 0;
      fromEntityError.value = error instanceof Error ? error.message : "实体列表加载失败";
    } finally {
      if (requestToken === fromEntityLoadToken.value) fromEntityLoading.value = false;
    }
  }

  /**
   * @description 按对象标识分页加载关系 To 侧实体列表。
   */
  async function loadToEntityList(): Promise<void> {
    const ontologyUniqueIdentifier = ontologyUniqueIdentifierTo.value.trim();
    if (!ontologyUniqueIdentifier) {
      toEntityRows.value = [];
      toEntityTotal.value = 0;
      toEntityError.value = "关系缺少 To 对象标识，无法加载实体列表";
      return;
    }
    const requestToken = ++toEntityLoadToken.value;
    toEntityLoading.value = true;
    toEntityError.value = "";
    try {
      const response = await getOntologyEntitiesInterface({
        ontologyUniqueIdentifier,
        pageNum: toEntityPage.value,
        pageSize: toEntityPageSize.value,
      });
      if (requestToken !== toEntityLoadToken.value) return;
      if (response.code !== 200 || !response.data) throw new Error(response.message || "实体列表加载失败");
      const records = Array.isArray(response.data.records) ? response.data.records : [];
      toEntityRows.value = records.map((item, index) => mapEntityRecordToRow(item, index));
      toEntityTotal.value = Number(response.data.total) || records.length;
      selectedToEntities.value = selectedToEntityRows.value;
    } catch (error) {
      if (requestToken !== toEntityLoadToken.value) return;
      toEntityRows.value = [];
      toEntityTotal.value = 0;
      toEntityError.value = error instanceof Error ? error.message : "实体列表加载失败";
    } finally {
      if (requestToken === toEntityLoadToken.value) toEntityLoading.value = false;
    }
  }

  /**
   * @description 切换 From 实体列表页码。
   * @param page 页码。
   */
  function changeFromEntityPage(page: number): void {
    fromEntityPage.value = page;
    void loadFromEntityList();
  }

  /**
   * @description 切换 From 实体列表每页条数。
   * @param size 每页条数。
   */
  function changeFromEntityPageSize(size: number): void {
    fromEntityPageSize.value = size;
    fromEntityPage.value = 1;
    void loadFromEntityList();
  }

  /**
   * @description 切换 To 实体列表页码。
   * @param page 页码。
   */
  function changeToEntityPage(page: number): void {
    toEntityPage.value = page;
    void loadToEntityList();
  }

  /**
   * @description 切换 To 实体列表每页条数。
   * @param size 每页条数。
   */
  function changeToEntityPageSize(size: number): void {
    toEntityPageSize.value = size;
    toEntityPage.value = 1;
    void loadToEntityList();
  }

  /**
   * @description 加载关系实例测试上下文：行为详情取 link id，再查关系两端并加载实体列表。
   */
  async function loadRelationTestContext(): Promise<void> {
    const actionApi = (props.behavior?.behaviorApiName ?? "").trim();
    const ontologySpaceId = props.spaceId.trim();
    const mountOntologyId = behaviorOntologyUniqueIdentifier.value;
    if (!actionApi) {
      clearRelationTestState();
      relationContextError.value = "当前行为缺少 apiName，无法加载关系信息";
      return;
    }
    if (!ontologySpaceId) {
      clearRelationTestState();
      relationContextError.value = "缺少对象空间 id，无法加载关系信息";
      return;
    }
    const requestToken = ++relationContextLoadToken.value;
    relationContextLoading.value = true;
    relationContextError.value = "";
    try {
      const detailResponse = await getOntologyActionInfoInterface({ actionApi, ontologySpaceId });
      if (requestToken !== relationContextLoadToken.value) return;
      if (detailResponse.code !== 200 || !detailResponse.data) throw new Error(detailResponse.message || "行为详情加载失败");
      resolvedActionApi.value = (detailResponse.data.actionApi ?? "").trim() || actionApi;
      const linkId = (detailResponse.data.linkMapping?.ontologyLinkUniqIdentifier ?? "").trim();
      if (!linkId) throw new Error("行为未配置关系唯一标识，无法测试");
      ontologyLinkUniqIdentifier.value = linkId;
      const linkResponse = await getOntologyLinkByUniqueIdentifierInterface({ uniqueIdentifier: linkId });
      if (requestToken !== relationContextLoadToken.value) return;
      if (linkResponse.code !== 200 || !linkResponse.data) throw new Error(linkResponse.message || "关系详情加载失败");
      const linkData = linkResponse.data;
      ontologyNameFrom.value = (linkData.ontologyNameFrom ?? "").trim();
      ontologyNameTo.value = (linkData.ontologyNameTo ?? "").trim();
      ontologyUniqueIdentifierFrom.value = (linkData.ontologyUniqueIdentifierFrom ?? "").trim();
      ontologyUniqueIdentifierTo.value = (linkData.ontologyUniqueIdentifierTo ?? "").trim();
      if (mountOntologyId && mountOntologyId === ontologyUniqueIdentifierFrom.value) {
        relationMountSide.value = "from";
      } else if (mountOntologyId && mountOntologyId === ontologyUniqueIdentifierTo.value) {
        relationMountSide.value = "to";
      } else {
        relationMountSide.value = "";
        throw new Error("行为挂载对象与关系两端不匹配，无法确定挂载侧实例");
      }
      fromEntityPage.value = 1;
      toEntityPage.value = 1;
      selectedFromEntityRowKeys.value = [];
      selectedFromEntities.value = [];
      selectedToEntityRowKeys.value = [];
      selectedToEntities.value = [];
      void loadFromEntityList();
      void loadToEntityList();
    } catch (error) {
      if (requestToken !== relationContextLoadToken.value) return;
      ontologyLinkUniqIdentifier.value = "";
      ontologyNameFrom.value = "";
      ontologyNameTo.value = "";
      ontologyUniqueIdentifierFrom.value = "";
      ontologyUniqueIdentifierTo.value = "";
      relationMountSide.value = "";
      fromEntityRows.value = [];
      toEntityRows.value = [];
      relationContextError.value = error instanceof Error ? error.message : "关系信息加载失败";
    } finally {
      if (requestToken === relationContextLoadToken.value) relationContextLoading.value = false;
    }
  }

  /**
   * @description 按属性类型组装外部输入 params；失败时返回错误文案。
   * @returns 成功时返回 params；失败时返回 error。
   */
  function buildExternalParamsPayload(): { params: Record<string, unknown> } | { error: string } {
    const payload: Record<string, unknown> = {};
    for (const row of paramRows.value) {
      const rawValue = paramValues[row.paramName] ?? "";
      const coerced = coerceBehaviorTestParamValue(rawValue, row.propertyType, row.propertyDisplayName || row.paramName);
      if (!coerced.ok) return { error: coerced.error };
      payload[row.paramName] = coerced.value;
    }
    return { params: payload };
  }

  /** @description 校验参数配置并组装请求，不执行行为。 @returns 参数请求或校验错误。 */
  function buildParameterRequest(): BuildApplicationTestRequestParamsResult {
    if (detailLoading.value || detailError.value || !resolvedActionApi.value) return { ok: false, error: detailError.value || "请等待行为参数加载完成" };
    if (applicationHasLinkMapping.value && (relationContextLoading.value || relationContextError.value))
      return { ok: false, error: relationContextError.value || "请等待关系信息加载完成" };
    if (applicationHasLinkMapping.value && (fromEntityLoading.value || toEntityLoading.value || fromEntityError.value || toEntityError.value))
      return { ok: false, error: fromEntityError.value || toEntityError.value || "请等待关系实例加载完成" };
    if (
      applicationOntologyPickers.value.some((item) => item.loading || item.error) ||
      applicationStorageGroupPickers.value.some((item) => item.entitySlots.some((slot) => slot.loading || slot.error))
    )
      return { ok: false, error: "请等待实例和数据行加载完成，加载失败时请重试" };
    const inputSelections = collectApplicationParamBindingSelections(
      applicationInputRows.value.filter((row) => normalizeApplicationSourceType(row.sourceType) === "PROPERTY"),
      "入参",
    );
    if (!inputSelections.ok) return inputSelections;
    const outputSelections = collectApplicationParamBindingSelections(applicationWritePropertyOutputRows.value, "出参");
    if (!outputSelections.ok) return outputSelections;
    if (applicationHasLinkMapping.value && (!selectedFromEntityRows.value.length || !selectedToEntityRows.value.length))
      return { ok: false, error: "请选择关系 From 和 To 两端实例" };
    const external = buildExternalParamsPayload();
    if ("error" in external) return { ok: false, error: external.error };
    return buildApplicationTestRequestParams({
      ontologySpaceId: props.spaceId.trim(),
      actionApi: resolvedActionApi.value.trim(),
      params: external.params,
      inputParamSelections: inputSelections.selections,
      outputParamSelections: outputSelections.selections,
      linkEntitySelection: applicationHasLinkMapping.value
        ? {
            ontologyUniqueIdentifierFrom: ontologyUniqueIdentifierFrom.value,
            ontologyUniqueIdentifierTo: ontologyUniqueIdentifierTo.value,
            primaryKeysFrom: selectedFromEntityRows.value.map((item) => item.savedPrimaryKey ?? item.primaryKey),
            primaryKeysTo: selectedToEntityRows.value.map((item) => item.savedPrimaryKey ?? item.primaryKey),
            mountSide: relationMountSide.value,
          }
        : null,
    });
  }

  const configurationError = ref("");
  /** @description 展示参数选择校验提示。 @param message 校验提示。 */
  function reportParameterError(message: string): void {
    configurationError.value = message;
  }
  /** @description 使所有参数请求失效，关闭或销毁后不再写入状态。 */
  function cancelParameterRequests(): void {
    detailLoadToken.value += 1;
    relationContextLoadToken.value += 1;
    fromEntityLoadToken.value += 1;
    toEntityLoadToken.value += 1;
    detailLoading.value = false;
    relationContextLoading.value = false;
    fromEntityLoading.value = false;
    toEntityLoading.value = false;
    for (const picker of applicationOntologyPickers.value) picker.loading = false;
    for (const picker of applicationStorageGroupPickers.value) {
      for (const slot of picker.entitySlots) slot.loading = false;
    }
    for (const key of Object.keys(applicationOntologyLoadTokens)) applicationOntologyLoadTokens[key] = (applicationOntologyLoadTokens[key] ?? 0) + 1;
    for (const key of Object.keys(applicationStorageGroupLoadTokens))
      applicationStorageGroupLoadTokens[key] = (applicationStorageGroupLoadTokens[key] ?? 0) + 1;
  }
  onScopeDispose(cancelParameterRequests);
  /** @description 校验并复制配置快照，不触发测试。 @returns 配置快照或校验错误。 */
  function createParameterSnapshot(): { ok: true; snapshot: BehaviorParameterSnapshot } | { ok: false; error: string } {
    const built = buildParameterRequest();
    if (!built.ok) return built;
    return {
      ok: true,
      snapshot: cloneBehaviorParameterSnapshot({
        actionApi: resolvedActionApi.value,
        spaceId: props.spaceId.trim(),
        request: built.request,
        values: paramValues,
        inputBindings: applicationInputBindingRecords.value,
        ontologyPickers: applicationOntologyPickers.value,
        storagePickers: applicationStorageGroupPickers.value,
        fromEntities: selectedFromEntityRows.value,
        toEntities: selectedToEntityRows.value,
      }),
    };
  }
  /** @description 恢复相同行为与空间的参数配置，拒绝错配快照。 @param snapshot 已保存配置。 @returns 是否成功恢复。 */
  function restoreParameterSnapshot(snapshot: BehaviorParameterSnapshot): boolean {
    if (snapshot.actionApi !== resolvedActionApi.value || snapshot.spaceId !== props.spaceId.trim() || detailError.value || detailLoading.value) return false;
    cancelParameterRequests();
    const copy = cloneBehaviorParameterSnapshot(snapshot);
    for (const key of Object.keys(paramValues)) delete paramValues[key];
    Object.assign(paramValues, copy.values);
    applicationInputBindingRecords.value = copy.inputBindings;
    applicationOntologyPickers.value = copy.ontologyPickers;
    applicationStorageGroupPickers.value = copy.storagePickers;
    selectedFromEntities.value = copy.fromEntities;
    selectedFromEntityRowKeys.value = copy.fromEntities.map((row) => row.rowKey);
    selectedToEntities.value = copy.toEntities;
    selectedToEntityRowKeys.value = copy.toEntities.map((row) => row.rowKey);
    return true;
  }

  return {
    loadApplicationTestForm,
    loadRelationTestContext,
    buildParameterRequest,
    updateParamValue,
    isApplicationTest,
    detailLoading,
    detailError,
    applicationInputRows,
    asApplicationInputRow,
    normalizeApplicationSourceType,
    paramValues,
    findApplicationOntologyPicker,
    updateApplicationOntologyEntitySelection,
    listApplicationOntologySelectOptions,
    formatApplicationEntityOptionLabel,
    changeApplicationOntologyEntityPage,
    findApplicationStorageGroupPickerForRow,
    updateApplicationStorageGroupRowSelection,
    listApplicationStorageGroupSlotOptions,
    formatApplicationStorageGroupOptionLabel,
    changeApplicationStorageGroupRowPage,
    addApplicationInputBindingRecords,
    formatApplicationInputBindingRecordsHint,
    listApplicationInputBindingRecords,
    formatApplicationInputBindingRecordLabel,
    removeApplicationInputBindingRecord,
    applicationWritePropertyOutputRows,
    showRelationLinkForm,
    relationContextLoading,
    relationContextError,
    ontologyNameFrom,
    ontologyNameTo,
    fromEntityLoading,
    fromEntityError,
    fromEntityRows,
    handleFromEntityRowClick,
    selectedFromEntityRowKeys,
    asEntityRow,
    toggleFromEntityRow,
    fromEntityTotal,
    fromEntityPage,
    fromEntityPageSize,
    changeFromEntityPage,
    changeFromEntityPageSize,
    toEntityLoading,
    toEntityError,
    toEntityRows,
    handleToEntityRowClick,
    selectedToEntityRowKeys,
    toggleToEntityRow,
    toEntityTotal,
    toEntityPage,
    toEntityPageSize,
    changeToEntityPage,
    changeToEntityPageSize,
    clearDetailParamState,
    detailLoadToken,
    applicationOntologyPickers,
    applicationStorageGroupPickers,
    applicationInputBindingRecords,
    applicationHasLinkMapping,
    clearRelationTestState,
    resolvedActionApi,
    resolvedStorageGroup,
    resolvedOntologyUniqIdentifier,
    filterWritePropertyOutputRows,
    mapExternalParamRows,
    paramRows,
    resetParamValues,
    loadApplicationOntologyEntityList,
    loadApplicationLinkContext,
    behaviorOntologyUniqueIdentifier,
    relationContextLoadToken,
    ontologyLinkUniqIdentifier,
    ontologyUniqueIdentifierFrom,
    ontologyUniqueIdentifierTo,
    relationMountSide,
    selectedFromEntities,
    selectedToEntities,
    loadFromEntityList,
    loadToEntityList,
    collectApplicationParamBindingSelections,
    selectedFromEntityRows,
    selectedToEntityRows,
    buildExternalParamsPayload,
    patchApplicationOntologyPicker,
    clearApplicationStorageGroupSelectionsForParam,
    syncApplicationStorageGroupSlotsForParam,
    findApplicationStorageGroupPicker,
    findApplicationStorageGroupEntitySlot,
    patchApplicationStorageGroupEntitySlot,
    loadApplicationStorageGroupDataRows,
    buildApplicationInputBindingRecordKey,
    clearApplicationInputParamDraft,
    formatPrimaryKeyLabel,
    isRelationInstanceTest,
    clearApplicationTestFormState,
    applicationOntologyLoadTokens,
    mapEntityRecordToRow,
    fromEntityLoadToken,
    toEntityLoadToken,
    patchApplicationStorageGroupPicker,
    applicationStorageGroupLoadTokens,
    readEntityPrimaryKey,
    readEntityDisplayName,
    readEntityOntologyName,
    buildEntityPropertySummary,
    formatApplicationInputSourceTypeLabel,
    formatApplicationOutputModeLabel,
    configurationError,
    cancelParameterRequests,
    createParameterSnapshot,
    restoreParameterSnapshot,
  };
}
