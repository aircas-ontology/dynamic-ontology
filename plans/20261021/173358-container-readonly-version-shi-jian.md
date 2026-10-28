# 容器算子表单增加只读版本

## 需求理解

在新建容器算子表单的「函数名称」下方增加不可编辑的 **版本**，固定为 `1.0.0`（位于 API 名称之上）。不开放编辑、不增加版本校验规则；保存仍为本阶段 UI-only。

## 修改范围

- 修改：`src/views/FunctionOperatorPanel/components/FunctionOperatorFormDialog.vue`
- 修改：`tests/function-operator-workspace.test.mjs`
- 无新文件、无新依赖

## 核心实现方式

1. **模板**：在 docker 通用配置中，`函数名称` 与 `API名称` 之间插入只读 `版本` 字段，绑定 `form.version` 且 `disabled`。
2. **状态**：`changeType('docker')` 时将 `next.version` 设为 `"1.0.0"`。
3. **校验**：docker 的 `rules` 继续不校验 `version`。
4. **测试**：断言 docker 区块含只读版本，顺序为函数名称 → 版本 → API名称。

## 新增依赖及必要性

无。

## 验证方式

- 先改测试使旧实现失败，再改表单使测试通过（TDD）
- `npm test -- tests/function-operator-workspace.test.mjs`
- `npm run format:check --` 上述两个文件
