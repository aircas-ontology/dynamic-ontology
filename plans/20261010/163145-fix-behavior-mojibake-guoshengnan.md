# 修复行为页面 Mock 数据乱码

## 需求理解
恢复空间行为与对象行为页面使用的本地行为 Mock 数据中的中文及特殊符号，解决页面展示乱码。

## 修改范围
- 在行为 Mock 数据出口增加 UTF-8/Lain-1 乱码修复，覆盖分类、行为、算子、参数和状态文本。
- 增加行为数据回归断言，确保关键中文字段和破折号正常输出。

## 文件
- 修改：`src/mocks/ontologySpaceBehaviorMock/ontologySpaceBehaviorMock.ts`
- 修改：`tests/ontology-space-behavior.test.mjs`

## 新增依赖
无。

## 验证方式
- 行为专项测试
- 格式检查
- 类型检查
- `npm run build:verify`
- `git diff --check`
