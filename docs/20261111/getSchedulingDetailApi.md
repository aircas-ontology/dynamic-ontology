# 查询行为调度详情

来源：[在线接口文档](http://172.16.18.58:37002/ontology/doc.html#/ontology/对象行为/OntologyActionController_getSchedulingDetailById/doc)。

`GET /ontology/action/scheduling/detail`

服务基址使用 `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`。

| 参数 | 位置  | 类型            | 必填 | 说明     |
| ---- | ----- | --------------- | ---- | -------- |
| id   | query | integer / int64 | 是   | 调度 ID  |
| type | query | `TASK` / `RULE` | 是   | 调度类型 |

响应 `data` 为调度详情，包含 `ontologyName`、`ontologyIdentifier`、`actionApi`、`actionName`、`schedulingName`、`description`、`id`、`type`、`status`。

外层响应字段为 `code`（integer）、`message`（string）、`data`（ActionSchedulingDetailVO），未声明 `success`。

| data 字段          | 类型                   | 模型必填 | 说明                         |
| ------------------ | ---------------------- | -------- | ---------------------------- |
| ontologyName       | string                 | 否       | 对象名称                     |
| ontologyIdentifier | string                 | 是       | 对象标识                     |
| actionApi          | string                 | 是       | 行为标识                     |
| actionName         | string                 | 是       | 行为名称                     |
| schedulingName     | string                 | 是       | 调度名称                     |
| description        | string                 | 是       | 描述                         |
| id                 | integer / int64        | 是       | 调度 ID                      |
| type               | TASK / RULE            | 是       | 周期 / 规则                  |
| status             | START / STOP           | 是       | 启动 / 停止                  |
| ruleVO             | ActionHandleTaskInfoVO | 否       | 周期任务详情，原始字段名如此 |

实际联调返回的周期任务配置位于 `data.taskVO`；在线文档仍声明 `ruleVO`，与实际响应不一致。前端优先读取 `taskVO`，缺失时兼容 `ruleVO`。

周期任务配置子字段：

| 字段               | 类型   | 说明                              |
| ------------------ | ------ | --------------------------------- |
| taskCronExpression | string | Quartz 调度表达式                 |
| entityJson         | string | 实体执行参数 JSON，执行时反序列化 |

`type`、`status` 的文档 example 与枚举类型不一致，前端按枚举定义处理。接口未提供创建时间、规则画布完整结构等字段。

`taskCronExpression` 原始 example 为数字 30，与 string 类型不一致，按 string 处理。ruleVO 子字段未声明 required，可能缺失。

说明性示例（非真实业务数据）：

```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "id": 123,
    "ontologyName": "舰船",
    "ontologyIdentifier": "abcdef",
    "actionApi": "shipLocation",
    "actionName": "舰船轨迹预测",
    "schedulingName": "示例周期调度",
    "description": "周期执行",
    "type": "TASK",
    "status": "START",
    "ruleVO": {
      "taskCronExpression": "0 0 8 * * ? *",
      "entityJson": "{\"ontologySpaceId\":\"1\",\"actionApi\":\"shipLocation\"}"
    }
  }
}
```

此接口仅用于详情查询，不提供编辑保存能力。RULE 也按 type=RULE 查询，但文档未定义规则画布配置返回结构，前端不虚构。

## 周期类型补充

创建与编辑在task.periodType传递周期类型枚举：DAILY（每天）、WEEKLY（每周）、MONTHLY（每月）、CRON（自定义表达式）。详情返回的periodType可位于data顶层或data.taskVO中，优先使用顶层非空值。读取兼容历史中文值；缺失、未知或表达式无法无损映射为普通周期输入时，回退为Cron原文，避免编辑丢失限制。

每天恢复时分秒；每周恢复星期选择及时分秒；每月恢复日期及时分秒；CRON直接展示原表达式。周期转换不修改行为参数entityJson。
