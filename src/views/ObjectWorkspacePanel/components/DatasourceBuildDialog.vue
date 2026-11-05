<template>
  <el-dialog v-model="visible" class="datasource-build-dialog" title="数据源构建对象" width="min(980px, 92vw)" append-to-body destroy-on-close>
    <el-steps :active="step" align-center class="datasource-build-dialog__steps"
      ><el-step title="选择 schema" /><el-step title="选择数据库表" /><el-step title="字段与外键"
    /></el-steps>
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <section v-if="step === 0" v-loading="busy" class="datasource-build-dialog__tables">
      <el-form label-position="top" :disabled="busy">
        <el-form-item label="对象名称" required>
          <el-input v-model="objectName" maxlength="64" placeholder="请输入对象名称" ariaLabel="对象名称" />
        </el-form-item>
        <el-form-item label="对象分类" required>
          <el-tree-select
            v-model="categoryId"
            :data="categoryTree"
            check-strictly
            filterable
            :render-after-expand="false"
            node-key="id"
            :props="{ label: 'label', children: 'children' }"
            placeholder="请选择对象分类"
            ariaLabel="对象分类"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <p>选择当前空间的数据源 schema</p>
      <el-select v-model="schemaName" placeholder="请选择 schema" :ariaLabel="'选择 schema'" :disabled="busy" @change="resetTableSelection">
        <el-option v-for="item in schemas" :key="item.schemaName" :label="item.schemaName" :value="item.schemaName" />
      </el-select>
      <el-empty v-if="!busy && !schemas.length && !error" description="当前空间暂无 schema" />
      <el-button v-if="error" :disabled="busy" @click="loadSchemas">重新查询</el-button>
    </section>
    <section v-else-if="step === 1" v-loading="busy" class="datasource-build-dialog__tables">
      <p>勾选需要的数据表，并指定唯一主表（子表可选）</p>
      <el-table :data="tables" class="datasource-build-dialog__table" height="100%"
        ><el-table-column label="选用" width="64" align="center"
          ><template #default="{ row }"
            ><el-checkbox
              :model-value="selected.includes(String(row.id))"
              @update:model-value="setTableSelected(String(row.id), $event)" /></template></el-table-column
        ><el-table-column label="主表" width="64" align="center"
          ><template #default="{ row }"
            ><el-radio
              :model-value="primary"
              :value="String(row.id)"
              :disabled="!selected.includes(String(row.id))"
              @update:model-value="setPrimary(String($event), true)" /></template></el-table-column
        ><el-table-column prop="name" label="表名" min-width="260" /><el-table-column label="APIName" min-width="220"
          ><template #default="{ row }"><el-input v-model="row.storageName" placeholder="请输入 APIName" maxlength="64" /></template></el-table-column
        ><el-table-column label="说明" min-width="300"
          ><template #default="{ row }"><el-input v-model="row.comment" placeholder="请输入说明" :ariaLabel="`${row.name}说明`" /></template></el-table-column
        ><el-table-column label="字段数" width="140" align="center"
          ><template #default="{ row }">{{ row.fields.length }}</template></el-table-column
        ></el-table
      >
    </section>
    <section v-else v-loading="busy" class="datasource-build-dialog__fields">
      <aside class="datasource-build-dialog__field-nav">
        <button
          v-for="table in selectedTables"
          :key="table.id"
          type="button"
          :class="{ 'is-active': activeTableId === table.id }"
          @click="activeTableId = table.id"
        >
          <strong>{{ table.name }}</strong
          ><span>{{ table.id === primary ? "主表" : "子表" }}</span>
        </button>
      </aside>
      <div class="datasource-build-dialog__field-content">
        <header>
          <h2>选择「{{ activeTable?.name }}」字段</h2>
          <div><el-button @click="selectAllFields">全选</el-button><el-button @click="clearFields">清空</el-button></div>
        </header>
        <el-table v-if="activeTable" :data="activeTable.fields" row-key="id" class="datasource-build-dialog__field-list">
          <el-table-column label="选用" width="64" align="center">
            <template #default="{ row }">
              <span :title="isSupportedFieldType(row.dataType) ? '' : '该数据类型不支持创建属性'">
                <el-checkbox
                  :model-value="(fieldIdsByTable[activeTable.id] || []).includes(row.id)"
                  :ariaLabel="`选用字段 ${row.name}`"
                  :disabled="!isSupportedFieldType(row.dataType)"
                  @update:model-value="setFieldSelected(activeTable.id, row.id, $event)"
                />
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="属性名" min-width="180" show-overflow-tooltip />
          <el-table-column prop="dataType" label="数据类型" width="120" />
          <el-table-column label="说明" min-width="240">
            <template #default="{ row }"><el-input v-model="row.description" placeholder="请输入属性说明" :ariaLabel="`${row.name}属性说明`" /></template>
          </el-table-column>
        </el-table>
        <div v-if="childTables.length" class="datasource-build-dialog__foreign-keys">
          <h2>外键关联（子表 → 主表）</h2>
          <div v-for="table in childTables" :key="table.id" class="datasource-build-dialog__foreign-key-row">
            <strong class="datasource-build-dialog__table-name" :title="table.name">{{ table.name }}</strong
            ><el-select
              :model-value="foreignKeys[table.id]?.childFieldId || ''"
              placeholder="子表外键字段"
              @update:model-value="setForeignKeyField(table.id, 'childFieldId', $event)"
              ><el-option v-for="field in table.fields" :key="field.id" :label="field.name" :value="field.id" /></el-select
            ><span>→</span>
            <strong class="datasource-build-dialog__table-name" :title="primaryTable?.name">{{ primaryTable?.name }}</strong>
            <el-select
              :model-value="foreignKeys[table.id]?.parentFieldId || ''"
              placeholder="主表关联字段"
              @update:model-value="setForeignKeyField(table.id, 'parentFieldId', $event)"
              ><el-option v-for="field in primaryTable?.fields || []" :key="field.id" :label="field.name" :value="field.id"
            /></el-select>
          </div>
        </div>
      </div>
    </section>
    <template #footer>
      <div class="datasource-build-dialog__footer">
        <span />
        <div class="datasource-build-dialog__footer-actions">
          <el-button @click="visible = false">取消</el-button>
          <el-button v-if="step > 0" :disabled="busy" @click="step -= 1">上一步</el-button>
          <el-button type="primary" :loading="busy" @click="nextStep">{{ step === 2 ? "创建" : "下一步" }}</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed, reactive, ref, watch, onBeforeUnmount } from "vue";
import { ElLoading } from "element-plus";
import { getDatasourceSchemaListInterface, getDatasourceTableColumnsInterface, getDatasourceTableListInterface } from "@/apis";
import type { DatasourceBuildSelection, DatasourceSchema, DatasourceTable } from "@/types";
interface CategoryOption {
  id: string;
  label: string;
  children: CategoryOption[];
}
const props = defineProps<{ spaceId: string; categoryTree: CategoryOption[] }>();
const vLoading = ElLoading.directive;
const visible = defineModel<boolean>({ required: true });
const emit = defineEmits<{ submit: [value: DatasourceBuildSelection, objectInfo: { displayName: string; categoryId: string }] }>();
const objectName = ref("");
const categoryId = ref("");
const step = ref(0);
const busy = ref(false);
const error = ref("");
const schemas = ref<DatasourceSchema[]>([]);
const schemaName = ref("");
const tables = ref<DatasourceTable[]>([]);
let generation = 0;
const selected = ref<string[]>([]);
const primary = ref("");
const activeTableId = ref("");
const fieldIdsByTable = reactive<Record<string, string[]>>({});
const foreignKeys = reactive<Record<string, { childFieldId: string; parentFieldId: string }>>({});
const selectedTables = computed(() => tables.value.filter((table) => selected.value.includes(table.id)));
const childTables = computed(() => selectedTables.value.filter((table) => table.id !== primary.value));
const primaryTable = computed(() => tables.value.find((table) => table.id === primary.value));
const activeTable = computed(() => selectedTables.value.find((table) => table.id === activeTableId.value) || selectedTables.value[0]);
const supportedFieldTypes = new Set(["Boolean", "Int", "Long", "Float", "Short", "Byte", "Double", "Decimal", "String", "Date", "Array", "Timestamp"]);

/**
 * @description 按属性创建允许的类型判断数据源字段能否作为属性。
 * @param dataType 接口返回的本体类型，缺失时为数据库原生类型。
 * @returns 支持创建属性时返回 true。
 */
function isSupportedFieldType(dataType: string): boolean {
  return supportedFieldTypes.has(dataType.trim());
}
/** @description 更新选中的数据库表。 */
function setTableSelected(tableId: string, checked: string | number | boolean): void {
  selected.value = checked ? [...new Set([...selected.value, tableId])] : selected.value.filter((id) => id !== tableId);
  if (!selected.value.includes(primary.value)) primary.value = selected.value.length === 1 ? (selected.value[0] ?? "") : "";
}
/**
 * @description 更新主表选择并清理针对旧主表配置的外键。
 * @param tableId 主表标识。
 * @param checked 是否选为主表。
 */
function setPrimary(tableId: string, checked: string | number | boolean | undefined): void {
  if (checked && primary.value !== tableId) {
    primary.value = tableId;
    for (const key of Object.keys(foreignKeys)) delete foreignKeys[key];
  }
}
/** @description 更新子表外键字段。 */
function setForeignKeyField(tableId: string, field: "childFieldId" | "parentFieldId", value: string | number | boolean | undefined): void {
  foreignKeys[tableId] ??= { childFieldId: "", parentFieldId: "" };
  foreignKeys[tableId][field] = String(value ?? "");
}
/**
 * @description 更新当前表中单个字段的勾选，保留其他字段和说明。
 * @param tableId 数据表标识。
 * @param fieldId 字段标识。
 * @param checked 是否选用。
 */
function setFieldSelected(tableId: string, fieldId: string, checked: string | number | boolean): void {
  const field = tables.value.find((table) => table.id === tableId)?.fields.find((item) => item.id === fieldId);
  if (checked && (!field || !isSupportedFieldType(field.dataType))) return;
  const current = fieldIdsByTable[tableId] || [];
  fieldIdsByTable[tableId] = checked ? [...new Set([...current, fieldId])] : current.filter((id) => id !== fieldId);
}
/** @description 清空切换 schema 后不再适用的表、字段和外键。 */
function resetTableSelection(): void {
  generation++;
  busy.value = false;
  tables.value = [];
  selected.value = [];
  primary.value = "";
  activeTableId.value = "";
  error.value = "";
  for (const key of Object.keys(fieldIdsByTable)) delete fieldIdsByTable[key];
  for (const key of Object.keys(foreignKeys)) delete foreignKeys[key];
}
watch(
  [visible, () => props.spaceId],
  ([opened]) => {
    resetTableSelection();
    schemas.value = [];
    schemaName.value = "";
    step.value = 0;
    objectName.value = "";
    categoryId.value = "";
    if (opened) void loadSchemas();
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  generation++;
});
/** @description 按当前空间查询 schema，阻止重复查询并忽略过期响应。 */
async function loadSchemas(): Promise<void> {
  if (busy.value) return;
  const spaceId = Number(props.spaceId);
  if (!Number.isInteger(spaceId) || spaceId <= 0) {
    error.value = "缺少有效空间 ID";
    return;
  }
  const token = ++generation;
  busy.value = true;
  error.value = "";
  try {
    const response = await getDatasourceSchemaListInterface({ spaceId });
    if (token !== generation) return;
    if (response.code !== 200) throw new Error(response.message || "Schema 查询失败");
    schemas.value = response.data;
  } catch (cause) {
    if (token === generation) error.value = cause instanceof Error ? cause.message : "Schema 查询失败";
  } finally {
    if (token === generation) busy.value = false;
  }
}
/** @description 推进数据源构建向导并校验当前步骤。 */
async function nextStep(): Promise<void> {
  if (busy.value) return;
  error.value = "";
  const token = generation;
  busy.value = true;
  try {
    if (step.value === 0 || step.value === 2) {
      if (!objectName.value.trim()) {
        error.value = "请输入对象名称";
        return;
      }
      if (!hasObjectCategory(props.categoryTree, categoryId.value)) {
        error.value = "请选择有效的对象分类";
        return;
      }
    }
    if (step.value === 0) {
      if (!schemaName.value) {
        error.value = "请选择 schema";
        return;
      }
      const response = await getDatasourceTableListInterface({ spaceId: Number(props.spaceId), schemaName: schemaName.value });
      if (token !== generation) return;
      if (response.code !== 200) throw new Error(response.message || "数据表加载失败");
      tables.value = response.data.map((table) => ({
        id: table.tableName,
        name: table.tableName,
        storageName: table.tableName,
        comment: table.tableComment || "",
        fields: Array.from({ length: table.columnCount }, (_, index) => ({ id: `${table.tableName}-${index}`, name: "", dataType: "" })),
      }));
      selected.value = [];
      primary.value = "";
      step.value = 1;
      return;
    }
    if (step.value === 1) {
      if (!selected.value.length || !selected.value.includes(primary.value)) {
        error.value = "请选择数据表并指定主表";
        return;
      }
      if (selectedTables.value.some((table) => !table.storageName.trim())) {
        error.value = "请输入所选数据表的 APIName";
        return;
      }
      const response = await getDatasourceTableColumnsInterface({
        spaceId: Number(props.spaceId),
        schemaName: schemaName.value,
        tableNames: selectedTables.value.map((table) => table.name),
      });
      if (token !== generation) return;
      if (response.code !== 200) throw new Error(response.message || "字段加载失败");
      const details = new Map(response.data.map((detail) => [detail.tableName, detail]));
      for (const table of selectedTables.value) {
        const detail = details.get(table.name);
        const previousFields = new Map(table.fields.map((field) => [field.id, field]));
        table.fields = (detail?.columns || []).map((field) => ({
          id: `${table.id}-${field.columnName}`,
          name: field.columnName,
          dataType: field.ontologyDataType || field.nativeType,
          description: previousFields.get(`${table.id}-${field.columnName}`)?.description ?? field.description ?? "",
        }));
        fieldIdsByTable[table.id] =
          fieldIdsByTable[table.id]?.filter((id) => table.fields.some((field) => field.id === id && isSupportedFieldType(field.dataType))) ??
          table.fields.filter((field) => isSupportedFieldType(field.dataType)).map((field) => field.id);
        if (table.id !== primary.value) foreignKeys[table.id] ??= { childFieldId: "", parentFieldId: "" };
      }
      activeTableId.value = primary.value;
      step.value = 2;
      return;
    }
    for (const table of selectedTables.value) {
      if ((fieldIdsByTable[table.id] ?? []).some((id) => !table.fields.some((field) => field.id === id && isSupportedFieldType(field.dataType)))) {
        error.value = `数据表「${table.name}」包含不支持的数据类型，请重新选择字段`;
        return;
      }
    }
    if (!fieldIdsByTable[primary.value]?.length) {
      error.value = "主表请至少选择一个字段";
      return;
    }
    for (const table of childTables.value)
      if (!fieldIdsByTable[table.id]?.length || !foreignKeys[table.id]?.childFieldId || !foreignKeys[table.id]?.parentFieldId) {
        error.value = `请完成子表「${table.name}」字段和外键配置`;
        return;
      }
    emit(
      "submit",
      {
        schemaName: schemaName.value,
        primaryTableId: primary.value,
        selectedTableIds: [...selected.value],
        selectedTables: selectedTables.value.map((table) => ({ ...table, fields: table.fields.map((field) => ({ ...field })) })),
        fieldIdsByTable: { ...fieldIdsByTable },
        foreignKeys: Object.fromEntries(
          childTables.value.map((table) => [
            table.id,
            {
              childFieldId: foreignKeys[table.id]?.childFieldId ?? "",
              parentFieldId: foreignKeys[table.id]?.parentFieldId ?? "",
            },
          ]),
        ),
      },
      { displayName: objectName.value.trim(), categoryId: categoryId.value },
    );
    visible.value = false;
  } catch (cause) {
    if (token === generation) error.value = cause instanceof Error ? cause.message : "数据查询失败";
  } finally {
    if (token === generation) busy.value = false;
  }
}

/**
 * @description 校验所选分类属于当前空间分类树。
 * @param nodes 当前分类选项。
 * @param selectedId 所选分类标识。
 * @returns 分类有效时返回 true。
 */
function hasObjectCategory(nodes: CategoryOption[], selectedId: string): boolean {
  return nodes.some((node) => node.id === selectedId || hasObjectCategory(node.children, selectedId));
}
/** @description 全选当前表中类型受支持的字段。 */
function selectAllFields(): void {
  if (activeTable.value)
    fieldIdsByTable[activeTable.value.id] = activeTable.value.fields.filter((field) => isSupportedFieldType(field.dataType)).map((field) => field.id);
}
/** @description 清空当前表字段。 */
function clearFields(): void {
  if (activeTable.value) fieldIdsByTable[activeTable.value.id] = [];
}
</script>
<style scoped lang="scss">
.datasource-build-dialog__steps {
  margin: 0 10% 32px;
}
.datasource-build-dialog :deep(.el-dialog) {
  max-height: 82vh;
  margin: 9vh auto !important;
}
.datasource-build-dialog :deep(.el-dialog__body) {
  max-height: calc(82vh - 150px);
  overflow: auto;
}
.datasource-build-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}
.datasource-build-dialog__footer-actions {
  display: flex;
  gap: 8px;
}
.datasource-build-dialog__tables,
.datasource-build-dialog__field-nav,
.datasource-build-dialog__field-content {
  border: 1px solid var(--aircas-color-border);
  border-radius: 10px;
  background: var(--aircas-color-panel-background-deep);
}
.datasource-build-dialog__field-content h2 {
  margin: 0 0 16px;
  color: var(--aircas-color-text-primary);
  font-size: 18px;
}
.datasource-build-dialog__tables {
  display: flex;
  height: 460px;
  flex-direction: column;
  overflow: auto;
  padding: 18px;
}
.datasource-build-dialog__table {
  min-height: 0;
  flex: 1;
}
.datasource-build-dialog__tables > p {
  margin: 0 0 16px;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
}
.datasource-build-dialog__fields {
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr);
  gap: 18px;
  height: 460px;
  overflow: auto;
}
.datasource-build-dialog__field-nav {
  padding: 12px;
}
.datasource-build-dialog__field-nav button {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
  padding: 14px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--aircas-color-text-secondary);
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.datasource-build-dialog__field-nav button.is-active,
.datasource-build-dialog__field-nav button:hover {
  border-color: var(--aircas-color-primary);
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-effect-primary-soft);
}
.datasource-build-dialog__field-content {
  padding: 18px;
}
.datasource-build-dialog__field-content header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.datasource-build-dialog__field-list {
  width: 100%;
  margin: 14px 0 24px;
}
.datasource-build-dialog__foreign-keys {
  padding-top: 18px;
}
.datasource-build-dialog__foreign-key-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(100px, 1.2fr) 20px minmax(0, 1fr) minmax(100px, 1.2fr);
  gap: 12px;
  align-items: center;
  margin-top: 12px;
}
.datasource-build-dialog__table-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 800px) {
  .datasource-build-dialog__fields {
    grid-template-columns: 1fr;
  }
  .datasource-build-dialog__foreign-key-row {
    grid-template-columns: 1fr;
  }
}
</style>
