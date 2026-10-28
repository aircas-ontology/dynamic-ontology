# 登录页优化实施计划

## 需求理解

- 优化 `src/views/LoginPage/index.vue` 当前登录页面的视觉层级和交互反馈。
- 将 `src/views/LoginPage/index.scss` 的样式合并到 `index.vue`。
- 删除 `src/views/LoginPage/assets` 中未使用的图片资源。
- 不考虑或保留 `breakpoints` 响应式逻辑。

## 修改范围

- 保留现有登录、记住密码、密码显示切换和登录跳转逻辑。
- 优化登录页布局、字体层级、表单控件、按钮状态、键盘焦点和视觉图标。
- 删除样式文件中的所有媒体查询和 `breakpoints` 引用。

## 文件变更

- 修改：`src/views/LoginPage/index.vue`
- 删除：`src/views/LoginPage/index.scss`
- 删除：`src/views/LoginPage/assets/backup-original/layer-0-1.svg`
- 删除：`src/views/LoginPage/assets/backup-original/layer-0-2.svg`
- 删除：`src/views/LoginPage/assets/backup-original/layer-1.svg`
- 删除：`src/views/LoginPage/assets/backup-original/layer-2.svg`
- 删除：`src/views/LoginPage/assets/backup-original/layer-3.svg`
- 删除：`src/views/LoginPage/assets/backup-original/layer-4.svg`

## 核心实现方式

- 使用 Vue 单文件组件的 `<style scoped lang="scss">` 内联页面样式。
- 复用现有 `--aircas-*` 主题变量，移除未定义的颜色变量引用。
- 使用内联 SVG 图标替换表单中的 Emoji，并为纯图标按钮保留 `aria-label`。
- 维持现有资源导入和业务逻辑，不新增依赖。

## 新增依赖及必要性

- 无。

## 验证方式

- 执行 `npm run type-check`。
- 执行 `npm run build`。
- 检查登录页资源引用、样式内联结果和删除文件范围。
