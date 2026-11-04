# 应用行为入出参展示

## 需求理解

应用行为选定关联函数算子后调用 function/detail，在下方展示入/出参表（去红框）；对象展开 fields。来源/方式本轮占位。

## 修改范围

- BehaviorFormDialog.vue
- 新增 flatten 工具
- 应用行为算子列表 excludeTypes BASIC_QUERY
- 测试

## 新增依赖

无

## 验证方式

相关单测 + format:check
