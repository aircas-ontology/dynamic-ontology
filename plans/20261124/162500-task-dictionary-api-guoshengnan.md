# 任务主题字典查询接入

## 需求理解

生成工具字典查询接口说明，并将任务创建弹窗的任务类型、任务区域改为接口字典数据。任务提交字段使用 `task_type` 和 `task_region`。

## 修改范围

- 新增字典查询 API、类型和统一导出。
- 任务创建弹窗查询 `task_type`、`task_region` 并绑定下拉选项。
- 更新任务主题创建和编辑请求字段。
- 新增字典接口 Markdown 说明。

## 验证方式

- Prettier 格式检查。
- `git diff --check`。
- 类型检查，记录仓库既有错误。

## 备注

在线文档地址当前无法从开发环境访问，字典请求按 `DictController_list`、`GET /dict?type=...` 和 `data` 选项数组契约接入。
