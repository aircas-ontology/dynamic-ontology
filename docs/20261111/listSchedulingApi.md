# 分页查看行为调度列表

来源：[在线接口文档](http://172.16.18.58:37002/ontology/doc.html#/ontology/对象行为/OntologyActionController_listScheduling/doc)。

OpenAPI：`http://172.16.18.58:37002/ontology/v3/api-docs`，操作标识 `OntologyActionController_listScheduling`，整理日期 2026-11-11。

## 请求

`GET /ontology/action/scheduling/list`

服务基址：`DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`。复用项目请求封装和鉴权，不在文档保存令牌。

| 查询参数 | 类型            | 必填 | 默认值 | 说明                    |
| -------- | --------------- | ---- | ------ | ----------------------- |
| pageNum  | integer / int32 | 否   | 1      | 页码                    |
| pageSize | integer / int32 | 否   | 10     | 每页条数                |
| name     | string          | 否   | 无     | 调度名称，模糊匹配      |
| type     | TASK / RULE     | 否   | 无     | 周期 / 规则，不传查全部 |

前端采用服务端分页，默认每页 10 条，可选 10、20、50、100 条。名称去除首尾空白后通过 name 查询；周期策略映射 TASK、规则策略映射 RULE，空筛选不传。查询、重置及修改每页条数回到第一页，翻页保留已应用条件；总数取 data.total。

## 响应

HTTP 200，响应体 `RestResultPageActionSchedulingInfoVO`。

| 字段         | 类型                       | 说明                                                            |
| ------------ | -------------------------- | --------------------------------------------------------------- |
| code         | integer / int32            | 业务状态码，页面沿用项目成功码 200 / 0                          |
| message      | string                     | 返回提示                                                        |
| data         | PageActionSchedulingInfoVO | 分页数据                                                        |
| data.records | ActionSchedulingInfoVO[]   | 调度记录                                                        |
| data.total   | integer / int64            | 总条数                                                          |
| data.size    | integer / int64            | 每页条数                                                        |
| data.current | integer / int64            | 当前页                                                          |
| data.pages   | integer / int64            | 总页数；OpenAPI 标记 deprecated，前端优先使用 total / size 计算 |

分页模型另含 writeOnly 字段 orders、optimizeCountSql、searchCount、optimizeJoinOfCountSql、maxLimit、countId，不作为列表响应依赖。响应未定义 success 字段。

### records 字段

| 字段               | 类型            | 模型必填 | 说明                |
| ------------------ | --------------- | -------- | ------------------- |
| ontologyName       | string          | 否       | 对象名称            |
| ontologyIdentifier | string          | 是       | 对象标识            |
| actionApi          | string          | 是       | 行为 API 标识       |
| actionName         | string          | 是       | 行为名称            |
| schedulingName     | string          | 是       | 调度名称            |
| description        | string          | 是       | 调度描述            |
| id                 | integer / int64 | 是       | 调度 ID             |
| type               | TASK / RULE     | 是       | 定时调度 / 规则调度 |
| status             | START / STOP    | 是       | 启动 / 停止         |

原文档中 type、status 的 example 分别为 123、1，与 string 枚举不一致；此处以字段类型和枚举为准。未声明 required 的外层字段不额外宣称为必填。

### 说明性响应示例

以下示例用于说明字段，非真实查询记录。

```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "records": [
      {
        "ontologyName": "舰船",
        "ontologyIdentifier": "abcdef",
        "actionApi": "shipLocation",
        "actionName": "舰船轨迹预测",
        "schedulingName": "示例周期调度",
        "description": "周期执行行为",
        "id": 123,
        "type": "TASK",
        "status": "START"
      }
    ],
    "total": 1,
    "size": 10,
    "current": 1,
    "pages": 1
  }
}
```

## 页面映射与限制

- schedulingName → 调度名称；ontologyName → 关联对象；actionName → 行为；description → 描述。
- TASK → 周期调度，RULE → 规则调度；START → 已启动，STOP → 已停止。
- 接口不返回创建时间，页面显示 `-`。
- 接口不返回 Cron、entityJson、规则画布或参数快照，不能用于真实详情回填；未提供详情、编辑、删除或调用日志契约。
- 接口不提供空间筛选，页面不能保证返回记录仅属于当前空间，须后端补充契约后再实现该限制。
