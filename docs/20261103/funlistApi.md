## 1. 查询函数列表

**接口**：`GET /ontology/function/list`

**用途**：创建行为时选择要绑定的算子。行为侧只展示「基础算子」或「应用行为算子」，不展示「函数编排」。

### 1.1 请求参数（Query String）

| 参数名            | 类型                 | 必填 | 说明                                                                                                                                        |
| ----------------- | -------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `ontologySpaceId` | Integer              | 否   | 对象空间 id，建议传（跨空间允许同名 api）                                                                                                   |
| `displayName`     | String               | 否   | 函数名称（模糊搜索）                                                                                                                        |
| `types`           | ListFunctionTypeEnum | 否   | **函数类型（可多值）**：`CUSTOMIZE` / `EXTERNAL` / `BASIC_QUERY` / `COMPOSITE` / `CONTAINER`。**传什么查什么，不传=全部类型（含函数编排）** |
| `excludeTypes`    | ListFunctionTypeEnum | 否   | 排除的函数类型列表；与 `types` 同时传时两者都生效                                                                                           |
| `publishStatus`   | Integer              | 否   | 发布状态：`0` 未发布，`1` 已发布                                                                                                            |
| `startDate`       | String               | 否   | 创建开始日期，格式 `yyyy-MM-dd`                                                                                                             |
| `endDate`         | String               | 否   | 创建结束日期，格式 `yyyy-MM-dd`                                                                                                             |
| `pageNum`         | Integer              | 否   | 页号，默认 `1`                                                                                                                              |
| `pageSize`        | Integer              | 否   | 每页条数，默认 `10`，最大 `1000`                                                                                                            |

### 1.2 前端调用示例

**场景 A：创建「属性值行为」或「实例关系行为」时，不展示算子选择（这两类行为不绑算子）**

- 不调用本接口。

**场景 B：创建「基础算子行为」时，只查基础算子**

```http
GET /function/list?ontologySpaceId=156&types=BASIC_QUERY&publishStatus=1&pageNum=1&pageSize=20
```

> 期望：`data.records[]` 里每条 `type=BASIC_QUERY`、`publishStatus=1`。

**场景 C：创建「应用行为」时，查自定义/外部/容器算子**

```http
GET /function/list?ontologySpaceId=156&types=CUSTOMIZE,EXTERNAL,CONTAINER&publishStatus=1&pageNum=1&pageSize=20
```

> 期望：`data.records[]` 里每条 `type` 是 `CUSTOMIZE` / `EXTERNAL` / `CONTAINER` 之一、`publishStatus=1`。

**场景 D：老前端兼容（只传** `excludeTypes`**）**

```http
GET /function/list?ontologySpaceId=156&excludeTypes=COMPOSITE&pageNum=1&pageSize=20
```

> ⚠️ 注意：旧版本后端会隐式排除 `COMPOSITE`，新版不会。如果只传 `excludeTypes` 而不传 `types`，**函数编排也会出现在结果里**。要排除编排，必须显式传 `excludeTypes=COMPOSITE`。

### 1.3 响应字段（`FunctionInfoVO`）

| 字段名            | 类型                      | 说明                                                                           |
| ----------------- | ------------------------- | ------------------------------------------------------------------------------ |
| `functionApi`     | String                    | 函数 api                                                                       |
| `version`         | String                    | 版本号，格式 `x.y.z`                                                           |
| `publishStatus`   | Integer                   | 发布状态：`0` 未发布，`1` 已发布                                               |
| `displayName`     | String                    | 函数名称                                                                       |
| `description`     | String                    | 描述                                                                           |
| `model`           | FunctionModelEnum         | 函数模型                                                                       |
| `type`            | FunctionTypeEnum          | 函数类型：`CUSTOMIZE` / `EXTERNAL` / `BASIC_QUERY` / `COMPOSITE` / `CONTAINER` |
| `language`        | FunctionLanguageEnum      | 脚本语言（仅 `CUSTOMIZE`/`EXTERNAL` 有意义）                                   |
| `ontologySpaceId` | Integer                   | 所属对象空间 id                                                                |
| `createTime`      | Date                      | 创建时间                                                                       |
| `updateTime`      | Date                      | 更新时间                                                                       |
| `runningStatus`   | FunctionRuntimeStatusEnum | 运行状态：`RUNNING` / `NOT_RUNNING`                                            |

---
