# 应用行为有 linkMapping 时展示关系两端表单

## 需求理解

应用行为详情若 ontologyLinkUniqIdentifier 有值，在入参表下方按关系实例逻辑展示 From/To 实例选择。本期不调测试接口。

## 修改范围

- BehaviorTestDialog.vue
- tests/ontology-space-behavior.test.mjs

## 新增、修改和删除文件

- 仅修改上述文件

## 核心实现方式

loadApplicationTestForm 解析 linkMapping；有值则加载关系两端；应用分支渲染关系表单；不强制挂载侧匹配；可查看实例关系数据。

## 新增依赖

无

## 验证方式

相关断言、format、行为测试、build:verify
