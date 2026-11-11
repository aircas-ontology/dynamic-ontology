# 入参草稿框成一组，添加移到下方

## 需求理解

实例下拉与数据行下拉用边框包成整体；「添加」移到输入框下方。已选记录列表仍在组外。

## 修改范围

- `src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`
- `tests/ontology-space-behavior.test.mjs`
- 本 Plan

## 新增、修改和删除文件

- 修改上述文件；新增本 Plan；无删除

## 核心实现方式

草稿区改为 `param-draft-group` 竖排边框容器；按钮移到组内底部。

## 新增依赖及必要性

无。

## 验证方式

- `node --test --experimental-strip-types tests/ontology-space-behavior.test.mjs`
- `npm run format:check --` 改动文件
- `npm run type-check`、`npm run build:verify`
