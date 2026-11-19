# 主题空间：获取接口文档下载

## 需求理解

主题空间卡片/列表增加「获取接口文档」，调用 `GET /ontology/api_doc/export?spaceId=` 直接下载 HTML。

## 修改范围

Types、ontologyManageApi、ThemeSpaceManagement、相关测试。无 Mock（无契约样例）。

## 新增、修改和删除文件

- 新增：`src/types/apis/exportApiDocType.ts`
- 修改：`src/types/index.ts`、`src/apis/ontologyManageApi.ts`、`src/apis/index.ts`、`ThemeSpaceManagement/index.vue`、测试
- 无新依赖

## 核心实现方式

blob GET API + 按钮下载，复用 `downloadSpaceFile`。

## 新增依赖及必要性

无。

## 验证方式

测试、types-conventions、format、type-check、build:verify。
