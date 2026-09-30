# 存储分组英文值展示与输入校验实施方案

## 需求理解

- 存储分组下拉选项不显示中文，`main` 直接显示为 `main`。
- 存储分组必填，并且只能由英文字母、数字和下划线组成。
- 后端历史值“主存储”继续标准化为 `main`，避免旧数据在页面展示中文。

## 修改范围

- 调整对象属性表单的存储分组校验规则。
- 调整动态存储分组选项的显示文本。
- 更新对象属性页面定向测试。

## 文件变更

- 修改 `src/views/OntologyObjectDetail/composables/useAttributePropertyList.ts`。
- 修改 `tests/ontology-object-attribute-panel.test.mjs`。
- 新增本方案文件；不新增依赖或业务源码文件。

## 核心实现方式

- 在现有 Element Plus 表单规则中增加正则 `/^[A-Za-z0-9_]+$/`，在输入失焦和选项变化时校验。
- 存储分组选项的 `label` 与 `value` 保持一致，不再把 `main` 映射成中文。
- 保留属性树数据标准化、去空值和去重逻辑。

## 依赖

- 无新增依赖。

## 验证方式

- 按 TDD 先确认新增定向测试失败，再完成实现并确认通过。
- 运行属性页面及属性接口定向测试。
- 对任务文件执行格式化和格式检查。
- 运行 `npm run type-check`、`npm run build:verify`、`npm test` 和 `npm run test:coverage`。
- 运行 `git diff --check` 并检查任务相关 diff 与工作区状态。
