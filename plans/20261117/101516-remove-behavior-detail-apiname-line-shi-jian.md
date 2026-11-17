# 去掉行为详情头 apiName 行

## 需求理解

行为详情抽屉标签下方不再展示 `apiName xxx`；摘要区已有「行为 api」。

## 修改范围

- `BehaviorDetailDrawer.vue`：删除 meta-line 模板与样式
- 相关测试断言

## 新增、修改和删除文件

- 修改：上述文件与测试
- 无新增/删除

## 核心实现方式

移除冗余展示行。

## 新增依赖及必要性

无。

## 验证方式

- 相关单测 + format:check
