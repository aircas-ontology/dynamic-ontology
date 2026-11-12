# 删除行为调度

来源：[在线接口文档](http://172.16.18.58:37002/ontology/doc.html#/ontology/对象行为/OntologyActionController_deleteScheduling/doc)。

操作标识：`OntologyActionController_deleteScheduling`。

`DELETE /ontology/action/scheduling/{type}/{id}`

服务基址使用 `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`，复用统一请求和鉴权。

| 参数 | 位置 | 类型            | 必填 | 说明                |
| ---- | ---- | --------------- | ---- | ------------------- |
| type | path | TASK / RULE     | 是   | 周期任务 / 规则调度 |
| id   | path | integer / int64 | 是   | 调度 ID             |

不传 query 或 body。示例：`DELETE /ontology/action/scheduling/TASK/99`。

响应为 `RestResult`，包括 `code`、`message`、`data`；data 未定义具体结构，不依赖其内容。前端沿用成功码 200 / 0，并兼容 success=false 的失败响应。成功或失败优先展示接口 message。

页面点击列表删除仅打开确认弹窗，确认删除后调用接口。提交中防重复；失败保留弹窗可重试；成功刷新当前筛选条件及分页，当前页仅一条且非首页时退上一页。空间切换和卸载后忽略过期响应。
