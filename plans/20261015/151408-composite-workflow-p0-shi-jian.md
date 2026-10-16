# 函数编排工作流 P0（LogicFlow）

## 需求理解

按 composite-workflow-design 实现 LogicFlow 拖拽/连线/绑定/保存 console。

## 修改范围

类型、utils、composable、弹框、FormDialog、测试。

## 新增、修改和删除文件

见 Plan composite workflow P0。

## 核心实现方式

LF 画布 + 纯函数校验 + 双击配置 + console 保存载荷。

## 新增依赖及必要性

无。

## 验证方式

单测 + 契约 + format:check。
