# 放行应用行为测试弹框入口

## 需求理解

点击应用行为「测试」应打开 BehaviorTestDialog；入口不再仅限基础行为。

## 修改范围

- SpaceBehaviorWorkspace/index.vue
- tests/ontology-space-behavior.test.mjs

## 新增、修改和删除文件

- 仅修改上述文件

## 核心实现方式

openBehaviorTest 允许 kind=application；应用行为跳过挂载对象标识校验；更新提示文案与断言。

## 新增依赖

无

## 验证方式

相关测试、format:check
