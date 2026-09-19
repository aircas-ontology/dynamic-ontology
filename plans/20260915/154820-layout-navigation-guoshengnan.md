# 实施方案：原型布局与导航迁移

## 需求理解
将 github-project 的顶部标题栏、侧边菜单栏和面包屑导航迁移到当前项目，并接入应用布局。

## 修改范围
新增布局与布局子组件，补齐必要类型、Mock、Store、资源，接入 App 和路由元信息。

## 核心实现
使用 Vue 3 Composition API、TypeScript、Aircas 主题变量；布局通过 router-view 承载页面，菜单和面包屑由路由元信息驱动。

## 依赖
不新增依赖，复用现有 Element Plus、Vue Router 和项目能力。

## 验证
执行 npm test、npm run test:coverage、npm run type-check、npm run build:verify、npm run check:project-conventions、git diff --check。
