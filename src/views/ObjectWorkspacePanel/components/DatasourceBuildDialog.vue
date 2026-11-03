<template>
  <el-dialog v-model="visible" class="datasource-build-dialog" title="数据源构建对象" width="min(980px, 92vw)" append-to-body destroy-on-close>
    <el-steps :active="step" align-center class="datasource-build-dialog__steps"
      ><el-step title="连接数据库" /><el-step title="填写数据库信息" /><el-step title="选择数据库表" /><el-step title="字段与外键"
    /></el-steps>
    <section v-if="step === 0" class="datasource-build-dialog__history">
      <header>
        <h2>历史连接</h2>
        <el-button type="primary" @click="openNewConnection">新建连接</el-button>
      </header>
      <button v-for="item in datasourceHistory" :key="item.id" type="button" class="datasource-build-dialog__history-item" @click="applyHistory(item)">
        <strong>{{ item.dbType }} · {{ item.dbName || item.name }}</strong
        ><span>{{ item.host }}:{{ item.port }} · {{ item.username }}</span
        ><small>{{ item.updateTime || item.createTime || "" }}</small>
      </button>
    </section>
    <section v-else-if="step === 1" class="datasource-build-dialog__connection">
      <div class="datasource-build-dialog__connection-form">
        <div class="datasource-build-dialog__form-grid">
          <label
            >数据库类型<el-select :model-value="connection.dbType" @update:model-value="setDatabaseType"
              ><el-option label="MySQL" value="mysql" /><el-option label="PostgreSQL" value="postgresql" /></el-select></label
          ><label>端口<el-input-number :model-value="connection.port" :min="1" :max="65535" controls-position="right" @update:model-value="setPort" /></label>
        </div>
        <label>数据库地址<el-input v-model="connection.host" placeholder="如 10.12.8.21 或 127.0.0.1" /></label>
        <div class="datasource-build-dialog__form-grid">
          <label>数据库名<el-input v-model="connection.database" placeholder="数据库名称" /></label>
          <label v-if="connection.dbType === 'postgresql'">Schema 名称<el-input v-model="connection.schemaName" placeholder="如 public" /></label>
        </div>
        <div class="datasource-build-dialog__form-grid">
          <label>用户名<el-input v-model="connection.username" /></label
          ><label>密码<el-input v-model="connection.password" type="password" show-password /></label>
        </div>
        <el-alert v-if="connected" title="连接成功" type="success" :closable="false" /><el-alert v-if="error" :title="error" type="error" :closable="false" />
      </div>
    </section>
    <section v-else-if="step === 2" class="datasource-build-dialog__tables">
      <p>勾选需要的数据表，并指定唯一主表（子表可选）</p>
      <el-table :data="tables" class="datasource-build-dialog__table" height="100%"
        ><el-table-column label="选用" width="120" align="center"
          ><template #default="{ row }"
            ><el-checkbox
              :model-value="selected.includes(String(row.id))"
              @update:model-value="setTableSelected(String(row.id), $event)" /></template></el-table-column
        ><el-table-column label="主表" width="120" align="center"
          ><template #default="{ row }"
            ><el-radio
              :model-value="primary"
              :value="String(row.id)"
              :disabled="!selected.includes(String(row.id))"
              @update:model-value="setPrimary(String($event), true)" /></template></el-table-column
        ><el-table-column prop="name" label="表名" min-width="260" /><el-table-column label="入库名" min-width="220"
          ><template #default="{ row }"><el-input v-model="row.storageName" placeholder="请输入入库名" maxlength="64" /></template></el-table-column
        ><el-table-column prop="comment" label="说明" min-width="300" /><el-table-column label="字段数" width="140" align="center"
          ><template #default="{ row }">{{ row.fields.length }}</template></el-table-column
        ></el-table
      ><el-alert v-if="error" :title="error" type="error" :closable="false" />
    </section>
    <section v-else class="datasource-build-dialog__fields">
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
        <el-checkbox-group
          v-if="activeTable"
          :model-value="fieldIdsByTable[activeTable.id] || []"
          class="datasource-build-dialog__field-list"
          @update:model-value="setFieldSelection(activeTable.id, $event)"
          ><el-checkbox v-for="field in activeTable.fields" :key="field.id" :value="field.id"
            >{{ field.name }} <span>{{ field.dataType }}</span></el-checkbox
          ></el-checkbox-group
        >
        <div v-if="childTables.length" class="datasource-build-dialog__foreign-keys">
          <h2>外键关联（子表 → 主表）</h2>
          <div v-for="table in childTables" :key="table.id" class="datasource-build-dialog__foreign-key-row">
            <strong>{{ table.name }}</strong
            ><el-select
              :model-value="foreignKeys[table.id]?.childFieldId || ''"
              placeholder="子表外键字段"
              @update:model-value="setForeignKeyField(table.id, 'childFieldId', $event)"
              ><el-option v-for="field in table.fields" :key="field.id" :label="field.name" :value="field.id" /></el-select
            ><span>→</span
            ><el-select
              :model-value="foreignKeys[table.id]?.parentFieldId || ''"
              placeholder="主表关联字段"
              @update:model-value="setForeignKeyField(table.id, 'parentFieldId', $event)"
              ><el-option v-for="field in primaryTable?.fields || []" :key="field.id" :label="field.name" :value="field.id"
            /></el-select>
          </div>
        </div>
        <el-alert v-if="error" :title="error" type="error" :closable="false" />
      </div>
    </section>
    <template #footer>
      <div class="datasource-build-dialog__footer">
        <el-button v-if="step === 1" :loading="testing" @click="testConnection">测试连接</el-button>
        <span v-else />
        <div class="datasource-build-dialog__footer-actions">
          <el-button @click="visible = false">取消</el-button>
          <el-button v-if="step > 0" @click="step -= 1">上一步</el-button>
          <el-button v-if="step > 0" type="primary" @click="nextStep">{{ step === 3 ? "创建" : "下一步" }}</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  getDatasourceConnectionListInterface,
  getDatasourceTableColumnsInterface,
  getDatasourceTableListInterface,
  postDatasourceConnectionInterface,
  postDatasourceConnectionTestInterface,
} from "@/apis";
import { validateDatasourceConnection } from "@/mocks/datasourceBuildMock/datasourceBuildMock";
import type { DatasourceBuildSelection, DatasourceConnection, DatasourceConnectionItem, DatasourceConnectionParam, DatasourceTable } from "@/types";
const visible = defineModel<boolean>({ required: true });
const emit = defineEmits<{ submit: [value: DatasourceBuildSelection] }>();
const step = ref(0);
const testing = ref(false);
const connected = ref(false);
const error = ref("");
const tables = ref<DatasourceTable[]>([]);
const datasourceHistory = ref<DatasourceConnectionItem[]>([]);
const datasourceId = ref<number>();
const selected = ref<string[]>([]);
const primary = ref("");
const activeTableId = ref("");
const fieldIdsByTable = reactive<Record<string, string[]>>({});
const foreignKeys = reactive<Record<string, { childFieldId: string; parentFieldId: string }>>({});
const connection = reactive<DatasourceConnection>({ dbType: "mysql", host: "", port: 3306, database: "", schemaName: "", username: "", password: "" });
const selectedTables = computed(() => tables.value.filter((table) => selected.value.includes(table.id)));
const childTables = computed(() => selectedTables.value.filter((table) => table.id !== primary.value));
const primaryTable = computed(() => tables.value.find((table) => table.id === primary.value));
const activeTable = computed(() => selectedTables.value.find((table) => table.id === activeTableId.value) || selectedTables.value[0]);
/** @description 更新选中的数据库表。 */
function setTableSelected(tableId: string, checked: string | number | boolean): void {
  selected.value = checked ? [...new Set([...selected.value, tableId])] : selected.value.filter((id) => id !== tableId);
}
/** @description 更新数据库连接端口。 */
function setPort(value: number | undefined): void {
  if (value !== undefined) connection.port = value;
}
/**
 * @description 更新数据库类型并清理不适用于其他数据库的 Schema 名称。
 * @param value 数据库类型。
 */
function setDatabaseType(value: string | number | boolean | undefined): void {
  if (value !== "mysql" && value !== "postgresql") return;
  connection.dbType = value;
  if (value !== "postgresql") connection.schemaName = "";
}
/** @description 更新主表选择。 */
function setPrimary(tableId: string, checked: string | number | boolean | undefined): void {
  if (checked) primary.value = tableId;
}
/** @description 更新子表外键字段。 */
function setForeignKeyField(tableId: string, field: "childFieldId" | "parentFieldId", value: string | number | boolean | undefined): void {
  foreignKeys[tableId] ??= { childFieldId: "", parentFieldId: "" };
  foreignKeys[tableId][field] = String(value ?? "");
}
/** @description 更新当前表的字段选择。 */
function setFieldSelection(tableId: string, values: Array<string | number>): void {
  fieldIdsByTable[tableId] = values.map(String);
}
watch(visible, (opened) => {
  if (opened) {
    step.value = 0;
    connected.value = false;
    error.value = "";
    void loadDatasourceHistory();
  }
});
/** @description 加载后端保存的数据源连接列表。 */
async function loadDatasourceHistory(): Promise<void> {
  try {
    const response = await getDatasourceConnectionListInterface({ pageNum: 1, pageSize: 100 });
    if (response.code !== 200) throw new Error(response.message || "历史连接加载失败");
    datasourceHistory.value = response.data.records;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "历史连接加载失败";
  }
}
/** @description 将当前表单转换为数据源连接接口请求体。 */
function toDatasourceConnectionParam(): DatasourceConnectionParam {
  return {
    name: `${connection.dbType}-${connection.database}`,
    dbType: connection.dbType.toUpperCase(),
    jdbcUrl: `jdbc:${connection.dbType}://${connection.host}:${connection.port}/${connection.database}`,
    host: connection.host,
    port: connection.port,
    dbName: connection.database,
    ...(connection.dbType === "postgresql" && connection.schemaName.trim() ? { schemaName: connection.schemaName.trim() } : {}),
    username: connection.username,
    password: connection.password || undefined,
    status: 1,
  };
}
/** @description 测试真实数据源连接，并在新建连接时保存数据源。 */
async function testConnection(): Promise<void> {
  testing.value = true;
  error.value = validateDatasourceConnection(connection) || "";
  if (error.value) {
    testing.value = false;
    return;
  }
  try {
    const tested = await postDatasourceConnectionTestInterface(toDatasourceConnectionParam(), datasourceId.value);
    if (tested.code !== 200) throw new Error(tested.message || "数据库连接测试失败");
    if (datasourceId.value === undefined) {
      const created = await postDatasourceConnectionInterface(toDatasourceConnectionParam());
      if (created.code !== 200) throw new Error(created.message || "数据源保存失败");
      datasourceId.value = created.data.id;
    }
    connected.value = true;
  } catch (cause) {
    connected.value = false;
    error.value = cause instanceof Error ? cause.message : "数据库连接测试失败";
  } finally {
    testing.value = false;
  }
}
/** @description 打开空白数据库连接表单。 */
function openNewConnection(): void {
  Object.assign(connection, { dbType: "mysql", host: "", port: 3306, database: "", schemaName: "", username: "", password: "" });
  connected.value = false;
  error.value = "";
  datasourceId.value = undefined;
  step.value = 1;
}
/** @description 回填历史连接并进入数据库信息确认步骤。 */
function applyHistory(item: DatasourceConnectionItem): void {
  Object.assign(connection, {
    dbType: item.dbType.toLowerCase() as DatasourceConnection["dbType"],
    host: item.host || "",
    port: item.port || 0,
    database: item.dbName || "",
    schemaName: item.schemaName || "",
    username: item.username || "",
    password: "",
  });
  datasourceId.value = item.id;
  connected.value = false;
  error.value = "";
  step.value = 1;
}
/** @description 推进数据源构建向导并校验当前步骤。 */
async function nextStep(): Promise<void> {
  error.value = "";
  if (step.value === 0) {
    error.value = "请选择历史连接或新建连接";
    return;
  }
  if (step.value === 1) {
    if (!connected.value) {
      error.value = "请先测试连接并确认成功";
      return;
    }
    if (datasourceId.value === undefined) {
      error.value = "缺少数据源 id，请先测试连接";
      return;
    }
    const response = await getDatasourceTableListInterface(datasourceId.value);
    if (response.code !== 200) {
      error.value = response.message || "数据表加载失败";
      return;
    }
    tables.value = response.data.map((table) => ({
      id: table.tableName,
      name: table.tableName,
      storageName: table.tableName,
      comment: table.tableComment || "",
      fields: Array.from({ length: table.columnCount }, (_, index) => ({ id: `${table.tableName}-${index}`, name: "", dataType: "" })),
    }));
    selected.value = [];
    primary.value = "";
    step.value = 2;
    return;
  }
  if (step.value === 2) {
    if (!selected.value.length || !primary.value) {
      error.value = "请选择数据表并指定主表";
      return;
    }
    if (datasourceId.value === undefined) {
      error.value = "缺少数据源 id，请重新测试连接";
      return;
    }
    if (selectedTables.value.some((table) => !table.storageName.trim())) {
      error.value = "请输入所选数据表的入库名";
      return;
    }
    const response = await getDatasourceTableColumnsInterface({
      datasourceId: datasourceId.value,
      tableNames: selectedTables.value.map((table) => table.name),
    });
    if (response.code !== 200) {
      error.value = response.message || "字段加载失败";
      return;
    }
    const details = new Map(response.data.map((detail) => [detail.tableName, detail]));
    for (const table of selectedTables.value) {
      const detail = details.get(table.name);
      table.fields = (detail?.columns || []).map((field) => ({
        id: `${table.id}-${field.columnName}`,
        name: field.columnName,
        dataType: field.ontologyDataType || field.nativeType,
      }));
      fieldIdsByTable[table.id] = table.fields.map((field) => field.id);
      if (table.id !== primary.value) foreignKeys[table.id] = { childFieldId: "", parentFieldId: "" };
    }
    activeTableId.value = primary.value;
    step.value = 3;
    return;
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
  const currentDatasourceId = datasourceId.value;
  if (currentDatasourceId === undefined) {
    error.value = "缺少数据源 id，请重新测试连接";
    return;
  }
  emit("submit", {
    datasourceId: currentDatasourceId,
    primaryTableId: primary.value,
    selectedTableIds: [...selected.value],
    selectedTables: selectedTables.value.map((table) => ({ ...table, fields: table.fields.map((field) => ({ ...field })) })),
    fieldIdsByTable: { ...fieldIdsByTable },
    foreignKeys: { ...foreignKeys },
  });
  visible.value = false;
}
/** @description 全选当前表字段。 */
function selectAllFields(): void {
  if (activeTable.value) fieldIdsByTable[activeTable.value.id] = activeTable.value.fields.map((field) => field.id);
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
.datasource-build-dialog__connection {
  display: block;
  height: 460px;
  overflow: auto;
}
.datasource-build-dialog__history {
  display: flex;
  height: 460px;
  flex-direction: column;
  gap: 12px;
  overflow: auto;
  padding: 18px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 10px;
  background: var(--aircas-color-panel-background-deep);
}
.datasource-build-dialog__history header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.datasource-build-dialog__history h2 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 18px;
}
.datasource-build-dialog__history-item {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 5px;
  padding: 14px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  color: var(--aircas-color-text-secondary);
  background: var(--aircas-color-card-background);
  text-align: left;
  cursor: pointer;
}
.datasource-build-dialog__history-item:hover,
.datasource-build-dialog__history-item:focus-visible {
  border-color: var(--aircas-color-primary);
  outline: 0;
}
.datasource-build-dialog__history-item strong {
  color: var(--aircas-color-text-primary);
  font-size: 16px;
}
.datasource-build-dialog__connection-form,
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
.datasource-build-dialog__connection-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 28px;
}
.datasource-build-dialog__connection-form label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--aircas-color-text-secondary);
  font-size: 14px;
}
.datasource-build-dialog__form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
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
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 14px 0 24px;
  border-bottom: 1px solid var(--aircas-color-border);
}
.datasource-build-dialog__field-list span {
  margin-left: 6px;
  color: var(--aircas-color-text-secondary);
}
.datasource-build-dialog__foreign-keys {
  padding-top: 18px;
}
.datasource-build-dialog__foreign-key-row {
  display: grid;
  grid-template-columns: 160px minmax(180px, 1fr) 30px minmax(180px, 1fr);
  gap: 12px;
  align-items: center;
  margin-top: 12px;
}
@media (max-width: 800px) {
  .datasource-build-dialog__connection,
  .datasource-build-dialog__fields {
    grid-template-columns: 1fr;
  }
  .datasource-build-dialog__form-grid,
  .datasource-build-dialog__field-list {
    grid-template-columns: 1fr;
  }
  .datasource-build-dialog__foreign-key-row {
    grid-template-columns: 1fr;
  }
}
</style>
