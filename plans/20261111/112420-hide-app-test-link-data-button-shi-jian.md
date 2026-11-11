# 应用行为测试去掉「查看实例关系数据」

## 需求理解

应用行为测试弹框不再显示「查看实例关系数据」；关系实例测试保留该按钮。

## 修改范围

- `src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`
- `tests/ontology-space-behavior.test.mjs`
- 本 Plan

## 新增、修改和删除文件

- 修改上述文件；新增本 Plan；无删除

## 核心实现方式

按钮 `v-if` 改为仅 `isRelationInstanceTest`。

## 新增依赖及必要性

无。

## 验证方式

- `node --test --experimental-strip-types tests/ontology-space-behavior.test.mjs`
- `npm run format:check --` 改动文件
- `npm run type-check`、`npm run build:verify`
