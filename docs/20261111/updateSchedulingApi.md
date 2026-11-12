# 编辑行为调度

来源：[在线接口文档](http://172.16.18.58:37002/ontology/doc.html#/ontology/对象行为/OntologyActionController_updateScheduling/doc)。操作标识：`OntologyActionController_updateScheduling`。

`PUT /ontology/action/scheduling`，服务基址为 `DOMAIN_CONFIG.ONTOLOGYMANAGE_URL`。请求体为 application/json，复用统一鉴权。

| 字段               | 类型            | 必填   | 说明                                  |
| ------------------ | --------------- | ------ | ------------------------------------- |
| id                 | integer / int64 | 是     | 调度ID                                |
| actionApi          | string          | 是     | 行为API，不能为空                     |
| name               | string          | 是     | 调度名称，不能为空                    |
| description        | string          | 是     | 描述，允许空字符串                    |
| type               | TASK / RULE     | 是     | 调度类型                              |
| ontologyIdentifier | string          | 否     | 应用行为可不传，由后端linkMapping推导 |
| task               | object          | TASK时 | 周期任务配置                          |
| rule               | object          | RULE时 | 规则配置，与task二选一                |

task包含字符串taskCronExpression和字符串entityJson（完整行为执行参数JSON）。文档周期示例未给entityJson，但模型支持该字段，编辑提交完整行为参数以保留用户修改。

rule包含ruleConnectType（AND/OR）与非空rules条件数组，每项按ActionHandleRuleAddParam定义。现有页面复杂规则画布缺少与此扁平模型的转换约定，本次只接入TASK编辑；RULE保存明确提示暂不支持，不伪造映射。

```json
{
  "id": 99,
  "actionApi": "shipLocation",
  "name": "示例周期调度",
  "description": "",
  "type": "TASK",
  "task": {
    "taskCronExpression": "0 0 8 * * ? *",
    "entityJson": "{\"ontologySpaceId\":\"156\",\"actionApi\":\"shipLocation\",\"params\":{\"amount\":0}}"
  }
}
```

响应为RestResult（code/message/data），data未规定结构。前端接受成功码200/0，success=false视为失败，优先展示message；失败保留弹窗可重试，成功关闭并刷新当前筛选分页，提交中防重复，空间切换或卸载后忽略过期响应。

## 周期类型补充

创建与编辑在task.periodType传递周期类型枚举：DAILY（每天）、WEEKLY（每周）、MONTHLY（每月）、CRON（自定义表达式）。详情返回的periodType可位于data顶层或data.taskVO中，优先使用顶层非空值。读取兼容历史中文值；缺失、未知或表达式无法无损映射为普通周期输入时，回退为Cron原文，避免编辑丢失限制。

每天恢复时分秒；每周恢复星期选择及时分秒；每月恢复日期及时分秒；CRON直接展示原表达式。周期转换不修改行为参数entityJson。
