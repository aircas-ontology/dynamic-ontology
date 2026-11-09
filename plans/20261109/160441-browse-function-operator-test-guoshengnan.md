# 空间浏览函数算子测试

## 需求理解

空间浏览页函数算子模块需展示测试按钮并支持现有测试功能。新建、编辑、发布/下线、删除和运行配置仍仅管理页可用。用户已确认。

## 修改范围

- 卡片、表格和详情抽屉在 `browseOnly` 时保留测试入口。
- 复用现有测试弹窗与 `openTest` / `runTest` 流程。
- 补充浏览模式测试断言。

## 新增、修改和删除文件

修改：

- `src/views/FunctionOperatorPanel/index.vue`
- `src/views/FunctionOperatorPanel/components/FunctionOperatorDetailDrawer.vue`
- `tests/function-operator-workspace.test.mjs`

新增本 Plan。不删除文件。

## 核心实现方式

将测试按钮从整块 `!browseOnly` 操作区拆出：浏览模式只渲染测试；管理模式保持全部操作。详情抽屉同理。

## 新增依赖及必要性

不新增依赖。

## 验证方式

先更新测试并确认失败，再实现并通过。执行 `npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify` 和任务文件格式检查。浏览器核对空间浏览函数算子的卡片、表格和详情测试入口。
