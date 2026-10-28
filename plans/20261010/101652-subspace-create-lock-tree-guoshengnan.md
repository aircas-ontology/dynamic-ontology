# 非对象选择步骤锁定分类树勾选

## 需求理解

只有第一步「选择对象」可以改左侧分类树勾选。进入实例、属性、关系步骤后，勾选保持只读；若再改选，提示「请回到对象选择步骤再更改」，并恢复原勾选，不更新已选对象。搜索和展开仍可用。

## 修改范围

只改子空间创建页左侧树的勾选拦截，不改右侧步骤内容和接口。

## 新增、修改和删除文件

- 修改 `src/views/OntologySubspaceCreate/index.vue`
- 修改 `src/views/OntologySubspaceCreate/components/SubspaceCreateTreePanel.vue`
- 修改 `tests/ontology-subspace-create.test.mjs`
- 不新增、不删除文件

## 核心实现方式

树面板接收 `currentStepIndex`。`@check` 时若不是第一步，则 `ElMessage.warning("请回到对象选择步骤再更改")`，`setCheckedKeys` 恢复原勾选，不向父级同步。第一步仍按现有逻辑同步叶子对象。

## 新增依赖及必要性

无。

## 验证方式

- TDD：先更新树面板与页面接线测试并确认失败，再实现
- `node --test --experimental-strip-types tests/ontology-subspace-create.test.mjs`
- 任务文件 `format:check`
- `npm run type-check`、`npm run build:verify`
- 浏览器：第二步及之后改树勾选应提示且选中不变；回到第一步后可正常改选
