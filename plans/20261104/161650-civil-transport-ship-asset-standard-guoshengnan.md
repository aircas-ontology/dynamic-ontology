# 民用运输船舶资产标准数据元 Mock

## 需求理解

按用户提供的民用运输船舶资产标准表生成数据；表头与油品一致（6 列数据元规范）。

## 修改范围

- 新增 `civilTransportShipAssetStandardMock.ts`
- 更新 `assetModelBuilderMock.ts` 中民用运输船舶详情
- 更新 `tests/asset-model-build.test.mjs`

## 新增依赖

无

## 验证

`tests/asset-model-build.test.mjs`、format:check
