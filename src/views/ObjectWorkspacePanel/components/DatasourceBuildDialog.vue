<template>
  <el-dialog v-model="visible" class="datasource-build-dialog" title="数据源构建对象" width="min(980px, 92vw)" append-to-body destroy-on-close>
    <el-steps :active="activeStep" align-center class="datasource-build-dialog__steps">
      <el-step v-for="title in stepTitles" :key="title" :title="title" />
    </el-steps>
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <section v-if="step === -1" v-loading="busy" class="datasource-build-dialog__connections">
      <aside class="datasource-build-dialog__history" aria-label="历史连接">
        <h2>历史连接</h2>
        <el-input v-model="connectionKeyword" placeholder="搜索连接名称或类型" clearable ariaLabel="搜索历史连接" :disabled="busy" />
        <div class="datasource-build-dialog__history-list">
          <div v-for="item in filteredConnections" :key="item.id" class="datasource-build-dialog__history-row">
            <button
              type="button"
              class="datasource-build-dialog__history-item"
              :class="{ 'is-active': connectionMode === 'existing' && datasourceId === item.id }"
              :disabled="busy"
              :aria-pressed="connectionMode === 'existing' && datasourceId === item.id"
              @click="chooseHistoricalConnection(item.id)"
            >
              <strong :title="item.name">{{ item.name }}</strong
              ><span>{{ item.dbType }}</span>
            </button>
            <button
              type="button"
              class="datasource-build-dialog__history-delete"
              :disabled="busy"
              :aria-label="`删除连接 ${item.name}`"
              :title="`删除连接 ${item.name}`"
              @click.stop="deleteHistoricalConnection(item.id)"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <el-empty v-if="connectionReady && !filteredConnections.length" :description="connections.length ? '暂无匹配连接' : '暂无历史连接，请在右侧新建'" />
        </div>
        <el-button v-if="error" :disabled="busy" @click="loadConnections">重新查询连接</el-button>
      </aside>
      <div class="datasource-build-dialog__new-connection" @input="invalidateConnectionTest" @change="invalidateConnectionTest">
        <header>
          <h2>新建连接</h2>
        </header>
        <el-form label-position="top" :disabled="busy">
          <el-form-item label="数据库类型" required>
            <el-select v-model="connectionForm.dbType" ariaLabel="数据库类型" @change="invalidateConnectionTest">
              <el-option label="达梦" value="DM" /><el-option label="SQLite" value="SQLITE" /><el-option label="PostgreSQL" value="POSTGRESQL" />
            </el-select>
          </el-form-item>
          <el-form-item label="连接名称" required><el-input v-model="connectionForm.name" maxlength="128" ariaLabel="连接名称" /></el-form-item>
          <el-form-item label="JDBC URL" required
            ><el-input
              v-model="connectionForm.jdbcUrl"
              :placeholder="
                connectionForm.dbType === 'SQLITE'
                  ? 'jdbc:sqlite:/path/database.sqlite'
                  : connectionForm.dbType === 'DM'
                    ? 'jdbc:dm://host:5236'
                    : 'jdbc:postgresql://host:5432/database'
              "
              ariaLabel="JDBC URL"
          /></el-form-item>
          <template v-if="connectionForm.dbType !== 'SQLITE'">
            <el-form-item label="用户名" required><el-input v-model="connectionForm.username" autocomplete="off" ariaLabel="用户名" /></el-form-item>
            <el-form-item label="密码" required
              ><el-input v-model="connectionForm.password" type="password" show-password autocomplete="new-password" ariaLabel="密码"
            /></el-form-item>
            <el-form-item label="Schema"><el-input v-model="connectionForm.schemaName" placeholder="public" ariaLabel="连接 Schema" /></el-form-item>
          </template>
        </el-form>
        <footer>
          <el-button :loading="busy" @click="testConnection">测试连接</el-button
          ><span role="status">{{ isConnectionTested ? "连接测试成功，可点击下一步" : "新建连接需先测试，修改配置后需重新测试" }}</span>
        </footer>
      </div>
    </section>
    <section v-else-if="step === 0" v-loading="busy" class="datasource-build-dialog__tables datasource-build-dialog__connection">
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
      <p v-if="datasourceId && !isSqlite">选择数据源 schema</p>
      <el-select
        v-if="datasourceId && !isSqlite"
        v-model="schemaName"
        placeholder="请选择 schema"
        :ariaLabel="'选择 schema'"
        :disabled="busy"
        @change="resetTableSelection"
      >
        <el-option v-for="item in schemas" :key="item.schemaName" :label="item.schemaName" :value="item.schemaName" />
      </el-select>
      <el-button v-if="error" :disabled="busy" @click="loadSchemas">重新查询 Schema</el-button>
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
        ><el-table-column prop="name" label="表名" min-width="200" /><el-table-column label="APIName" min-width="220"
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
          <el-table-column prop="name" label="字段名" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ row.name }}<span v-if="row.isPrimaryKey === true">（主键）</span></template>
          </el-table-column>
          <el-table-column label="属性名" min-width="180">
            <template #default="{ row }"><el-input v-model="row.propertyName" placeholder="请输入属性名" :ariaLabel="`${row.name}属性名`" /></template>
          </el-table-column>
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
          <el-button v-if="activeStep > 0" :disabled="busy" @click="step -= 1">上一步</el-button>
          <el-button type="primary" :loading="busy" @click="nextStep">{{ step === 2 ? "创建" : "下一步" }}</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed, reactive, ref, watch, onBeforeUnmount } from "vue";
import { ElLoading, ElMessageBox } from "element-plus";
import {
  deleteDatasourceConnectionInterface,
  getDatasourceConnectionListInterface,
  postDatasourceConnectionInterface,
  postDatasourceConnectionTestInterface,
  getDatasourceSchemaListByDatasourceInterface,
  getDatasourceSchemaListInterface,
  getDatasourceTableColumnsByDatasourceInterface,
  getDatasourceTableColumnsInterface,
  getDatasourceTableListByDatasourceInterface,
  getDatasourceTableListInterface,
} from "@/apis";
import type { DatasourceBuildSelection, DatasourceConnectionItem, DatasourceConnectionParam, DatasourceSchema, DatasourceTable } from "@/types";
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
const connections = ref<DatasourceConnectionItem[]>([]);
const datasourceId = ref<number>();
const connectionMode = ref("existing");
const connectionReady = ref(false);
const hasBoundConnection = ref(true);
const connectionKeyword = ref("");
const testedConnection = ref("");
const stepTitles = computed(() => [...(hasBoundConnection.value ? [] : ["连接数据源"]), "对象信息", "选择数据库表", "字段与外键"]);
const activeStep = computed(() => step.value + (hasBoundConnection.value ? 0 : 1));
const filteredConnections = computed(() =>
  connections.value.filter((item) => `${item.name} ${item.dbType}`.toLowerCase().includes(connectionKeyword.value.trim().toLowerCase())),
);
const connectionForm = reactive<DatasourceConnectionParam>({ name: "", dbType: "POSTGRESQL", jdbcUrl: "", username: "", password: "", schemaName: "public" });
const isConnectionTested = computed(() => testedConnection.value !== "" && testedConnection.value === JSON.stringify(getConnectionPayload()));
const isSqlite = computed(() => connections.value.find((item) => item.id === datasourceId.value)?.dbType.toUpperCase() === "SQLITE");
const tables = ref<DatasourceTable[]>([]);
let generation = 0;
let dialogGeneration = 0;
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
    dialogGeneration++;
    resetTableSelection();
    schemas.value = [];
    schemaName.value = "";
    objectName.value = "";
    categoryId.value = "";
    connections.value = [];
    datasourceId.value = undefined;
    connectionReady.value = false;
    hasBoundConnection.value = false;
    step.value = -1;
    connectionKeyword.value = "";
    testedConnection.value = "";
    connectionMode.value = "existing";
    Object.assign(connectionForm, { name: "", dbType: "POSTGRESQL", jdbcUrl: "", username: "", password: "", schemaName: "public" });
    if (opened) void loadConnections();
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  generation++;
  dialogGeneration++;
});
/** @description 返回连接查询标识，未选择连接时兼容原空间查询。
 * @returns 数据源或空间标识。
 */
function getDatasourceTarget() {
  return datasourceId.value === undefined ? { spaceId: Number(props.spaceId) } : { datasourceId: datasourceId.value };
}
/** @description 完整读取连接分页并优先选择历史空间关联，忽略关闭后的响应。 */
async function loadConnections(): Promise<void> {
  if (busy.value) return;
  const token = ++generation;
  busy.value = true;
  error.value = "";
  try {
    const items: DatasourceConnectionItem[] = [];
    let pageNum = 1;
    while (true) {
      const response = await getDatasourceConnectionListInterface({ pageNum, pageSize: 100 });
      if (token !== generation) return;
      if (response.code !== 200) throw new Error(response.message || "连接查询失败");
      const before = items.length;
      for (const item of response.data.records) if (!items.some((existing) => existing.id === item.id)) items.push(item);
      if (items.length >= response.data.total) break;
      if (items.length === before) throw new Error("连接分页数据不完整，请重试");
      pageNum++;
    }
    connections.value = items;
    connectionReady.value = true;
    busy.value = false;
    const historical = items.find((item) => item.spaceId === Number(props.spaceId));
    if (step.value <= 0) {
      hasBoundConnection.value = Boolean(historical);
      step.value = historical ? 0 : -1;
    }
    if (historical) await selectConnection(historical.id);
  } catch (cause) {
    if (token === generation) error.value = cause instanceof Error ? cause.message : "连接查询失败";
  } finally {
    if (token === generation) busy.value = false;
  }
}
/** @description 切换数据源，清理下游配置并读取 schema。
 * @param id 选中连接的标识。
 */
async function selectConnection(id: number | undefined): Promise<void> {
  resetTableSelection();
  datasourceId.value = id;
  schemas.value = [];
  schemaName.value = "";
  if (id === undefined) return;
  const connection = connections.value.find((item) => item.id === id);
  if (!connection) return;
  if (connection.dbType.toUpperCase() === "SQLITE") {
    schemaName.value = "public";
    return;
  }
  const token = generation + 1;
  await loadSchemas();
  if (token === generation && datasourceId.value === id && !schemaName.value && !error.value)
    schemaName.value = connection.schemaName || schemas.value[0]?.schemaName || "public";
}
/** @description 切换已有或新建连接模式，废弃进行中的请求和旧连接选择。 */
function changeConnectionMode(): void {
  resetTableSelection();
  datasourceId.value = undefined;
  schemas.value = [];
  schemaName.value = "";
}
/** @description 选用历史连接并在 schema 就绪后进入对象信息，失败停留且不修改空间绑定。
 * @param id 历史连接标识。
 */
async function chooseHistoricalConnection(id: number): Promise<void> {
  if (busy.value) return;
  if (!connections.value.some((item) => item.id === id)) {
    error.value = "请选择有效的历史连接";
    return;
  }
  const dialogToken = dialogGeneration;
  connectionMode.value = "existing";
  if (datasourceId.value !== id || !schemaName.value || error.value) await selectConnection(id);
  if (dialogToken !== dialogGeneration || datasourceId.value !== id || error.value || !schemaName.value) return;
  if (step.value === -1) step.value = 0;
}
/**
 * @description 确认后物理删除历史连接，清理被删除的当前选择并忽略关闭后的响应。
 * @param id 待删除的历史连接标识。
 * @returns 删除或取消操作完成。
 */
async function deleteHistoricalConnection(id: number): Promise<void> {
  if (busy.value) return;
  const connection = connections.value.find((item) => item.id === id);
  if (!connection) return;
  const token = ++generation;
  busy.value = true;
  error.value = "";
  try {
    await ElMessageBox.confirm(`确定物理删除连接“${connection.name}”吗？此操作不可撤销。`, "删除历史连接", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });
    if (token !== generation || !visible.value) return;
    const response = await deleteDatasourceConnectionInterface(id);
    if (token !== generation || !visible.value) return;
    if (response.code !== 200) throw new Error(response.message || "连接删除失败");
    connections.value = connections.value.filter((item) => item.id !== id);
    if (datasourceId.value === id) changeConnectionMode();
  } catch (cause) {
    if (token === generation && visible.value && cause !== "cancel" && cause !== "close") error.value = cause instanceof Error ? cause.message : "连接删除失败";
  } finally {
    if (token === generation) busy.value = false;
  }
}
/** @description 选用右侧新建表单，清理原连接的下游选择。 */
function activateNewConnection(): void {
  if (busy.value || connectionMode.value === "new") return;
  connectionMode.value = "new";
  changeConnectionMode();
}
/** @description 用户修改连接配置后立即清除已通过的测试结果，并选用新建表单。 */
function invalidateConnectionTest(): void {
  testedConnection.value = "";
  activateNewConnection();
}
/** @description 规范化当前连接配置，不包含空间绑定。
 * @returns 测试及创建共用的连接参数。
 */
function getConnectionPayload(): DatasourceConnectionParam {
  const sqlite = connectionForm.dbType === "SQLITE";
  return {
    name: connectionForm.name.trim(),
    dbType: connectionForm.dbType,
    jdbcUrl: connectionForm.jdbcUrl.trim(),
    username: sqlite ? "" : connectionForm.username.trim(),
    password: sqlite ? "" : connectionForm.password,
    schemaName: sqlite ? "public" : connectionForm.schemaName?.trim() || "public",
  };
}
/** @description 仅测试新建连接；配置变化后测试结果自动失效，测试成功不落库。 */
async function testConnection(): Promise<void> {
  if (busy.value) return;
  activateNewConnection();
  testedConnection.value = "";
  error.value = "";
  const sqlite = connectionForm.dbType === "SQLITE";
  if (!connectionForm.name.trim() || !connectionForm.jdbcUrl.trim() || (!sqlite && (!connectionForm.username.trim() || !connectionForm.password))) {
    error.value = "请填写连接名称、JDBC URL，以及非 SQLite 连接的用户名和密码";
    return;
  }
  const token = ++generation;
  const data = getConnectionPayload();
  busy.value = true;
  try {
    const tested = await postDatasourceConnectionTestInterface(data);
    if (token !== generation) return;
    if (tested.code !== 200) throw new Error(tested.message || "连接测试失败");
    if (JSON.stringify(data) !== JSON.stringify(getConnectionPayload())) throw new Error("连接配置已变化，请重新测试");
    testedConnection.value = JSON.stringify(data);
  } catch (cause) {
    if (token === generation) error.value = cause instanceof Error ? cause.message : "连接测试失败";
  } finally {
    if (token === generation) busy.value = false;
  }
}
/** @description 下一步时创建已测试的新连接，禁止重复提交并忽略过期响应。 */
async function createConnection(): Promise<void> {
  if (busy.value) return;
  if (!isConnectionTested.value) {
    error.value = "请先测试连接，配置修改后需要重新测试";
    return;
  }
  const token = ++generation;
  const data = getConnectionPayload();
  busy.value = true;
  error.value = "";
  try {
    const created = await postDatasourceConnectionInterface(data);
    if (token !== generation) return;
    if (created.code !== 200 || !created.data?.id) throw new Error(created.message || "连接创建失败");
    connections.value = [...connections.value.filter((item) => item.id !== created.data.id), created.data];
    connectionReady.value = true;
    connectionMode.value = "existing";
    connectionForm.password = "";
    testedConnection.value = "";
    busy.value = false;
    await selectConnection(created.data.id);
  } catch (cause) {
    if (token === generation) error.value = cause instanceof Error ? cause.message : "连接创建失败";
  } finally {
    if (token === generation) busy.value = false;
  }
}
/** @description 已绑定空间按空间查询，未绑定空间按所选数据源 ID 查询 schema，忽略过期响应。 */
async function loadSchemas(): Promise<void> {
  if (busy.value) return;
  const spaceId = Number(props.spaceId);
  if (hasBoundConnection.value && (!Number.isInteger(spaceId) || spaceId <= 0)) {
    error.value = "缺少有效空间 ID";
    return;
  }
  const selectedDatasourceId = datasourceId.value;
  if (!hasBoundConnection.value && (!selectedDatasourceId || !Number.isInteger(selectedDatasourceId) || selectedDatasourceId <= 0)) {
    error.value = "请选择有效的数据源连接";
    return;
  }
  const token = ++generation;
  busy.value = true;
  error.value = "";
  try {
    const response =
      !hasBoundConnection.value && selectedDatasourceId !== undefined
        ? await getDatasourceSchemaListByDatasourceInterface(selectedDatasourceId)
        : await getDatasourceSchemaListInterface({ spaceId });
    if (token !== generation) return;
    if (response.code !== 200) throw new Error(response.message || "Schema 查询失败");
    schemas.value = response.data;
    if (datasourceId.value !== undefined && !schemas.value.length) {
      schemas.value = [{ schemaName: "public" }];
      schemaName.value = "public";
    }
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
  if (step.value === -1) {
    const dialogToken = dialogGeneration;
    if (connectionMode.value === "new") await createConnection();
    if (dialogToken !== dialogGeneration) return;
    if (!datasourceId.value) {
      if (!error.value) error.value = "请选择历史连接，或测试并创建新连接";
      return;
    }
    if (!schemaName.value && !error.value) await loadSchemas();
    if (dialogToken !== dialogGeneration) return;
    if (!error.value) step.value = 0;
    return;
  }
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
      if (connectionReady.value && datasourceId.value === undefined) {
        error.value = "请选择或新建数据源连接";
        return;
      }
      const selectedDatasourceId = datasourceId.value;
      if (!hasBoundConnection.value && (!selectedDatasourceId || !Number.isInteger(selectedDatasourceId) || selectedDatasourceId <= 0)) {
        error.value = "请选择有效的数据源连接";
        return;
      }
      const response =
        !hasBoundConnection.value && selectedDatasourceId !== undefined
          ? await getDatasourceTableListByDatasourceInterface({ id: selectedDatasourceId, schemaName: schemaName.value })
          : await getDatasourceTableListInterface({ ...getDatasourceTarget(), schemaName: schemaName.value });
      if (token !== generation) return;
      if (response.code !== 200) throw new Error(response.message || "数据表加载失败");
      const previousTables = new Map(tables.value.map((table) => [table.name, table]));
      tables.value = response.data.map((table) => ({
        id: table.tableName,
        name: table.tableName,
        targetName: previousTables.get(table.tableName)?.targetName ?? table.tableName,
        storageName: previousTables.get(table.tableName)?.storageName ?? table.tableName,
        comment: previousTables.get(table.tableName)?.comment ?? table.tableComment ?? "",
        fields:
          previousTables.get(table.tableName)?.fields ??
          Array.from({ length: table.columnCount }, (_, index) => ({ id: `${table.tableName}-${index}`, name: "", dataType: "" })),
      }));
      selected.value = selected.value.filter((id) => tables.value.some((table) => table.id === id));
      if (!selected.value.includes(primary.value)) primary.value = "";
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
      if (selectedTables.value.some((table) => !(table.targetName ?? table.name).trim())) {
        error.value = "请输入所选数据表的入库表名";
        return;
      }
      const selectedDatasourceId = datasourceId.value;
      if (!hasBoundConnection.value && (!selectedDatasourceId || !Number.isInteger(selectedDatasourceId) || selectedDatasourceId <= 0)) {
        error.value = "请选择有效的数据源连接";
        return;
      }
      const columnParams = {
        schemaName: schemaName.value,
        tableNames: selectedTables.value.map((table) => table.name),
      };
      const response =
        !hasBoundConnection.value && selectedDatasourceId !== undefined
          ? await getDatasourceTableColumnsByDatasourceInterface({ id: selectedDatasourceId, ...columnParams })
          : await getDatasourceTableColumnsInterface({ ...getDatasourceTarget(), ...columnParams });
      if (token !== generation) return;
      if (response.code !== 200) throw new Error(response.message || "字段加载失败");
      const details = new Map(response.data.map((detail) => [detail.tableName, detail]));
      for (const table of selectedTables.value) {
        const detail = details.get(table.name);
        const previousFields = new Map(table.fields.map((field) => [field.id, field]));
        table.fields = (detail?.columns || []).map((field) => ({
          id: `${table.id}-${field.columnName}`,
          name: field.columnName,
          propertyName: previousFields.get(`${table.id}-${field.columnName}`)?.propertyName ?? field.columnName,
          dataType: field.ontologyDataType || field.nativeType,
          isPrimaryKey: field.isPrimaryKey,
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
      if ((fieldIdsByTable[table.id] ?? []).some((id) => !table.fields.find((field) => field.id === id)?.propertyName?.trim())) {
        error.value = `请输入数据表「${table.name}」已选字段的属性名`;
        return;
      }
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
.datasource-build-dialog__connections,
.datasource-build-dialog__tables,
.datasource-build-dialog__fields {
  --el-mask-color: var(--aircas-color-overlay-light);
}
.datasource-build-dialog__connections {
  display: grid;
  grid-template-columns: minmax(220px, 0.8fr) minmax(0, 1.6fr);
  gap: 20px;
  height: 460px;
}
.datasource-build-dialog__history,
.datasource-build-dialog__new-connection {
  display: flex;
  min-height: 0;
  min-width: 0;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 10px;
  background: var(--aircas-color-panel-background-deep);
}
.datasource-build-dialog__connections h2 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
}
.datasource-build-dialog__history-list {
  min-height: 0;
  flex: 1;
  overflow: auto;
}
.datasource-build-dialog__history-row {
  position: relative;
  margin-bottom: 8px;
}
.datasource-build-dialog__history-delete {
  position: absolute;
  top: 50%;
  right: 12px;
  display: flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  padding: 0;
  transform: translateY(-50%);
  border: 0;
  border-radius: 6px;
  color: var(--aircas-color-text-secondary);
  background: transparent;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}
.datasource-build-dialog__history-delete:hover:not(:disabled),
.datasource-build-dialog__history-delete:active:not(:disabled) {
  color: var(--aircas-color-danger);
  background: var(--aircas-color-effect-primary-soft);
}
.datasource-build-dialog__history-delete:focus-visible {
  outline: 2px solid var(--aircas-color-primary);
  outline-offset: 2px;
}
.datasource-build-dialog__history-delete:disabled {
  color: var(--aircas-color-text-disabled);
  cursor: not-allowed;
}
.datasource-build-dialog__history-item {
  min-width: 0;
  flex: 1;
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 8px;
  padding: 12px 52px 12px 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 6px;
  color: var(--aircas-color-text-secondary);
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.datasource-build-dialog__history-item strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.datasource-build-dialog__history-item:hover,
.datasource-build-dialog__history-item.is-active {
  border-color: var(--aircas-color-primary);
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-effect-primary-soft);
}
.datasource-build-dialog__history-item:focus-visible {
  outline: 2px solid var(--aircas-color-primary);
  outline-offset: -2px;
}
.datasource-build-dialog__history-item:disabled {
  color: var(--aircas-color-text-disabled);
  cursor: not-allowed;
}
.datasource-build-dialog__new-connection header,
.datasource-build-dialog__new-connection footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.datasource-build-dialog__new-connection header {
  justify-content: space-between;
}
.datasource-build-dialog__new-connection > .el-form {
  min-height: 0;
  flex: 1;
  overflow: auto;
}
.datasource-build-dialog__new-connection footer span {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.datasource-build-dialog__connection {
  gap: 12px;
}
.datasource-build-dialog__connection > * {
  flex-shrink: 0;
}
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
  .datasource-build-dialog__connections {
    grid-template-columns: 1fr;
    height: auto;
  }
  .datasource-build-dialog__history-list {
    max-height: 200px;
    flex: auto;
  }
  .datasource-build-dialog__fields {
    grid-template-columns: 1fr;
  }
  .datasource-build-dialog__foreign-key-row {
    grid-template-columns: 1fr;
  }
}
</style>
