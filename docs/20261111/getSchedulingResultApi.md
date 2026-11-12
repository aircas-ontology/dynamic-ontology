# 查询行为调度执行结果（调用日志）

来源：[在线接口文档](http://172.16.18.58:37002/ontology/doc.html#/ontology/对象行为/OntologyActionController_getSchedulingResult/doc)。操作标识 `OntologyActionController_getSchedulingResult`。

`GET /ontology/action/scheduling/result`，基址使用 `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`，复用统一鉴权。默认查询最新10条执行结果。

| 参数     | 位置  | 类型            | 必填 | 默认值 | 说明                |
| -------- | ----- | --------------- | ---- | ------ | ------------------- |
| id       | query | integer / int64 | 是   | 无     | 调度ID              |
| type     | query | TASK / RULE     | 是   | 无     | 周期任务 / 规则调度 |
| pageNum  | query | integer / int32 | 否   | 1      | 页码                |
| pageSize | query | integer / int32 | 否   | 10     | 每页条数            |

请求示例：`GET /ontology/action/scheduling/result?id=99&type=TASK&pageNum=1&pageSize=10`。

响应为RestResultPageSchedulingResultVO：code(integer)、message(string)、data(PageSchedulingResultVO)。文档未声明success。

| data字段 | 类型                 | 说明                   |
| -------- | -------------------- | ---------------------- |
| records  | SchedulingResultVO[] | 当前页记录             |
| total    | integer / int64      | 总数                   |
| size     | integer / int64      | 每页条数               |
| current  | integer / int64      | 当前页                 |
| pages    | integer / int64      | 总页数，已弃用，不依赖 |

orders、optimizeCountSql、searchCount、optimizeJoinOfCountSql、maxLimit、countId标记writeOnly，不作为响应依赖。

| records字段   | 类型                         | 说明                                   |
| ------------- | ---------------------------- | -------------------------------------- |
| msg           | string                       | 日志消息                               |
| executeResult | string                       | 执行结果                               |
| triggerTime   | string / date-time           | 触发时间                               |
| requestParam  | string                       | 请求参数                               |
| completeTime  | string / date-time           | 完成时间                               |
| taskStatus    | PENDING / FAILED / COMPLETED | 执行状态，分别显示待执行 / 失败 / 成功 |

模型未声明日志字段required，不虚构日志ID或调用名称；缺失字段显示占位。requestParam与executeResult是字符串，未约定内容必须为JSON。

说明性响应示例（非真实数据）：

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": {
    "records": [
      {
        "msg": "执行完成",
        "executeResult": "ok",
        "triggerTime": "2026-11-11T08:00:00+08:00",
        "requestParam": "{\"actionApi\":\"shipLocation\"}",
        "completeTime": "2026-11-11T08:00:01+08:00",
        "taskStatus": "COMPLETED"
      }
    ],
    "total": 1,
    "size": 10,
    "current": 1
  }
}
```

页面支持分页和失败重试，关闭弹窗或切换调度/空间时忽略旧响应。错误优先使用message；无记录显示暂无调用日志。
