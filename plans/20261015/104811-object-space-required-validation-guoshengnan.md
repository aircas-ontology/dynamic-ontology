# 对象空间新建表单必填校验

## 需求理解
新建对象空间请求接口前校验 API 名称与空间名称，校验失败时在对应字段下提示，校验通过后才发起创建流程。

## 修改范围
- 修改 `src/views/OntologySpaceManagement/components/SpaceFormDialog.vue`：增加字段级校验状态与提交前校验。
- 修改 `tests/ontology-space-management.test.mjs`：覆盖必填、API 格式和通过场景。

## 新增、修改和删除文件
- 修改上述两个文件。
- 不新增、删除文件。

## 核心实现方式
在手动创建提交时清空旧错误，校验 API 名称非空且符合现有空间 API 命名约束，校验空间名称非空；通过后才 emit save。字段错误绑定到对应 `el-form-item` 的 `error`，避免请求接口。

## 新增依赖及必要性
无。

## 验证方式
运行相关 Node 测试、`npm test`、`npm run test:coverage`、`npm run type-check`、`npm run build:verify`，并对修改文件执行 Prettier 检查与项目规范检查。
