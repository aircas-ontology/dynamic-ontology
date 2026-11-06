# 对接行为发布与撤销发布

## 需求理解

草稿仅可发布，已发布仅可撤销发布；分别调用 publish / unpublish PUT query 接口，成功后刷新列表。

## 修改范围

- 新增 publish/unpublish types、API、mock fixtures/routes
- 修改状态可选操作、文案、composable、index 提交、测试

## 新增 / 修改 / 删除文件

见已确认 Plan。

## 核心实现方式

`listAvailableSpaceBehaviorStatusOperations`：draft→publish，published→draft（撤销发布），disabled→[]。
`changeBehaviorStatus` async 调对应接口后刷新列表。

## 新增依赖及必要性

无。

## 验证方式

相关测试、format、types-conventions、build:verify。
