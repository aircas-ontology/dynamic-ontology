# 启用行为调度

来源：[在线接口文档](http://172.16.18.58:37002/ontology/doc.html#/ontology/对象行为/OntologyActionController_startScheduling/doc)。操作标识：`OntologyActionController_startScheduling`。

`POST /ontology/action/scheduling/start/{type}/{id}`，服务基址为 `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`，统一鉴权。

| 参数 | 位置 | 类型            | 必填 | 说明                |
| ---- | ---- | --------------- | ---- | ------------------- |
| type | path | TASK / RULE     | 是   | 周期任务 / 规则调度 |
| id   | path | integer / int64 | 是   | 调度ID              |

无请求体和查询参数。示例：`POST /ontology/action/scheduling/start/TASK/99`。

响应为RestResult（code/message/data），data未规定结构。前端接受成功码200/0，success=false视为失败，优先展示message。

status=STOP时点击按钮启用，乐观改为START（已启用）；失败恢复STOP（已停止）。请求中禁用当前行，刷新列表或离开后忽略过期响应。
