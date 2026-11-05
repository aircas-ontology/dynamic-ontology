# Plan：编辑测试 main 分组默认勾选且不可取消

## 需求理解

属性值-修改（`basicAction === "update"`）测试中，当行为 `storageGroup` 为 `main` 时，数据行区默认勾选 main 对应行，且不可取消/切换。

## 修改范围

- `src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

## 新增 / 修改 / 删除文件

| 操作 | 路径                                                                 |
| ---- | -------------------------------------------------------------------- |
| 修改 | `src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue` |
| 修改 | `tests/ontology-space-behavior.test.mjs`                             |
| 新增 | 本 Plan 文件                                                         |

## 核心实现方式

1. 复用 `isMainStorageGroup`；新增计算属性：`isUpdateTest && isMainStorageGroup(resolvedStorageGroup)`。
2. `loadEntityGroupDataRows` 成功后，若满足锁定条件且存在数据行，自动选中第一条。
3. 锁定时 `el-radio` 设置 `disabled`；`selectGroupDataRow` / 行点击在锁定态直接返回，禁止取消或切换。
4. 删除测试、非 main 分组保持现有手动选择。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/ontology-space-behavior.test.mjs`（相关用例）
- `npm run format:check --` 本次修改文件
- 按需 `npm run type-check`
