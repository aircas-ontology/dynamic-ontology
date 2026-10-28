# Tasks：项目操作手册（带截图）

对应 [spec.md](./spec.md)。前置：25 张截图已就位（17 张合格，8 张需重拍/补拍）。

## Task 1：重拍 8 张截图

状态：已完成（2026-10-19）。全部经 browser_evaluate 派发原生事件或 URL 直达导航拍摄，逐张 Read 复查通过：无操作徽标、无 tooltip 遮挡；23 通过"输入 + 派发 Enter"触发全局搜索浮层展开；11 的行为工具栏搜索框收缩为页面在当前视口的真实渲染状态（src 未改动，如实呈现）。

操作（浏览器，http://localhost:36000，复用已登录会话；失效则经 `#/workspace/ontology-space-management?userName=admin` 重新自动登录）：

| #   | 文件（覆盖）                                                                                          | 目标状态                                                                                                  | 防瑕疵手段                                        |
| --- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1   | `manual/images/04-ontology-space-management-table.png` 同页弹窗 `04-ontology-space-create-dialog.png` | 对象空间管理页点击"新建对象空间"，弹窗（手动/导入创建、API名称、空间名称、描述、图标、取消/确定）完整可见 | browser_evaluate 派发 click；截图前鼠标移至空白处 |
| 2   | `05-ontology-space-row-more-menu.png`                                                                 | 表格视图某行"更多"下拉展开（导出/删除）                                                                   | 同上                                              |
| 3   | `06-navigation-menu-expanded.png`                                                                     | 左侧导航展开态（对象空间管理/主题空间管理/全文检索/应用管理 + AI 助手按钮）                               | 折叠按钮 click 后等待 1.5s                        |
| 4   | `08b-object-create-dialog.png`                                                                        | 空间 0928"对象"tab 点击"新建对象"，弹窗完整（手动/导入/大模型构建三方式）                                 | browser_evaluate click                            |
| 5   | `09-space-relation-workspace.png`                                                                     | 空间"关系"tab，右上"筛选/添加/重置"按钮区无 tooltip 遮挡                                                  | click tab 后鼠标移至内容区空白处再截图            |
| 6   | `11-space-behavior.png`                                                                               | 空间"行为"tab，右上按钮区无 tooltip 遮挡                                                                  | 同上                                              |
| 7   | `21-full-text-search-results.png`                                                                     | 全文检索输入 `test`，点击"检索"，结果列表（对象/空间/属性标签）渲染完整                                   | evaluate 设置输入值并派发 input + click 检索      |
| 8   | `23-global-search-dropdown.png`                                                                       | 顶部全局搜索输入 `test`，下拉建议面板展开时截图                                                           | evaluate 输入并等待面板出现，保持焦点截图         |

验收：逐张 Read 复查——无绿色操作徽标、无 tooltip 遮挡、目标 UI 状态正确。

## Task 2：编写手册 HTML

状态：已完成（2026-10-19）。`manual/operation-manual.html` 已生成：单文件、内联 CSS、相对路径引用 25 张截图；13 章节含封面/快速开始/界面导览/对象空间管理/空间内管理/对象详情/主题空间/概念模型/OntoPilot/全文检索/全局搜索/应用管理/FAQ；登录章节写明 admin / admin1 并注明失败联系管理员。Prettier format:check 已通过。

- 新建 `manual/operation-manual.html`：单文件、内联 CSS、无外部依赖；图片相对路径 `images/*.png`。
- 深色科技风（深蓝底、青色强调、卡片圆角），左侧固定目录 + 右侧正文，图片带编号图注与分步操作说明。
- 章节结构按 spec.md 第 5.2 节执行；登录章节写明账号 `admin` / 密码 `admin1`，并注明失败时联系管理员；FAQ 含浏览器要求（Chrome 130+）与演示数据说明。
- 不把整本手册内容输出到对话，直接 Write 文件。

验收：Glob 比对 HTML 中引用的图片与 `manual/images/` 磁盘文件一一对应（25 张全部被引用）。

## Task 3：验证与交付

状态：已完成（2026-10-19）。验证结果：

1. 浏览器冒烟（经 Vite 静态服务 /manual/operation-manual.html）：标题正确、25/25 图片加载无损坏、13 个目录锚点、章节排版与图注正常；Console 无手册自身错误（仅有此前 SPA 会话遗留的 Vue warn）。
2. 图片引用 Grep 与磁盘 Glob 比对：25 个 `images/*.png` 引用与文件一一对应。
3. `npm run format:check`（3 个交付文件）：通过。
4. `git diff --check` 无空白错误；`git status --short` 仅新增 `manual/`、`specs/`，未触碰 src/ 与受保护目录。
5. 验证缺口说明：纯静态文档，不适用 npm test / type-check / build:verify；HTML 与 Markdown 已纳入 Prettier 检查并格式化。

1. 浏览器打开 `manual/operation-manual.html` 冒烟检查：排版、目录锚点跳转、图片加载、Console 无错误。
2. `git status --short` 确认仅新增 `manual/`、`specs/`，未触碰用户已有修改与受保护目录。
3. 输出交付说明：截图清单、登录方式说明（admin/admin1 真实后端校验失败，演示数据经嵌入模式自动登录获取）、未做 src/ 改动；用 `computer://` 链接手册文件。
4. 汇报验证缺口：纯静态文档，不适用 npm test / type-check；已执行格式不适用说明（HTML 非 Prettier 管辖范围时注明）。
