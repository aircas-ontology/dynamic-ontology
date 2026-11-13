# 去掉行为树编排弹框外层滚动条

## 需求理解

去掉行为树编排全屏弹框外层多余滚动条；左右面板内容过长时仍可在面板内滚动。

## 修改范围

- `src/views/BehaviorTreeOrchestration/BehaviorTreeOrchestrationDialog.vue`

## 新增、修改和删除文件

- 修改：上述 1 个文件
- 新增 / 删除：无

## 核心实现方式

对齐项目已有全屏弹框写法：dialog body `overflow: hidden`、根容器 `height: 100%`；调色板与配置面板保留内部 `overflow: auto`。

## 新增依赖及必要性

无。

## 验证方式

- 任务文件 `format:check`
- 目视弹框无整页滚动条
