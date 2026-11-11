# 调度详情对接

用户已确认：对接 GET `/ontology/action/scheduling/detail`，查看和编辑点击时按 id、type 查询详情并回填弹窗。

- 新增详情类型、API、接口 Markdown 文档。
- 页面查看/编辑按钮解除禁用；请求期间防重复，失败提示，过期响应忽略；详情成功后打开弹窗。
- 回填基础字段、TASK 的 Cron 与 entityJson 行为参数；接口未提供完整参数快照时保留可展示信息。
- 新增详情 API 与页面行为测试；无依赖，不修改 public/html。

## 实施及验证

- 新增 docs/20261111/getSchedulingDetailApi.md、src/types/apis/getBehaviorSchedulingDetailType.ts；修改 API/类型出口、页面与表单、tests/schedule-save-api.test.mjs。
- 真实接口记录点击查看/编辑时查询 id、type；成功后回填，失败后可再次点击；重复点击、空间切换、卸载均有保护。行为参数以接口原始 JSON 展示，不伪造参数快照。
- RED：实际页面测试先确认原禁用行为失败；GREEN：详情、保存及共享参数相关 31 项通过。全量 944 项，912 通过、32 项既有失败。
- 类型规范通过；type-check 13 项既有错误，与列表任务最终输出排除行号后一致。build:verify 通过，产物在临时目录。
- 已加载文件覆盖率行 92.26%、函数 88.12%、分支 77.16%，整体分支未达 80%，覆盖率命令未通过，非全项目源码覆盖率。
- 未进行登录态浏览器或真实服务详情验收。更新接口仍未提供，本次不对接远程编辑保存。格式与 diff 检查执行记录以最终检查为准。
