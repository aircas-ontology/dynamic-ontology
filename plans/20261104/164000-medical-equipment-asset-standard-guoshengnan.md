# 卫生器材资产标准数据元 Mock

## 需求理解

按截图中的数据元规范表，生成卫生器材资产标准表头与表格内容，对齐油品 / 民用运输船舶 / 航材既有 6 列 Mock 模式，并挂到 `device-medical` 模型详情。

## 修改范围

- 新增卫生器材标准属性 Mock
- 将 `device-medical` 详情改为使用该 Mock
- 补充 `tests/asset-model-build.test.mjs` 断言

截图缺序号 142–149（H1139A0000–H1146A0000）页，本批仅收录已提供页的数据元。

## 新增、修改和删除文件

- 新增：`src/mocks/assetModelBuilderMock/medicalEquipmentAssetStandardMock.ts`
- 修改：`src/mocks/assetModelBuilderMock/assetModelBuilderMock.ts`
- 修改：`tests/asset-model-build.test.mjs`

## 核心实现方式

- 表头字段：数据元标识符、数据元名称、数据元简称、数据元定义、数据类型、表示形式（不含序号）
- 行数据：`Z0001G0000`、`Z0002G0000`，以及 `H1000A0000`–`H1138A0000`、`H1147A0000`–`H1282A0000`
- `apiName` 使用数据元标识符；`map` 为 `AssetModelProperty`

## 新增依赖及必要性

无

## 验证方式

- `node --test --experimental-strip-types tests/asset-model-build.test.mjs`
- `npm run format:check --` 任务涉及文件
