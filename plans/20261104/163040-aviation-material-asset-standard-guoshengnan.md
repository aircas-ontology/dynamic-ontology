# 航材资产标准数据元 Mock

## 需求理解

按用户提供的航材资产标准表生成数据；表头与油品/民用运输船舶一致（6 列数据元规范）。

## 修改范围

- 新增 `aviationMaterialAssetStandardMock.ts`（Z0001–Z0007、H0001–H0205，共 212 条）
- 更新 `assetModelBuilderMock.ts` 中航材详情
- 更新 `tests/asset-model-build.test.mjs`

## 核心实现方式

复用油品标准行 → `AssetModelProperty` 映射模式；`apiName` 使用数据元标识符。

## 新增依赖

无

## 验证

`tests/asset-model-build.test.mjs`、format:check
