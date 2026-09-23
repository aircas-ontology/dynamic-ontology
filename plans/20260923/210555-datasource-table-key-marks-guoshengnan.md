# 关联数据源各表标识主键和名称键

## 需求理解

关联数据源弹窗里，左侧每一张数据源表的字段名称，以及右侧本体属性名称，在主键或名称键成立时在名称后追加标识：主键为 `（主）`，名称键为 `（名）`，两者同时成立时为 `（主）（名）`。顶部两个字段下拉框使用同一套标识，避免选择项和表内名称不一致。

数据源字段接口只有 `isPrimaryKey`，没有名称键，因此左侧字段只会出现 `（主）`。名称键来自本体属性的 `isNameKey`。

## 修改范围

- 字段映射保留接口主键标记。
- 传给弹窗的属性带上主键和名称键。
- 弹窗字段行、属性行和对应下拉选项展示标识。
- 不改关联规则、连线、提交载荷，也不改属性列表里原有的「是 / 否」列。

## 新增、修改和删除文件

- 修改 `src/views/OntologyObjectDetail/components/OntologyObjectAttributePanel.vue`
- 修改 `src/views/OntologyObjectDetail/components/DataSourceAssociateDialog.vue`
- 修改 `tests/data-source-associate-dialog.test.mjs`
- 新增本 Plan

## 核心实现方式

- `mapDatasourceColumns` 写入 `isPrimary: column.isPrimaryKey === true`。
- `ontologyPropertyMappings` 写入属性的 `isPrimary` 和 `isNameKey`。
- 弹窗用 `formatDatasourceKeyMarks` 生成标识，并用于字段行、属性名称和下拉标签。

## 新增依赖及必要性

无。

## 验证方式

- 先运行新增断言并确认失败，再实现后确认通过。
- 对本次修改文件执行格式检查。
- 执行 `npm run type-check` 和 `npm run build:verify`。
