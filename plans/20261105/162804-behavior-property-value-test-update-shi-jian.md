# 属性值-编辑测试（实体 → 行数据 → 参数 → 提交）

## 需求理解

属性值-编辑测试：先选实体，再按 `entityPrimaryKey` 拉取 `entity/row_detail` 主子表行数据并单选一行，取其 `dataPrimaryKey`，填写外部参数后调用 `testAction`（含 `dataPrimaryKey`）。新增流程保持不变。

## 修改范围

- 扩展 `BehaviorTestDialog`：update 模式加载并选择数据行，提交携带 `dataPrimaryKey`
- 更新相关测试断言

## 新增、修改和删除文件

### 新增

- `plans/20261105/162804-behavior-property-value-test-update-shi-jian.md`

### 修改

- `src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

### 删除

无

## 核心实现方式

1. `basicAction === "create"`：实体 + 参数；不传 `dataPrimaryKey`。
2. `basicAction === "update"`：实体 + 选中后加载行详情扁平数据行 + 参数；提交含 `dataPrimaryKey`。
3. 切换实体清空已选数据行并重新请求；`sort: "DESC"`。
4. 其它 basicAction 提示后续接入。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/ontology-space-behavior.test.mjs`
- `npm run format:check -- <任务文件>`
