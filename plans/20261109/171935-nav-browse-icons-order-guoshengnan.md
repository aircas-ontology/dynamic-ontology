# 侧栏浏览菜单图标区分与顺序调整

## 需求理解

区分「对象空间浏览」「主题空间浏览」图标，并调整侧栏顺序为：对象空间浏览、对象空间管理、主题空间浏览、主题管理，其后全文检索、应用管理不变。

## 修改范围

- `src/layout/components/NavigationMenu.vue`
- `tests/ontology-space-management.test.mjs`（导航顺序断言）
- 按需补充 `tests/layout-navigation.test.mjs`

## 新增、修改和删除文件

- 修改上述文件；新增本 Plan；无删除；无新依赖

## 核心实现方式

1. 重排 menu-item。
2. 对象空间浏览用 `Monitor`，主题空间浏览用 `Files`；管理项保持 `Box`/`Collection`。

## 新增依赖及必要性

无。

## 验证方式

- 相关导航测试
- `npm run format:check -- <本次文件>`
