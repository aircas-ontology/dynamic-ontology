# 需求理解
将资产 Mock 数据中六类数据元的 `apiName` 从数据元标识符改为英文简称，供资产模型构建第二步 API 展示。

# 修改范围
仅修改 `src/mocks/assetModelBuilderMock/` 六类资产标准数据映射及相关测试，保留原始中文数据元名称、标识符和标准元数据。

# 文件
- 修改：油品、民用运输船舶、航材、卫生器材、人员、设施六个 `*AssetStandardMock.ts` 文件。
- 修改或新增：资产 Mock API 名称校验测试。

# 核心实现方式
为各类数据元建立稳定的英文简称映射，映射函数使用英文简称生成 `apiName`；无简称或重复名称按业务语义补充区分词，并确保每个模型内 API 名称非空且唯一。

# 依赖
不新增依赖。

# 验证方式
执行相关测试、`npm run test:coverage`、`npm run type-check`、`npm run build:verify`、目标文件格式检查，并检查 `git diff --check` 和工作区范围。
