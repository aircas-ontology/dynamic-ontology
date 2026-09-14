# Assets 目录规范

## 1. 目录职责与边界

`src/assets` 集中管理由 Vite 参与构建、哈希和模块解析的图片、图标、字体等静态资源。

- 【必须】先按页面、布局、公共组件或公共资源的归属分层，再按资源类型细分。
- 【禁止】在一级目录按 `png`、`svg` 等文件格式组织资源。
- 【禁止】存放部署后需要修改的配置或数据；此类内容属于 `public/configs` 或 `public/data`。

## 2. 推荐目录结构

```text
src/assets/
├─ pages/
│  └─ <pageName>/
│     ├─ images/
│     ├─ icons/
│     └─ fonts/
├─ layouts/
│  └─ <layoutName>/
│     ├─ images/
│     └─ icons/
├─ components/
│  └─ <componentName>/
│     ├─ images/
│     └─ icons/
├─ common/
│  ├─ images/
│  ├─ icons/
│  └─ fonts/
└─ readme.md
```

- 【必须】`pages/<pageName>` 只服务指定页面及其页面私有子组件。
- 【必须】`layouts/<layoutName>` 只服务指定公共布局。
- 【必须】`components/<componentName>` 只服务指定公共组件。
- 【必须】`common` 只存放已被多个页面、布局或公共组件实际复用的资源。
- 【禁止】为了可能发生的复用，提前把专属资源放入 `common`。
- 【必须】页面资源放入 `src/assets/pages`，不再新增 `src/views/<Page>/assets`。

## 3. 命名规范

- 【必须】`src/assets` 下所有自定义目录名和资源文件名使用小驼峰，与根规范保持一致。
- 【必须】扩展名保持小写且不参与小驼峰转换。
- 【禁止】使用空格、中文、连字符、下划线、无意义编号以及 `final`、`new`、`copy` 等临时名称。
- 【优先】状态、尺寸或用途差异使用语义后缀，如 `searchIconActive.svg`、`userAvatarSmall.png`。

```text
pages/loginPage/backgroundImage.png
layouts/mainLayout/headerLogo.svg
components/aircasPanel/titleDecoration.png
common/icons/searchIcon.svg
```

## 4. 引用与归属调整

- 【必须】业务源码通过 `@/assets/...` 导入，路径大小写与实际文件完全一致。
- 【必须】资源从专属目录提升到 `common` 时，同步更新全部引用并确认至少存在两个实际使用方。
- 【必须】页面、布局或组件删除时，同步检查其专属资源目录并清理无引用资源。
- 【禁止】同一资源以不同名称或格式重复保存。

## 5. 质量、安全与可访问性

- 【必须】SVG 移除脚本、外部不可信引用和敏感元数据。
- 【必须】信息性图片提供准确替代文本；纯装饰图片使用空 `alt` 或 `aria-hidden="true"`。
- 【优先】在视觉质量可接受的前提下压缩资源，并选用合适格式和分辨率。
- 【禁止】提交密钥、账号、个人信息、`.DS_Store` 或编辑器临时文件。

## 6. 变更检查清单

1. 资源是否放入正确的归属目录，而不是按格式放在一级目录。
2. 目录名、文件名和扩展名是否符合命名要求。
3. 是否通过 `@/assets` 引用且大小写一致。
4. 是否存在重复、无引用或体积异常的资源。
5. SVG、安全信息和图片替代文本是否已检查。
6. 删除功能时是否同步检查专属资源。
