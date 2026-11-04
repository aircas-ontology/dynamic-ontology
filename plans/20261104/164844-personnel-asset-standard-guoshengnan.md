# 人员类资产标准数据元 Mock

## 需求理解

按截图中的数据元规范表，生成人员类资产标准表头与表格内容，对齐油品 / 船舶 / 航材 / 卫生器材既有 6 列 Mock 模式，并挂到 `personnel` 模型详情。

## 修改范围

- 新增人员类标准属性 Mock
- 将 `personnel` 详情改为使用该 Mock
- 补充 `tests/asset-model-build.test.mjs` 断言

## 新增、修改和删除文件

- 新增：`src/mocks/assetModelBuilderMock/personnelAssetStandardMock.ts`
- 修改：`src/mocks/assetModelBuilderMock/assetModelBuilderMock.ts`
- 修改：`tests/asset-model-build.test.mjs`

## 核心实现方式

- 表头字段：数据元统一标识符、数据元名称、数据元简称、数据元定义、数据类型、表示形式
- 行数据：截图中的 `R0001`–`R0082` 及 `Z0005`/`Z0006`（标识符不连续处按截图原样保留）
- `apiName` 使用数据元标识符；映射为 `AssetModelProperty`

## 新增依赖及必要性

无

## 验证方式

- `node --test --experimental-strip-types tests/asset-model-build.test.mjs`
- `npm run format:check --` 任务涉及文件
