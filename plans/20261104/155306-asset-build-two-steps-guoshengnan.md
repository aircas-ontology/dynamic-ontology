# 资产构建右侧两步：资产标准 + 对象信息

## 需求理解

资产构建弹窗右侧分为：①资产标准 ②对象信息。第二步表单与手动创建对象一致，并展示第一步已选属性列表。主按钮为「确认创建」；暂不调用现有手动创建接口，待后续提供专用接口。

## 修改范围

- `AssetModelBuildDialog.vue`
- `OntologyObjectCreateDialog.vue`（传入分类树、继承选项、初始分类）
- `buildAssetModelConfiguration.ts`
- `tests/asset-model-build.test.mjs`

## 核心实现方式

1. 右侧 `buildStep: 1 | 2`；Step1 勾选资产标准属性，下一步至少选 1 个。
2. Step2 填写 API 名称、显示名称、描述、图标、继承对象、分类；下方只读展示已选属性。
3. 「确认创建」仅本地校验并保存配置结果，不调用 `createOntologyObject` / `submit-manual`。
4. 分类默认带入进入资产构建前已选分类。

## 新增依赖及必要性

无

## 验证方式

- `tests/asset-model-build.test.mjs`
- 任务文件 format:check
- 浏览器冒烟两步切换与确认创建本地保存
