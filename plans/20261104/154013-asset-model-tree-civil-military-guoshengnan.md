# 资产模型树改为军民通用资源结构

## 需求理解

空间内创建对象 → 资产构建左侧资产模型树改为根节点「军民通用资源」。按叶子共 6 类可点选；采用方案 A，且「人员类」「设施类」本身为可点选叶子。

## 目标树结构

```text
军民通用资源
├─ 物资类
│  └─ 油品
├─ 设备类
│  └─ 民用运输船舶
├─ 器材类
│  ├─ 航材
│  └─ 卫生器材
├─ 人员类
└─ 设施类
```

## 修改范围

仅 Mock 资产模型树/详情及对应测试；不改弹窗交互逻辑与接口。

## 新增、修改和删除文件

- 修改：`src/mocks/assetModelBuilderMock/assetModelBuilderMock.ts`
- 修改：`tests/asset-model-build.test.mjs`

## 核心实现方式

分组节点只挂 `children`；6 个叶子设 `modelId` 并与详情 `id` 对齐；`domain` 写所属分组名（人员类/设施类的 `domain` 用自身名称）。叶子属性使用精简通用字段，保证右侧配置可用。

## 新增依赖及必要性

无

## 验证方式

- `node --test --experimental-strip-types tests/asset-model-build.test.mjs`
- 任务文件 `format:check`
- 浏览器冒烟：对象创建 → 资产构建，确认树结构与 6 叶子可打开详情
