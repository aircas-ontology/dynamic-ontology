import type { DatasourceConnection, DatasourceDbType, DatasourceTable } from "@/types";

const tables: Record<DatasourceDbType, DatasourceTable[]> = {
  mysql: [
    {
      id: "ship",
      name: "ship",
      storageName: "ship",
      comment: "舰船主表",
      fields: [
        { id: "ship-id", name: "ship_id", dataType: "BIGINT" },
        { id: "ship-name", name: "ship_name", dataType: "VARCHAR" },
        { id: "ship-class", name: "ship_class", dataType: "VARCHAR" },
      ],
    },
    {
      id: "ship-weapon",
      name: "ship_weapon",
      storageName: "ship_weapon",
      comment: "舰载武器",
      fields: [
        { id: "weapon-id", name: "id", dataType: "BIGINT" },
        { id: "weapon-ship-id", name: "ship_id", dataType: "BIGINT" },
        { id: "weapon-name", name: "weapon_name", dataType: "VARCHAR" },
      ],
    },
  ],
  postgresql: [
    {
      id: "aircraft",
      name: "aircraft",
      storageName: "aircraft",
      comment: "飞机主表",
      fields: [
        { id: "aircraft-id", name: "aircraft_id", dataType: "BIGINT" },
        { id: "aircraft-name", name: "aircraft_name", dataType: "VARCHAR" },
      ],
    },
    {
      id: "aircraft-sensor",
      name: "aircraft_sensor",
      storageName: "aircraft_sensor",
      comment: "机载传感器",
      fields: [
        { id: "sensor-id", name: "id", dataType: "BIGINT" },
        { id: "sensor-aircraft-id", name: "aircraft_id", dataType: "BIGINT" },
        { id: "sensor-name", name: "sensor_name", dataType: "VARCHAR" },
      ],
    },
  ],
};

export const datasourceHistory: DatasourceConnection[] = [
  { dbType: "mysql", host: "10.12.8.21", port: 3306, database: "fleet_ops", schemaName: "", username: "fleet_reader", password: "" },
  { dbType: "postgresql", host: "10.12.8.45", port: 5432, database: "air_domain", schemaName: "public", username: "air_admin", password: "" },
];

/** @description 返回指定数据库类型的确定性数据表样例。 */
export function listDatasourceTables(dbType: DatasourceDbType): DatasourceTable[] {
  return tables[dbType].map((table) => ({ ...table, fields: table.fields.map((field) => ({ ...field })) }));
}

/** @description 校验模拟连接表单并返回明确错误信息。 */
export function validateDatasourceConnection(connection: DatasourceConnection): string | null {
  if (!connection.host.trim() || !connection.database.trim() || !connection.username.trim() || !connection.password.trim()) return "请完整填写连接信息";
  if (connection.dbType === "postgresql" && !connection.schemaName.trim()) return "请输入 Schema 名称";
  return null;
}
