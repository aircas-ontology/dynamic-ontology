# 查询任务主题详情

## 接口信息

| 项目             | 内容                                          |
| ---------------- | --------------------------------------------- |
| 接口名称         | 按任务编号查询任务主题详情                    |
| 请求方式         | `GET`                                         |
| 请求路径         | `/task-topic/{id}`                            |
| 前端基地址       | `DOMAIN_CONFIG.THEME_URL`                     |
| 完整调用路径     | `${DOMAIN_CONFIG.THEME_URL}/task-topic/${id}` |
| OpenAPI 操作标识 | `TaskTopicController_get`                     |

## 路径参数

| 参数 | 位置 | 类型   | 必填 | 说明     |
| ---- | ---- | ------ | ---- | -------- |
| `id` | path | string | 是   | 任务编号 |

## 成功响应

响应包装格式如下：

```json
{
  "code": 200,
  "message": "SUCCESS",
  "data": {
    "id": 1,
    "taskName": "区域巡查",
    "taskType": "巡查",
    "taskRegion": "华东",
    "regionPoint": "120.1,30.2;120.3,30.4",
    "startTime": "2026-11-09T00:00:00",
    "endTime": "2026-11-13T00:00:00",
    "description": "任务描述",
    "ontologySpace": "space-a,space-b",
    "eventStages": [
      {
        "id": 101,
        "taskCode": 1,
        "stageName": "发现阶段",
        "startTime": "2026-11-09T00:00:00",
        "endTime": "2026-11-10T00:00:00",
        "eventCount": 3,
        "eventCodes": "event-a,event-b,event-c"
      }
    ]
  }
}
```

## `data` 字段

| 字段            | 类型              | 说明                               |
| --------------- | ----------------- | ---------------------------------- |
| `id`            | integer(int64)    | 任务编号                           |
| `taskName`      | string            | 任务名称                           |
| `taskType`      | string            | 任务类型                           |
| `taskRegion`    | string            | 任务区域                           |
| `regionPoint`   | string            | 区域点位，格式为 `lon,lat;lon,lat` |
| `startTime`     | string(date-time) | 任务开始时间                       |
| `endTime`       | string(date-time) | 任务结束时间                       |
| `description`   | string            | 任务描述                           |
| `ontologySpace` | string            | 关联本体空间，多个空间使用逗号分隔 |
| `eventStages`   | array             | 任务对应的事件阶段列表             |

## `eventStages` 元素字段

| 字段         | 类型              | 说明                           |
| ------------ | ----------------- | ------------------------------ |
| `id`         | integer(int64)    | 事件阶段编号                   |
| `taskCode`   | integer(int64)    | 所属任务编号                   |
| `stageName`  | string            | 事件阶段名称                   |
| `startTime`  | string(date-time) | 阶段开始时间                   |
| `endTime`    | string(date-time) | 阶段结束时间                   |
| `eventCount` | integer(int32)    | 阶段关联事件数量               |
| `eventCodes` | string            | 事件编号，多个编号使用逗号分隔 |

## 前端调用示例

```ts
request<TaskTopicDetail>({
  url: `${DOMAIN_CONFIG.THEME_URL}/task-topic/${encodeURIComponent(String(id))}`,
  method: "get",
});
```
