# 事件主题页面（原型还原）

- 时间：2026-11-25 10:14（Asia/Shanghai）
- 作者：guoshengnan
- 分支：dev_sthq_theme

## 1. 需求理解

依据事件主题页面原型还原页面，只实现原型中已有的内容；按钮点击、搜索、视图切换、新增等交互后续逐个补充。列表使用 13 条样例数据，客户端基础分页，每页 10 条，第 1 页 10 条、第 2 页 3 条。

## 2. 修改范围

| 文件                                                                   | 动作                                                           |
| ---------------------------------------------------------------------- | -------------------------------------------------------------- |
| `src/types/pages/intelligenceEventThemeType.ts`                        | 新增事件主题与事件主题分类类型                                 |
| `src/types/index.ts`                                                   | 补充类型统一出口                                               |
| `src/mocks/intelligenceEventThemesMock/intelligenceEventThemesMock.ts` | 新增 13 条确定性样例数据（装备部署 4、冲突战争 5、演习训练 4） |
| `src/views/IntelligenceEventThemes/utils/eventThemeSummary.ts`         | 新增分类统计纯函数                                             |
| `src/views/IntelligenceEventThemes/index.vue`                          | 新增事件主题页面                                               |
| `src/router/modules/intelligenceFusionRoutes.ts`                       | `IntelligenceEventThemes` 由占位页切换为新页面                 |
| `tests/intelligence-event-themes.test.mjs`                             | 新增统计函数与样例数据断言                                     |

## 3. 核心实现

1. 顶部三张分类统计卡片：按「装备部署、冲突战争、演习训练」固定顺序展示数量与占全部事件主题百分比（四舍五入），底部进度条按百分比填充。
2. 「事件主题列表」面板：标题 + 搜索输入框 + 卡片/列表视图切换按钮（列表视图高亮）+ 新增事件主题按钮，除分页外均不绑定交互。
3. 表格列：事件主题名称（青色菱形标记）、事件主题类别、时间窗口（两行）、地理区域、区域点位、事件主题描述、操作（查看、编辑、导出、删除，仅样式）。
4. 底部：左侧「共 {总数} 条」，右侧 Element Plus 分页；`currentPage` 与 10 条/页切片为唯一可用交互。
5. 全部颜色使用 `--aircas-*` 语义令牌，页面私有样式使用 `<style scoped lang="scss">`。

## 4. 类型与数据

```ts
type IntelligenceEventThemeCategory = "装备部署" | "冲突战争" | "演习训练";

interface IntelligenceEventTheme {
  id: string;
  name: string;
  category: IntelligenceEventThemeCategory;
  startTime: string;
  endTime: string;
  region: string;
  points: [number, number][];
  description: string;
}
```

样例数据前 10 条与原型一致；第 2 页 3 条按类别数量补齐（装备部署 1、冲突战争 1、演习训练 1）。

## 5. 新增依赖

无。

## 6. 验证方式

- `npm test`、`npm run test:coverage`（统计函数与数据分布）。
- `npm run type-check`、`npm run build:verify`（新增类型与页面）。
- `npm run check:project-conventions`、`npm run check:types-conventions`。
- `npm run format:check -- <本次修改文件>`。
- 36000 端口浏览器冒烟：页面加载、三张卡片数值、表格 10 行、分页切换到第 2 页 3 行、无 Console Error。
