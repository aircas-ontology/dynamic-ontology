# Plan：对象页空数据基础界面（删旧 mock）

确认范围（用户 2026-09-17「确认」）：暂不接接口；删除 `ontologySpaceObjectMock`；展示左右基础布局，数据为空。

## 需求理解

任意空间进入「对象」Tab 显示概念树 + 对象列表工具栏；树/列表无数据；不再依赖 navy mock。

## 修改范围

- 重写 `useOntologyObjectWorkspace` 默认 loader 为空工作区；有工作区即 success
- 删除 `src/mocks/ontologySpaceObjectMock/`
- 更新 `tests/ontology-object-workspace.test.mjs`

## 新增依赖

无。

## 验证方式

相关测试 + `type-check` / 必要时 `build:verify`
