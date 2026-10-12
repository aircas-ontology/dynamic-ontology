# 数字属性筛选改为区间填写

## 需求理解

配置属性时，所有数字类型（Double、Float、Decimal、Int、Integer、Long、Short、Byte、Number）的筛选条件改为最小值、最大值区间。只填一端也要保存，另一端保持为空。

## 修改范围

只改子空间创建第三步的数字筛选控件、筛选状态和创建请求映射。

## 新增、修改和删除文件

- 修改 `src/views/OntologySubspaceCreate/utils/resolveSubspaceCreatePropertyFilterKind.ts`
- 修改 `src/views/OntologySubspaceCreate/utils/mapSubspaceCreateRequest.ts`
- 修改 `src/views/OntologySubspaceCreate/components/SubspaceCreateWorkspacePanel.vue`
- 修改 `tests/ontology-subspace-create.test.mjs`
- 不新增、不删除文件

## 核心实现方式

- 数字类型统一使用 `numberRange`：两个 `el-input-number`，中间「至」，占位「最小值」「最大值」
- 状态增加 `numberRange: [number | null, number | null]`，允许一端为空
- 接口入参：`filter.value` 的数组元素只能是 `string | number | boolean`，不能传 `null`
  - 两端都填：`op: "BETWEEN", value: [min, max]`（min > max 时对调）
  - 只填最小值：`op: "GE", value: min`
  - 只填最大值：`op: "LE", value: max`
  - 都空：`filter: null`

## 新增依赖及必要性

无。

## 验证方式

- TDD：先写数字类型识别和区间映射测试并确认失败，再实现
- `node --test --experimental-strip-types tests/ontology-subspace-create.test.mjs`
- 任务文件 `format:check`
- `npm run type-check`、`npm run build:verify`
